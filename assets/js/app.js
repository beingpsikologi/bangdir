
const $=id=>document.getElementById(id);
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

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
  try{return JSON.parse(txt)}catch{throw new Error('Respons pendaftaran tidak dapat dibaca. Deploy ulang Apps Script.')}
}



function driveFileId(url){
  const u=String(url||'').trim();
  let m=u.match(/drive\.google\.com\/file\/d\/([^/?#]+)/i);
  if(m && m[1]) return m[1];
  m=u.match(/[?&]id=([^&#]+)/i);
  return (m && m[1]) ? m[1] : '';
}

function normalizeDriveLink(url, forImage=false){
  const u=String(url||'').trim();
  if(!u) return '';
  const id=driveFileId(u);
  if(id){
    // thumbnail is usually more reliable for browser preview than uc?export=view
    return forImage
      ? `https://drive.google.com/thumbnail?id=${id}&sz=w1200`
      : `https://drive.google.com/file/d/${id}/view`;
  }
  return u;
}

function inferMediaType(p){
  const explicit=String(p.mediaType||'').toUpperCase();
  if(explicit) return explicit;
  const u=String(p.mediaUrl||'').toLowerCase();
  if(/\.(jpg|jpeg|png|webp)(\?|$)/.test(u)) return 'IMAGE';
  if(/\.pdf(\?|$)/.test(u)) return 'PDF';
  return u ? 'LINK' : '';
}

function programMedia(p){
  if(!p.mediaUrl) return '';
  const type=inferMediaType(p);
  const openUrl=normalizeDriveLink(p.mediaUrl,false);

  if(type==='IMAGE'){
    const src=normalizeDriveLink(p.mediaUrl,true);
    return `<div class="program-media-wrap">
      <a href="${esc(openUrl)}" target="_blank" rel="noopener" class="program-media">
        <img src="${esc(src)}" alt="Flyer ${esc(p.nama)}" loading="lazy"
             onerror="this.style.display='none';this.parentElement.classList.add('media-fallback');this.parentElement.innerHTML='<span>Lihat Flyer Program</span>'">
      </a>
    </div>`;
  }

  if(type==='PDF'){
    return `<div class="program-media-action">
      <a class="btn soft" target="_blank" rel="noopener" href="${esc(openUrl)}">Lihat Brosur PDF</a>
    </div>`;
  }

  return `<div class="program-media-action">
    <a class="btn soft" target="_blank" rel="noopener" href="${esc(openUrl)}">Lihat Informasi Program</a>
  </div>`;
}

function selectProgram(id){
  const s=$('publicProgramSelect'); if(s) s.value=id;
}

async function loadPrograms(){
  const cards=$('activeProgramCards');
  const sel=$('publicProgramSelect');
  try{
    const x=await apiGet({action:'publicPrograms'});
    if(!x.ok) throw new Error(x.message||'Gagal memuat program.');
    const list=x.data||[];
    cards.innerHTML=list.length?list.map(p=>`
      <article class="pillar">
        <div class="num">PROGRAM</div>
        <h3>${esc(p.nama)}</h3>
        ${programMedia(p)}
        <p>${esc(p.deskripsi||'Program Pengembangan Diri BEING.')}</p>
        <a class="btn soft" href="#daftar" onclick="selectProgram('${esc(p.programId)}')">Daftar Program</a>
      </article>`).join(''):'<div class="notice">Belum ada program yang sedang dibuka.</div>';
    sel.innerHTML='<option value="">Pilih program...</option>'+list.map(p=>`<option value="${esc(p.programId)}">${esc(p.nama)}</option>`).join('');
  }catch(e){
    cards.innerHTML='<div class="notice">Program belum dapat dimuat. Periksa API Apps Script.</div>';
    sel.innerHTML='<option value="">Program belum tersedia</option>';
  }
}

$('registerForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const f=e.currentTarget, btn=f.querySelector('button[type="submit"]'), n=$('regNotice'), d=new FormData(f);
  btn.disabled=true; btn.textContent='Mengirim...'; n.hidden=true;
  try{
    const x=await apiPost({
      action:'register',
      programId:d.get('program'),
      nama:String(d.get('name')||'').trim(),
      email:String(d.get('email')||'').trim(),
      wa:String(d.get('whatsapp')||'').trim(),
      institution:String(d.get('institution')||'').trim(),
      note:String(d.get('note')||'').trim()
    });
    n.hidden=false;
    n.innerHTML=x.ok?'<b>Pendaftaran berhasil.</b><br>Informasi akses akan dikirim setelah pendaftaran dikonfirmasi.':'<b>Pendaftaran belum berhasil.</b><br>'+esc(x.message||'Silakan coba kembali.');
    if(x.ok) f.reset();
  }catch(e){
    n.hidden=false; n.innerHTML='<b>Pendaftaran gagal dikirim.</b><br>'+esc(e.message||'Periksa koneksi dan URL API.');
  }finally{
    btn.disabled=false; btn.textContent='Kirim Pendaftaran';
  }
});
loadPrograms();
