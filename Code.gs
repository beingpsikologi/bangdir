/**
 * BEING - PENGEMBANGAN DIRI • BACKEND SEDERHANA v1.8
 * Backend terpisah dari sistem Pengembangan Diri utama.
 */

const CONFIG = {
  SPREADSHEET_ID: 'GANTI_DENGAN_SPREADSHEET_ID_BARU',
  ADMIN_KEY: 'GANTI_DENGAN_KUNCI_ADMIN_YANG_PANJANG',
  WEB_BASE_URL: 'https://USERNAME.github.io/NAMA-REPO/'
};

const SHEETS = {
  PROGRAM: ['ProgramID','Nama','Deskripsi','Status','Tanggal','MediaURL','MediaType'],
  PESERTA: ['PesertaID','ProgramID','Nama','Email','WA','Instansi','Catatan','Status','AccessToken','TanggalDaftar','TanggalAktif'],
  MATERI: ['MateriID','ProgramID','Judul','Deskripsi','Link','Status','Tanggal']
};

function setupBeingLite(){
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

  Object.keys(SHEETS).forEach(name=>{
    let sh = ss.getSheetByName(name);
    if(!sh) sh = ss.insertSheet(name);

    if(sh.getLastRow() === 0){
      sh.getRange(1,1,1,SHEETS[name].length).setValues([SHEETS[name]]);
    } else {
      ensureHeaders_(sh, SHEETS[name]);
    }
    sh.setFrozenRows(1);
  });

  // Memperbaiki otomatis program yang sempat bergeser akibat versi 1.7.
  repairProgramRows_();

  return 'Setup selesai. Header dan data PROGRAM sudah diperiksa.';
}

function setupBeingSederhana(){
  return setupBeingLite();
}

function ensureHeaders_(sh, required){
  const lastCol = Math.max(sh.getLastColumn(),1);
  const current = sh.getRange(1,1,1,lastCol).getValues()[0].map(v=>String(v).trim());

  required.forEach(header=>{
    if(!current.includes(header)){
      sh.getRange(1,sh.getLastColumn()+1).setValue(header);
      current.push(header);
    }
  });
}

function headerMap_(sh){
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(v=>String(v).trim());
  const map = {};
  headers.forEach((h,i)=>map[h]=i+1);
  return map;
}

function appendObject_(sheetName, obj){
  const sh = sh_(sheetName);
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(v=>String(v).trim());
  const row = headers.map(h => Object.prototype.hasOwnProperty.call(obj,h) ? obj[h] : '');
  sh.appendRow(row);
}

function repairProgramRows_(){
  const sh = sh_('PROGRAM');
  if(sh.getLastRow() < 2) return;

  const map = headerMap_(sh);
  const required = ['Status','Tanggal','MediaURL','MediaType'];
  if(required.some(h=>!map[h])) return;

  const lastRow = sh.getLastRow();

  for(let r=2;r<=lastRow;r++){
    const status = String(sh.getRange(r,map.Status).getValue() || '').trim();
    const tanggal = sh.getRange(r,map.Tanggal).getValue();
    const mediaUrl = String(sh.getRange(r,map.MediaURL).getValue() || '').trim();
    const mediaTypeRaw = sh.getRange(r,map.MediaType).getValue();
    const mediaType = String(mediaTypeRaw || '').trim();

    // Pola data salah versi 1.7:
    // Status = URL
    // Tanggal = IMAGE/PDF/LINK
    // MediaURL = BUKA/TUTUP
    // MediaType = tanggal
    const looksUrl = /^https?:\/\//i.test(status);
    const looksType = /^(IMAGE|PDF|LINK)$/i.test(String(tanggal || '').trim());
    const looksStatus = /^(BUKA|TUTUP)$/i.test(mediaUrl);

    if(looksUrl && looksType && looksStatus){
      sh.getRange(r,map.MediaURL).setValue(status);
      sh.getRange(r,map.MediaType).setValue(String(tanggal).toUpperCase());
      sh.getRange(r,map.Status).setValue(mediaUrl);
      sh.getRange(r,map.Tanggal).setValue(mediaTypeRaw || new Date());
    }
  }
}

