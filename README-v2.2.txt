BEING Pengembangan Diri v2.2
================================

FONDASI BARU
- 3 ekosistem: Sharing Knowledge / Bootcamp / Sertifikasi BNSP.
- Tiap ekosistem dapat memiliki banyak program.
- Studio dapat difilter Ekosistem -> Program.
- Program GRATIS: daftar -> langsung AKTIF -> email akses otomatis -> MyBeing.
- Program BERBAYAR: daftar -> instruksi bank/QRIS -> upload bukti -> Studio Approve & Aktifkan -> email akses otomatis.
- Satu email dapat mengikuti beberapa program.
- Kode akses yang sudah dimiliki digunakan kembali pada program berikutnya.
- MyBeing menampilkan seluruh program aktif milik kode tersebut.
- Materi, sesi, Zoom, peserta, dan pembayaran tetap terikat ProgramID.
- Program lewat TanggalAkhir hilang dari publik tetapi tetap tersimpan di Studio.
- Aksi hapus tersedia pada Program, Peserta, Pembayaran, Materi, dan Sesi.

LANGKAH PEMASANGAN
1. JANGAN timpa assets/js/config.js yang saat ini sudah bekerja dengan deployment adminbeing.
   Paket ini sengaja hanya menyertakan config.example.js.
2. Timpa:
   - index.html
   - studio.html
   - akses.html
   - assets/js/app.js
   - assets/css/style.css (boleh ditimpa; berasal dari paket sebelumnya)
3. Salin Code.gs v2.2 ke Apps Script adminbeing.
4. Di CONFIG Code.gs, isi data pembayaran resmi:
   PAYMENT_BANK_NAME
   PAYMENT_ACCOUNT_NUMBER
   PAYMENT_ACCOUNT_HOLDER
   PAYMENT_QRIS_URL (opsional)
   PAYMENT_FOLDER_ID (opsional; kosong = root Drive adminbeing)
5. Jalankan setupBeingLite() SATU KALI.
   Data lama v2.1 tidak dihapus; header baru PricingType, Price, PaymentStatus dan sheet PEMBAYARAN ditambahkan.
6. Deploy -> Manage deployments -> Edit -> New version -> Deploy.
   Gunakan deployment Web App adminbeing yang sama bila memungkinkan, sehingga URL API tidak berubah.
7. Tes:
   A. Buat program GRATIS -> daftar -> harus langsung mendapat email & link MyBeing.
   B. Buat program BERBAYAR -> daftar -> instruksi bayar -> upload bukti -> Studio -> Approve & Aktifkan -> email akses.
   C. Daftarkan email yang sama ke program kedua -> kode MyBeing harus tetap sama dan Program Saya menampilkan keduanya.

CATATAN WHATSAPP
- Email dikirim otomatis oleh Apps Script adminbeing.
- WhatsApp tanpa API WhatsApp tidak dapat dikirim otomatis dari server.
- Untuk program gratis, setelah pendaftaran sistem menampilkan tombol “Buka di WhatsApp” yang sudah berisi link MyBeing.
- Di Studio tetap tersedia tombol WA dengan pesan/link siap kirim.

UPLOAD BUKTI
- Maksimal 2 MB per file.
- JPG/PNG/PDF.
- Jika PAYMENT_FOLDER_ID kosong, file masuk ke root Google Drive akun yang menjalankan Apps Script.
