
const $=id=>document.getElementById(id);
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function rupiah(n){return 'Rp '+Number(n||0).toLocaleString('id-ID')}
function formatDateID(v){
  const s=String(v||'').trim();
  if(!s)return '';
  const m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m?`${m[3]}-${m[2]}-${m[1]}`:s;
}

function apiGet(params={}){
  return new Promise((resolve,reject)=>{
    const cb='being_cb_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    const u=new URL(API_URL);
    Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,v ?? ''));
    u.searchParams.set('callback',cb);
    u.searchParams.set('_',Date.now());
    const s=document.createElement('script');
    const timer=setTimeout(()=>finish(new Error('API timeout.')),15000);
    function cleanup(){clearTimeout(timer);delete window[cb];s.remove()}
    function finish(err,data){cleanup();err?reject(err):resolve(data)}
    window[cb]=data=>finish(null,data);
    s.onerror=()=>finish(new Error('API tidak dapat dimuat.'));
    s.src=u.toString();document.head.appendChild(s);
  });
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
  const explicit=String(p.mediaType||'').toUpperCase();
  const u=String(p.mediaUrl||'').trim();
  const low=u.toLowerCase();

  // Flyer dari Google Drive tetap dianggap IMAGE
  // walaupun API mengirim mediaType = LINK.
  if(driveFileId(u)) return 'IMAGE';

  if(explicit==='IMAGE') return 'IMAGE';
  if(explicit==='PDF') return 'PDF';
  if(/\.(jpg|jpeg|png|webp)(\?|$)/.test(low)) return 'IMAGE';
  if(/\.pdf(\?|$)/.test(low)) return 'PDF';
  return low ? 'LINK' : '';
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
    <div class="program-meta"><span class="program-badge">${paid?'BERBAYAR':'GRATIS'}</span>${p.tanggalMulai?`<span class="program-badge">Tanggal Kegiatan: ${esc(formatDateID(p.tanggalMulai))}${p.tanggalAkhir&&p.tanggalAkhir!==p.tanggalMulai?' – '+esc(formatDateID(p.tanggalAkhir)):''}</span>`:''}</div>
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
    Object.values(targets).forEach(el=>{if(el)el.innerHTML='<div class="notice">Program belum dapat dimuat. Silakan refresh halaman beberapa saat lagi.</div>'});
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
    <p><b>Nominal:</b> ${rupiah(x.amountDue)}</p>
    <p>Instruksi pembayaran dan <b>link Upload Bukti Pembayaran</b> telah dikirim ke email yang digunakan saat pendaftaran.</p>
    <p class="mut">Silakan lakukan pembayaran terlebih dahulu, kemudian buka kembali email dari BEING dan klik tombol <b>Upload Bukti Pembayaran</b>.</p>
    ${p.qrisUrl?`<p><a class="btn secondary" target="_blank" rel="noopener" href="${esc(p.qrisUrl)}">Buka QRIS</a></p>`:''}
    <div class="notice" style="margin-top:12px"><b>Tidak menerima email?</b><br>Periksa folder Spam/Promosi dan pastikan alamat email saat mendaftar sudah benar.</div>
  </div>`;
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
