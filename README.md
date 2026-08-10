Standalone BEING Pengembangan Diri v1.2

## v1.3
Penyempurnaan Studio:
- Tombol **Salin Link** memakai fallback agar tetap bekerja di Live Server/localhost.
- Tombol **Kirim WA** membuka WhatsApp dengan pesan akses peserta yang sudah terisi.
- Tombol **Email** membuka aplikasi email dengan subjek dan pesan akses yang sudah terisi.
- Tidak memerlukan API WhatsApp dan tidak mengubah Apps Script/backend.


## v1.4
Perbaikan MyBeing:
- Kolom akses sekarang menerima **kode akses** maupun **link akses lengkap**.
- Jika peserta menempel `http://.../akses.html?access=BEING-XXXX`, sistem otomatis mengambil `BEING-XXXX`.
- Link dari Studio tetap dapat dibuka langsung di address bar.


## v1.5 — Flyer / PDF Program
Studio sekarang dapat menyimpan media program:
- **IMAGE** untuk flyer JPG/PNG.
- **PDF** untuk brosur atau dokumen PDF.
- **LINK** untuk tautan informasi lain.

Field baru pada sheet PROGRAM:
- `MediaURL`
- `MediaType`

### Untuk spreadsheet yang SUDAH berjalan
Tidak perlu membuat spreadsheet baru.
1. Ganti `Code.gs` dengan versi v1.5.
2. Jalankan lagi `setupBeingSederhana()` satu kali.
   Fungsi ini akan menambahkan kolom `MediaURL` dan `MediaType` tanpa menghapus data lama.
3. Deploy Apps Script sebagai **New version**.
4. Ganti `studio.html`, `assets/js/app.js`, dan `assets/css/style.css`.
5. Refresh Live Server dengan Ctrl+Shift+R.

### Google Drive
Untuk file Google Drive, atur izin file menjadi:
**Anyone with the link / Siapa saja yang memiliki link dapat melihat**.
Untuk gambar, sistem mencoba menampilkan preview langsung. Jika preview gagal, sistem menyediakan tombol untuk membuka flyer.


## v1.6 — Perbaikan kompatibilitas & preview media
- Fungsi setup utama kembali bernama `setupBeingLite()` sesuai backend yang dipakai pada versi awal.
- Alias `setupBeingSederhana()` tetap tersedia.
- Preview Google Drive memakai endpoint thumbnail yang lebih stabil.
- Jika `MediaType` kosong, sistem mencoba mengenali JPG/JPEG/PNG/WEBP/PDF dari URL.
- Jika preview gambar gagal, kartu tetap menampilkan tombol/link **Lihat Flyer Program**.

### Upgrade dari backend lama
1. Ganti `Code.gs` dengan v1.6.
2. Jalankan `setupBeingLite()` sekali.
3. Deploy > Manage deployments > Edit > New version > Deploy.
4. Ganti `studio.html`, `assets/js/app.js`, dan `assets/css/style.css`.
5. Refresh Live Server dengan Ctrl+Shift+R.


## v1.7 — Fix header media
Penyebab kolom MediaURL/MediaType tidak muncul sudah diperbaiki.

Upgrade:
1. Ganti Code.gs dengan v1.7.
2. Isi kembali SPREADSHEET_ID dan ADMIN_KEY.
3. Jalankan setupBeingLite() satu kali.
4. Cek sheet PROGRAM. Header baru akan ditambahkan di sisi kanan tanpa menghapus data.
5. Deploy Apps Script sebagai New version.
6. Refresh Studio dan halaman publik.


## v1.8 — Perbaikan struktur PROGRAM
Masalah utama versi 1.7:
sheet PROGRAM lama memiliki urutan `Status, Tanggal` sebelum kolom media, sedangkan data baru ditulis berdasarkan posisi tetap. Hal ini menyebabkan URL gambar, IMAGE, BUKA/TUTUP, dan tanggal bergeser.

v1.8:
- Menulis data berdasarkan **nama header**, bukan nomor kolom.
- `setupBeingLite()` otomatis memperbaiki row program yang terkena pergeseran versi 1.7.
- Tidak menghapus data lama.
- Halaman publik tidak lagi menyebut Studio/admin/internal system.
- Kolom Media di Studio menampilkan `IMAGE`, `PDF`, `LINK`, atau `Tanpa media`.

### Upgrade
1. Ganti Code.gs dengan v1.8.
2. Isi SPREADSHEET_ID dan ADMIN_KEY.
3. Jalankan `setupBeingLite()` satu kali.
4. Cek sheet PROGRAM.
5. Deploy Apps Script > New version.
6. Ganti index.html, studio.html, dan assets/js/app.js.
7. Ctrl+Shift+R.


## v1.9 — Media existing program
Jika program sudah dibuat tetapi MediaURL kosong, tidak perlu membuat program lagi.

Studio sekarang memiliki tombol **Atur Flyer/PDF** pada setiap program:
1. Klik Atur Flyer/PDF.
2. Tempel URL Google Drive/JPG/PDF.
3. Pilih IMAGE, PDF, atau LINK.
4. Refresh halaman publik.

Backend menambahkan action `setProgramMedia`.
Index memakai cache-busting `?v=1.9` agar Live Server tidak membaca JS/CSS lama.


## v2.0 — Hapus Program
Studio memiliki tombol **Hapus** pada setiap program.

Pengaman:
- Program tanpa peserta dan tanpa materi dapat dihapus permanen.
- Jika program sudah memiliki peserta atau materi, penghapusan ditolak agar data tidak rusak.
- Untuk program yang pernah digunakan, gunakan tombol **Tutup** agar tidak tampil di halaman publik.