function doGet(e){
  try{
    const p = e && e.parameter ? e.parameter : {};
    const action = p.action || 'ping';

    if(action === 'ping') return out({ok:true,message:'BEING Pengembangan Diri API aktif'});
    if(action === 'publicPrograms') return out({ok:true,data:getPublicPrograms_()});
    if(action === 'portal') return out(getPortal_(p.token || ''));

    requireAdmin_(p.adminKey);

    if(action === 'adminPrograms') return out({ok:true,data:getPrograms_()});
    if(action === 'adminParticipants') return out({ok:true,data:getParticipants_()});
    if(action === 'adminMaterials') return out({ok:true,data:getMaterials_()});

    return out({ok:false,message:'Action tidak dikenal'});
  }catch(err){
    return out({ok:false,message:String(err.message || err)});
  }
}

function doPost(e){
  try{
    let body = {};

    if(e && e.parameter && Object.keys(e.parameter).length){
      body = e.parameter;
    } else if(e && e.postData && e.postData.contents){
      try{ body = JSON.parse(e.postData.contents); }
      catch(_){ body = {}; }
    }

    const action = body.action || '';

    if(action === 'register') return out(register_(body));

    requireAdmin_(body.adminKey);

    if(action === 'createProgram') return out(createProgram_(body));
    if(action === 'createMaterial') return out(createMaterial_(body));
    if(action === 'activateParticipant') return out(activateParticipant_(body));
    if(action === 'setProgramStatus') return out(setProgramStatus_(body));
    if(action === 'setProgramMedia') return out(setProgramMedia_(body));
    if(action === 'deleteProgram') return out(deleteProgram_(body));
    if(action === 'setMaterialStatus') return out(setMaterialStatus_(body));

    return out({ok:false,message:'Action tidak dikenal'});
  }catch(err){
    return out({ok:false,message:String(err.message || err)});
  }
}

function out(obj){
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function ss_(){
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
}

function sh_(name){
  const sh = ss_().getSheetByName(name);
  if(!sh) throw new Error('Sheet '+name+' belum ada. Jalankan setupBeingLite().');
  return sh;
}

function rows_(name){
  const sh = sh_(name);
  const values = sh.getDataRange().getValues();
  if(values.length < 2) return [];

  const headers = values.shift().map(v=>String(v).trim());

  return values
    .filter(r=>r.some(v=>v !== '' && v !== null))
    .map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]])));
}

function requireAdmin_(key){
  if(!key || String(key) !== String(CONFIG.ADMIN_KEY)){
    throw new Error('Kunci admin tidak valid.');
  }
}

function id_(prefix){
  return prefix+'-'+Utilities.getUuid().replace(/-/g,'').slice(0,10).toUpperCase();
}

function token_(){
  return 'BEING-'+Utilities.getUuid().replace(/-/g,'').slice(0,8).toUpperCase();
}

function now_(){
  return new Date();
}

function inferMediaType_(url, explicit){
  const t = String(explicit || '').trim().toUpperCase();
  if(t) return t;

  const u = String(url || '').toLowerCase();
  if(/\.(jpg|jpeg|png|webp)(\?|$)/.test(u)) return 'IMAGE';
  if(/\.pdf(\?|$)/.test(u)) return 'PDF';

  return u ? 'LINK' : '';
}

function getPrograms_(){
  return rows_('PROGRAM').map(r=>({
    programId:String(r.ProgramID || ''),
    nama:String(r.Nama || ''),
    deskripsi:String(r.Deskripsi || ''),
    mediaUrl:String(r.MediaURL || ''),
    mediaType:inferMediaType_(r.MediaURL, r.MediaType),
    status:String(r.Status || '').trim().toUpperCase(),
    tanggal:r.Tanggal || ''
  }));
}

function getPublicPrograms_(){
  return getPrograms_().filter(p=>p.status === 'BUKA');
}

