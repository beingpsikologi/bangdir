BEING Pengembangan Diri v2.4 — FIX MyBeing & Format Tanggal

PERUBAHAN
1. Tanggal program di halaman publik tampil sebagai:
   Tanggal Kegiatan: DD-MM-YYYY
   Jika berupa rentang: DD-MM-YYYY – DD-MM-YYYY
2. Tanggal program dan sesi di MyBeing memakai DD-MM-YYYY.
3. MyBeing memiliki tombol Refresh.
4. Saat tab MyBeing kembali aktif/fokus, data terbaru dimuat ulang.
5. Query versi JS dinaikkan ke v2.4 untuk menghindari cache lama.

PENTING — AGAR MATERI & SESI ADMIN TERPADU MUNCUL DI MYBEING
Pastikan URL Apps Script yang dipakai KEDUANYA SAMA PERSIS:
- beingpsikologi.com/admin.html -> assets/admin-config.js -> BANGDIR_API_URL
- bangdir.beingpsikologi.com -> assets/js/config.js -> API_URL

Keduanya harus menuju URL Web App /exec dari Apps Script Pengembangan Diri yang sama.

Setelah mengubah Code.gs:
Deploy > Manage deployments > Edit > Version: New version > Deploy.
Jika URL /exec tetap sama, jangan ubah URL di config.

FILE YANG PERLU DITIMPA DI REPO BANGDIR
- index.html
- akses.html
- assets/js/app.js

Code.gs tidak perlu diganti untuk perubahan tampilan tanggal/refresh ini selama backend v2.3 yang sekarang sudah aktif.
