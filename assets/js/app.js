
const $=id=>document.getElementById(id);
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function rupiah(n){return 'Rp '+Number(n||0).toLocaleString('id-ID')}

async function apiGet(params={}){
  const u=new URL(API_URL);
  Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,v ?? ''));
  u.searchParams.set('_',Date.now());
  const r=await fetch(u.toString(),{cache:'no-store',redirect:'follow'});
  const txt=await r.text();
  try{return JSON.parse(txt)}catch{throw new Error('Respons API tidak dapat dibaca.')}
}
async function apiPost(params={}){
  const body=new URLSearchParams();
  Object.entries(params).forEach(([k,v])=>body.append(k,v ?? ''));
  const r=await fetch(API_URL,{method:'POST',body,redirect:'follow'});
  const txt=await r.text();
  try{return JSON.parse(txt)}catch{throw new Error('Respons API tidak dapat dibaca. Deploy ulang Apps Script.')}
}

function driveFileId(url){
  const u=String(url||'').trim(); let m=u.match(/drive\.google\.com\/file\/d\/([^/?#]+)/i);
  if(m&&m[1])return m[1]; m=u.match(/[?&]id=([^&#]+)/i); return (m&&m[1])?m[1]:'';
}
function normalizeDriveLink(url,forImage=false){
  const u=String(url||'').trim(); if(!u)return ''; const id=driveFileId(u);
  return id?(forImage?`https://drive.google.com/thumbnail?id=${id}&sz=w1200`:`https://drive.google.com/file/d/${id}/view`):u;
}
function inferMediaType(p){
  const explicit=String(p.mediaType||'').toUpperCase(); if(explicit)return explicit;
  const u=String(p.mediaUrl||'').toLowerCase();
  if(/\.(jpg|jpeg|png|webp)(\?|$)/.test(u))return'IMAGE';
  if(/\.pdf(\?|$)/.test(u))return'PDF'; return u?'LINK':'';
}
function programMedia(p){
  if(!p.mediaUrl)return '';
  const type=inferMediaType(p),openUrl=normalizeDriveLink(p.mediaUrl,false);
  if(type==='IMAGE'){
    const src=normalizeDriveLink(p.mediaUrl,true);
    return `<div class="program-media-wrap"><a href="${esc(openUrl)}" target="_blank" rel="noopener" class="program-media"><img src="${esc(src)}" alt="Flyer ${esc(p.nama)}" loading="lazy" onerror="this.style.display='none';this.parentElement.classList.add('media-fallback');this.parentElement.innerHTML='<span>Lihat Flyer Program</span>'"></a></div>`;
  }
  if(type==='PDF')return `<div class="program-media-action"><a class="btn soft" target="_blank" rel="noopener" href="${esc(openUrl)}">Lihat Brosur PDF</a></div>`;
  return `<div class="program-media-action"><a class="btn soft" target="_blank" rel="noopener" href="${esc(openUrl)}">Lihat Informasi Program</a></div>`;
}
function selectProgram(id){const s=$('publicProgramSelect');if(s){s.value=id;$('daftar')?.scrollIntoView({behavior:'smooth'})}}
function categoryKey(p){
  const raw=String(p.kategori||'').toUpperCase();
  if(raw.includes('SHARING'))return'sharing';
  if(raw.includes('BOOTCAMP'))return'bootcamp';
  if(raw.includes('BNSP')||raw.includes('SERTIFIKASI'))return'bnsp';
  return'';
}
function programCard(p){
  const paid=p.pricingType==='BERBAYAR';
  return `<article class="pillar">
    <div class="num">${esc(p.kategori)}</div>
    <h3>${esc(p.nama)}</h3>
    ${programMedia(p)}
    <div class="program-meta"><span class="program-badge">${paid?'BERBAYAR':'GRATIS'}</span>${p.tanggalMulai?`<span class="program-badge">${esc(p.tanggalMulai)}${p.tanggalAkhir?' – '+esc(p.tanggalAkhir):''}</span>`:''}</div>
    ${paid?`<div class="program-price">${rupiah(p.price)}</div>`:'<div class="program-price">Tanpa biaya</div>'}
    <p>${esc(p.deskripsi||'Program Pengembangan Diri BEING.')}</p>
    <a class="btn soft" href="#daftar" onclick="selectProgram('${esc(p.programId)}')">Daftar</a>
  </article>`;
}
async function loadPrograms(){
  const targets={sharing:$('sharingPrograms'),bootcamp:$('bootcampPrograms'),bnsp:$('bnspPrograms')};
  const sel=$('publicProgramSelect');
  try{
    const x=await apiGet({action:'publicPrograms'});
    if(!x.ok)throw new Error(x.message||'Gagal memuat program.');
    const list=x.data||[];
    Object.entries(targets).forEach(([key,el])=>{
      if(!el)return; const rows=list.filter(p=>categoryKey(p)===key);
      const label=key==='sharing'?'Sharing Knowledge':key==='bootcamp'?'Bootcamp':'Sertifikasi BNSP';
      el.innerHTML=rows.length?rows.map(programCard).join(''):`<div class="notice">Belum ada program aktif untuk ${label}.</div>`;
    });
    if(sel)sel.innerHTML='<option value="">Pilih program...</option>'+list.map(p=>`<option value="${esc(p.programId)}">${esc(p.kategori)} • ${esc(p.nama)} • ${p.pricingType==='BERBAYAR'?rupiah(p.price):'Gratis'}</option>`).join('');
  }catch(e){
    Object.values(targets).forEach(el=>{if(el)el.innerHTML='<div class="notice">Program belum dapat dimuat. Periksa API Apps Script.</div>'});
    if(sel)sel.innerHTML='<option value="">Program belum tersedia</option>';
  }
}

function normalizeWa(wa){
  const raw=String(wa||'').replace(/\D/g,''); if(!raw)return'';
  if(raw.startsWith('0'))return'62'+raw.slice(1); if(raw.startsWith('62'))return raw; return raw;
}
function waSelfLink(wa,link){
  const num=normalizeWa(wa);
  const txt=`Halo, berikut akses MyBeing BEING saya:\n${link}`;
  return `https://wa.me/${num}?text=${encodeURIComponent(txt)}`;
}
function fileToDataUrl(file){
  return new Promise((resolve,reject)=>{
    const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(file);
  });
}
async function showPaidFlow(x,wa){
  const n=$('regNotice'), p=x.payment||{};
  n.innerHTML=`<div class="payment-panel">
    <h3>Pendaftaran diterima • Menunggu Pembayaran</h3>
    <p><b>${esc(x.programNama||'Program')}</b></p>
    <div class="pay-grid">
      <div>
        <p><b>Nominal:</b> ${rupiah(x.amountDue)}</p>
        <p><b>Bank:</b> ${esc(p.bankName||'-')}<br><b>No. Rekening:</b> ${esc(p.accountNumber||'-')}<br><b>Atas nama:</b> ${esc(p.accountHolder||'-')}</p>
        ${p.qrisUrl?`<p><a class="btn secondary" target="_blank" href="${esc(p.qrisUrl)}">Buka QRIS</a></p>`:''}
      </div>
      <div>
        <label><b>Upload bukti pembayaran</b></label>
        <input id="proofFile" type="file" accept="image/*,.pdf">
        <small>Maksimal 2 MB. JPG/PNG/PDF.</small>
        <button id="proofBtn" class="btn primary" type="button" style="margin-top:10px">Kirim Bukti Pembayaran</button>
        <div id="proofMsg" class="notice" style="margin-top:10px"></div>
      </div>
    </div>
  </div>`;
  $('proofBtn').onclick=async()=>{
    const f=$('proofFile').files[0],msg=$('proofMsg');
    if(!f){msg.textContent='Pilih file bukti pembayaran terlebih dahulu.';return}
    if(f.size>2*1024*1024){msg.textContent='Ukuran file maksimal 2 MB.';return}
    $('proofBtn').disabled=true; msg.textContent='Mengirim bukti...';
    try{
      const data=await fileToDataUrl(f);
      const r=await apiPost({action:'submitPayment',pesertaId:x.pesertaId,fileName:f.name,mimeType:f.type,fileData:data});
      msg.innerHTML=r.ok?'<b>Bukti berhasil dikirim.</b><br>Studio akan memverifikasi pembayaran. Setelah disetujui, link MyBeing dikirim otomatis melalui email.':'<b>Belum berhasil.</b><br>'+esc(r.message||'');
    }catch(e){msg.textContent='Gagal mengirim bukti pembayaran.'}
    finally{$('proofBtn').disabled=false}
  };
}

const regForm=$('registerForm');
if(regForm)regForm.addEventListener('submit',async e=>{
  e.preventDefault();
  const f=e.currentTarget,btn=f.querySelector('button[type="submit"]'),n=$('regNotice'),d=new FormData(f);
  btn.disabled=true;btn.textContent='Mengirim...';n.hidden=true;
  try{
    const wa=String(d.get('whatsapp')||'').trim();
    const x=await apiPost({
      action:'register',programId:d.get('program'),nama:String(d.get('name')||'').trim(),
      email:String(d.get('email')||'').trim(),wa,institution:String(d.get('institution')||'').trim(),note:String(d.get('note')||'').trim()
    });
    n.hidden=false;
    if(!x.ok){n.innerHTML='<b>Pendaftaran belum berhasil.</b><br>'+esc(x.message||'Silakan coba kembali.');return}
    if(x.pricingType==='GRATIS'){
      const access=esc(x.accessUrl||'');
      n.innerHTML=`<b>Pendaftaran berhasil dan langsung aktif.</b><br>Email akses telah dikirim dari BEING.
        <div class="actions" style="margin-top:12px"><a class="btn primary" href="${access}">Buka MyBeing</a>
        <a class="btn secondary" target="_blank" rel="noopener" href="${waSelfLink(wa,x.accessUrl)}">Buka di WhatsApp</a></div>`;
      f.reset();
    }else{
      await showPaidFlow(x,wa);
      f.reset();
    }
  }catch(e){
    n.hidden=false;n.innerHTML='<b>Pendaftaran gagal dikirim.</b><br>'+esc(e.message||'Periksa koneksi dan URL API.');
  }finally{btn.disabled=false;btn.textContent='Kirim Pendaftaran'}
});
loadPrograms();