function createProgram_(b){
  const nama = String(b.nama || '').trim();
  if(!nama) return {ok:false,message:'Nama program wajib diisi.'};

  const mediaUrl = String(b.mediaUrl || '').trim();
  const mediaType = inferMediaType_(mediaUrl, b.mediaType);

  appendObject_('PROGRAM',{
    ProgramID:id_('PRG'),
    Nama:nama,
    Deskripsi:String(b.deskripsi || '').trim(),
    Status:String(b.status || 'BUKA').trim().toUpperCase(),
    Tanggal:now_(),
    MediaURL:mediaUrl,
    MediaType:mediaType
  });

  return {ok:true,message:'Program berhasil dibuat.'};
}

function setProgramStatus_(b){
  updateById_('PROGRAM','ProgramID',b.programId,'Status',String(b.status||'').toUpperCase());
  return {ok:true,message:'Status program diperbarui.'};
}

function setProgramMedia_(b){
  const programId = String(b.programId || '').trim();
  const mediaUrl = String(b.mediaUrl || '').trim();
  const mediaType = inferMediaType_(mediaUrl, b.mediaType);

  if(!programId) return {ok:false,message:'Program tidak ditemukan.'};

  updateById_('PROGRAM','ProgramID',programId,'MediaURL',mediaUrl);
  updateById_('PROGRAM','ProgramID',programId,'MediaType',mediaType);

  return {
    ok:true,
    message: mediaUrl ? 'Media program berhasil disimpan.' : 'Media program dihapus.'
  };
}

function deleteProgram_(b){
  const programId = String(b.programId || '').trim();
  if(!programId) return {ok:false,message:'Program tidak ditemukan.'};

  // Untuk menjaga data peserta dan materi, program yang sudah pernah dipakai
  // tidak dihapus secara fisik. Admin harus menghapus/menangani data terkait dahulu.
  const pesertaCount = rows_('PESERTA').filter(r=>String(r.ProgramID || '') === programId).length;
  const materiCount = rows_('MATERI').filter(r=>String(r.ProgramID || '') === programId).length;

  if(pesertaCount > 0 || materiCount > 0){
    return {
      ok:false,
      message:`Program belum dapat dihapus karena masih memiliki ${pesertaCount} peserta dan ${materiCount} materi. Tutup program bila hanya ingin menyembunyikannya.`
    };
  }

  const sh = sh_('PROGRAM');
  const map = headerMap_(sh);

  for(let r=2;r<=sh.getLastRow();r++){
    if(String(sh.getRange(r,map.ProgramID).getValue()) === programId){
      sh.deleteRow(r);
      return {ok:true,message:'Program berhasil dihapus.'};
    }
  }

  return {ok:false,message:'Program tidak ditemukan.'};
}

function register_(b){
  const programId = String(b.programId || '').trim();
  const nama = String(b.nama || '').trim();
  const email = String(b.email || '').trim();
  const wa = String(b.wa || '').trim();

  if(!programId || !nama || !email || !wa){
    return {ok:false,message:'Data pendaftaran belum lengkap.'};
  }

  const program = getPrograms_().find(p=>p.programId === programId && p.status === 'BUKA');
  if(!program) return {ok:false,message:'Program tidak tersedia atau sudah ditutup.'};

  const dup = rows_('PESERTA').find(r=>
    String(r.ProgramID) === programId &&
    String(r.Email || '').toLowerCase() === email.toLowerCase()
  );

  if(dup) return {ok:false,message:'Email ini sudah terdaftar pada program tersebut.'};

  appendObject_('PESERTA',{
    PesertaID:id_('PST'),
    ProgramID:programId,
    Nama:nama,
    Email:email,
    WA:wa,
    Instansi:String(b.institution || '').trim(),
    Catatan:String(b.note || '').trim(),
    Status:'MENUNGGU',
    AccessToken:'',
    TanggalDaftar:now_(),
    TanggalAktif:''
  });

  return {ok:true,message:'Pendaftaran berhasil. Informasi akses akan dikirim setelah pendaftaran dikonfirmasi.'};
}

