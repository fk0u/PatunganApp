# Perubahan Mode dari Online ke Mode Lokal Saja

## Perubahan yang Telah Dilakukan

Berdasarkan permintaan, aplikasi ini telah dimodifikasi untuk hanya menggunakan mode lokal/offline saja dan menghapus fitur mode online. Berikut adalah perubahan yang telah dilakukan:

1. **app/scan/page.tsx**:
   - Menghapus state dan UI terkait pemilihan grup
   - Menghapus Dialog pemilihan mode dan perbandingan fitur
   - Mengubah fungsi `saveAndContinue` untuk langsung mengarahkan ke halaman `/local-session`
   - Menyederhanakan UI dengan menghapus elemen terkait mode online

2. **app/dashboard/page.tsx**:
   - Mengganti tombol "Scan Struk" untuk langsung mengarahkan ke halaman `/scan` tanpa dialog pemilihan mode
   - Menghapus state, fungsi, dan UI terkait mode online dan fitur berbagi
   - Menghilangkan Dialog pemilihan mode
   - Menyederhanakan Dialog opsi scan

3. **app/dashboard/split-bill**:
   - Folder ini berisi implementasi mode online, namun sekarang tidak digunakan
   - Sebuah README.md telah ditambahkan untuk menandai bahwa folder ini tidak digunakan lagi

4. **README.md Utama**:
   - Diperbarui untuk menghapus referensi ke mode online
   - Diperbarui dokumentasi penggunaan untuk mencerminkan perubahan workflow

## Fitur yang Dipertahankan

- Pengenalan struk (OCR) menggunakan AI
- Fitur scan struk dengan kamera atau unggah dari galeri
- Pengolahan dan pengenalan teks dari struk
- Pembagian tagihan mode lokal di perangkat
- Perhitungan split bill per item

## Fitur yang Dihapus

- Mode online untuk berbagi pembagian tagihan
- Pemilihan grup untuk pembagian tagihan online
- Fitur berbagi link via QR code dan media sosial
- Pembagian tagihan sederhana yang tersimpan di akun pengguna

Mode lokal/offline sekarang menjadi satu-satunya mode yang tersedia dalam aplikasi.
