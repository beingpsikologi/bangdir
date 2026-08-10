BEING PENGEMBANGAN DIRI — VERSI SEDERHANA v1.1

Tampilan publik memakai index Pengembangan Diri v3.9 yang Bro kirim, sedangkan backend dibuat terpisah dan sederhana.

FILE:
- index.html = halaman publik profesional v3.9 + program/pendaftaran sederhana
- studio.html = admin program/peserta/materi
- akses.html = MyBeing peserta
- Code.gs = Apps Script backend terpisah

PENTING:
1. Gunakan Spreadsheet BARU dan Apps Script BARU. Jangan timpa sistem v3.9.
2. Tempel Code.gs, isi SPREADSHEET_ID dan ADMIN_KEY.
3. Jalankan setupBeingLite() sekali.
4. Deploy Web App: Execute as Me, Who has access: Anyone.
5. Salin URL /exec.
6. Ganti GANTI_DENGAN_URL_WEB_APP_APPS_SCRIPT pada index.html, studio.html, akses.html.
7. Setiap Code.gs berubah: Deploy > Manage deployments > Edit > New version > Deploy.

LIVE SERVER:
Versi ini memakai POST application/x-www-form-urlencoded sehingga lebih stabil dari http://127.0.0.1:5500.

ASSET v3.9:
index.html tetap memakai assets/css/style.css dan link sharing/, bootcamp/, bnsp/ milik v3.9. Letakkan file ini di folder v3.9 Bro agar tampilannya sama persis.

ALUR UJI:
Studio > Buat Program > index.html > Daftar > Studio > Aktifkan > Tambah Materi > Salin Link > akses.html/MyBeing.