function getParticipants_(){
  const programs = Object.fromEntries(getPrograms_().map(p=>[p.programId,p.nama]));

  return rows_('PESERTA').map(r=>({
    pesertaId:String(r.PesertaID || ''),
    programId:String(r.ProgramID || ''),
    programNama:programs[String(r.ProgramID || '')] || '-',
    nama:String(r.Nama || ''),
    email:String(r.Email || ''),
    wa:String(r.WA || ''),
    institution:String(r.Instansi || ''),
    note:String(r.Catatan || ''),
    status:String(r.Status || ''),
    accessToken:String(r.AccessToken || ''),
    tanggalDaftar:r.TanggalDaftar || '',
    tanggalAktif:r.TanggalAktif || ''
  })).reverse();
}

function activateParticipant_(b){
  const sh = sh_('PESERTA');
  const map = headerMap_(sh);
  const data = sh.getDataRange().getValues();

  for(let r=2;r<=data.length;r++){
    if(String(sh.getRange(r,map.PesertaID).getValue()) === String(b.pesertaId)){
      let token = sh.getRange(r,map.AccessToken).getValue();
      if(!token) token = token_();

      sh.getRange(r,map.Status).setValue('AKTIF');
      sh.getRange(r,map.AccessToken).setValue(token);
      sh.getRange(r,map.TanggalAktif).setValue(now_());

      return {ok:true,message:'Peserta aktif. Link akses siap digunakan.',accessToken:String(token)};
    }
  }

  return {ok:false,message:'Peserta tidak ditemukan.'};
}

function createMaterial_(b){
  if(!b.programId || !b.judul || !b.link){
    return {ok:false,message:'Program, judul, dan link materi wajib diisi.'};
  }

  appendObject_('MATERI',{
    MateriID:id_('MAT'),
    ProgramID:String(b.programId),
    Judul:String(b.judul),
    Deskripsi:String(b.deskripsi || ''),
    Link:String(b.link),
    Status:String(b.status || 'PUBLIKASI').toUpperCase(),
    Tanggal:now_()
  });

  return {ok:true,message:'Materi berhasil disimpan.'};
}

function setMaterialStatus_(b){
  updateById_('MATERI','MateriID',b.materiId,'Status',String(b.status||'').toUpperCase());
  return {ok:true,message:'Status materi diperbarui.'};
}

function getMaterials_(){
  const programs = Object.fromEntries(getPrograms_().map(p=>[p.programId,p.nama]));

  return rows_('MATERI').map(r=>({
    materiId:String(r.MateriID || ''),
    programId:String(r.ProgramID || ''),
    programNama:programs[String(r.ProgramID || '')] || '-',
    judul:String(r.Judul || ''),
    deskripsi:String(r.Deskripsi || ''),
    link:String(r.Link || ''),
    status:String(r.Status || ''),
    tanggal:r.Tanggal || ''
  })).reverse();
}

function getPortal_(token){
  token = String(token || '').trim();
  if(!token) return {ok:false,message:'Kode akses belum diisi.'};

  const peserta = rows_('PESERTA').find(r=>
    String(r.AccessToken || '') === token &&
    String(r.Status || '') === 'AKTIF'
  );

  if(!peserta) return {ok:false,message:'Kode akses tidak valid atau peserta belum aktif.'};

  const program = getPrograms_().find(p=>p.programId === String(peserta.ProgramID || ''));
  if(!program) return {ok:false,message:'Program tidak ditemukan.'};

  const materi = getMaterials_().filter(m=>
    m.programId === String(peserta.ProgramID || '') &&
    m.status === 'PUBLIKASI'
  );

  return {
    ok:true,
    data:{
      peserta:{
        nama:String(peserta.Nama || ''),
        email:String(peserta.Email || '')
      },
      program,
      materi
    }
  };
}

function updateById_(sheetName,idHeader,idValue,targetHeader,newValue){
  const sh = sh_(sheetName);
  const map = headerMap_(sh);

  if(!map[idHeader] || !map[targetHeader]){
    throw new Error('Header sheet tidak sesuai.');
  }

  for(let r=2;r<=sh.getLastRow();r++){
    if(String(sh.getRange(r,map[idHeader]).getValue()) === String(idValue)){
      sh.getRange(r,map[targetHeader]).setValue(newValue);
      return;
    }
  }

  throw new Error('Data tidak ditemukan.');
}
