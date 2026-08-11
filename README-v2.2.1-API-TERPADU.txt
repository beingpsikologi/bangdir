BANGDIR LAMA STABIL v2.2.1 — API TERPADU

Tujuan:
Mempertahankan frontend Bangdir lama yang sudah terbukti stabil, tetapi menyambungkannya
ke backend Apps Script yang sama dengan BEING Admin Terpadu.

API yang dipakai:
https://script.google.com/macros/s/AKfycbxhg_eJiiFWXNKYdzrJGVpX16kDbwa3LNePMWNCGl4EVEjfD4IYs4znMsmtkitCoMmawA/exec

Perubahan HANYA:
1. Dibuat assets/js/config.js yang menunjuk ke API di atas.
2. Tanggal landing: DD-MM-YYYY.
3. Label tanggal program: "Tanggal Kegiatan".
4. MyBeing memakai API yang sama dengan landing/admin.
5. MyBeing punya tombol Refresh dan otomatis refresh saat tab kembali aktif.
6. Tanggal program/sesi di MyBeing: DD-MM-YYYY.

TIDAK mengubah:
- Spreadsheet
- struktur pendaftaran
- program
- peserta
- pembayaran
- backend Code.gs

Agar update Admin muncul di MyBeing:
Admin, landing Bangdir, dan MyBeing HARUS memakai URL /exec Apps Script yang sama.
Paket ini sudah mengunci landing + MyBeing ke URL di atas.

CARA PASANG:
Upload seluruh isi folder ini ke repo Bangdir lama.
Pastikan index.html, akses.html, dan assets/ berada di root repo.
Lalu Ctrl+F5 / incognito.

TES:
1. Admin Terpadu -> buat/ubah sesi dan materi pada satu program.
2. Pastikan status sesi/materi PUBLIKASI.
3. Buka MyBeing dengan kode peserta program tersebut.
4. Klik Refresh.
5. Sesi dan materi terbaru harus muncul.
