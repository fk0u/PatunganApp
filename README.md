# Patungan - Social Finance Hub

Patungan adalah aplikasi inovatif yang dirancang untuk menyederhanakan proses pembagian tagihan dan pelacakan pengeluaran sosial Anda. Dengan memanfaatkan kekuatan AI dan antarmuka yang intuitif, Patungan membuat pengelolaan keuangan bersama teman atau keluarga menjadi mudah dan menyenangkan.

## Fitur Utama

*   **Scan Struk Cerdas**: Manfaatkan kekuatan AI (Google Gemini) untuk secara otomatis mengekstrak detail item, harga, pajak, dan total dari foto struk Anda.
*   **Input Item Manual**: Tambahkan item secara manual ke sesi pembagian tagihan, dengan opsi untuk mengklaim atau membagi porsi. Anda juga dapat menghapus item yang tidak relevan.
*   **Pembagian Fleksibel**: Mudah mengklaim item personal atau membagi item yang bisa dibagi dengan porsi yang disesuaikan antar peserta.
*   **AI Chat**: Berinteraksi dengan AI (IBM Granite) untuk mendapatkan analisis, tips keuangan, atau jawaban atas pertanyaan terkait pengeluaran Anda.
*   **Laporan Pengeluaran Lokal**: Lihat riwayat sesi pembagian tagihan Anda yang disimpan secara lokal di perangkat Anda, memberikan ringkasan pengeluaran dari waktu ke waktu.
*   **Antarmuka Responsif & Estetik**: Desain yang modern dan responsif, dioptimalkan untuk pengalaman seluler yang mulus, dengan *navbar* atas yang *sticky* dan elemen UI yang menarik.
*   **Informasi Lokasi & Waktu**: Aplikasi menampilkan salam dinamis, lokasi, dan waktu saat ini berdasarkan data perangkat pengguna.

## Teknologi yang Digunakan

*   **Next.js 14 (App Router)**: Framework React untuk aplikasi web *full-stack*.
*   **React 19**: Library JavaScript untuk membangun antarmuka pengguna.
*   **Tailwind CSS**: Framework CSS untuk *styling* yang cepat dan responsif.
*   **shadcn/ui**: Komponen UI yang dapat disesuaikan dan mudah diakses.
*   **Framer Motion**: Library untuk animasi UI yang lancar.
*   **Google Gemini**: Model AI untuk pemrosesan gambar (OCR) dan ekstraksi data struk.
*   **IBM Granite**: Model AI untuk kemampuan *chat* dan analisis teks.
*   **v0 by Vercel**: Platform AI-powered untuk menghasilkan kode UI.
*   **LocalStorage**: Digunakan untuk persistensi data sesi laporan pengeluaran secara lokal di sisi klien.
*   **Geolocation API**: Untuk mendapatkan lokasi pengguna.

## Instalasi dan Setup

Untuk menjalankan proyek ini secara lokal, ikuti langkah-langkah berikut:

1.  **Clone repositori:**
    \`\`\`bash
    git clone <URL_REPOSITORI_ANDA>
    cd patungan-social-finance-hub
    \`\`\`

2.  **Instal dependensi:**
    \`\`\`bash
    npm install
    # atau
    yarn install
    \`\`\`

3.  **Konfigurasi Environment Variables:**
    Buat file `.env.local` di root proyek Anda dan tambahkan *environment variables* berikut:

    \`\`\`
    GEMINI_API_KEY=YOUR_GOOGLE_GEMINI_API_KEY
    REPLICATE_API_TOKEN=YOUR_REPLICATE_API_TOKEN
    \`\`\`
    *   Anda bisa mendapatkan `GEMINI_API_KEY` dari Google AI Studio.
    *   Anda bisa mendapatkan `REPLICATE_API_TOKEN` dari Replicate.com. Pastikan Anda memiliki akses ke model `meta/llama-3-8b-instruct` atau model lain yang kompatibel.

4.  **Jalankan aplikasi:**
    \`\`\`bash
    npm run dev
    # atau
    yarn dev
    \`\`\`

    Aplikasi akan berjalan di `http://localhost:3000`.

## Penggunaan

1.  **Scan Struk**: Di halaman utama, Anda dapat mengunggah foto struk atau mengambilnya langsung dengan kamera. AI akan memprosesnya dan mengekstrak detail.
2.  **Sesi Lokal**: Setelah struk diproses, Anda akan dibawa ke halaman sesi lokal di mana Anda dapat:
    *   Menambahkan peserta.
    *   Mengklaim item personal atau membagi item yang bisa dibagi antar peserta.
    *   Menambahkan item secara manual jika ada yang terlewat atau tidak terdeteksi AI.
    *   Menghapus item yang tidak diinginkan.
    *   Melihat ringkasan tagihan individual.
    *   Menyelesaikan perhitungan dan menyimpan sesi ke riwayat.
3.  **AI Chat**: Akses AI Chat dari menu navigasi untuk bertanya tentang pengeluaran atau mendapatkan tips keuangan.
4.  **Laporan Pengeluaran**: Kunjungi halaman laporan dari menu navigasi untuk melihat riwayat sesi Anda yang tersimpan secara lokal.

## Atribusi

Aplikasi ini dibangun dengan bantuan teknologi AI canggih:
*   **IBM Granite**
*   **Google Gemini**
*   **v0 by Vercel**

Dibuat oleh **Al-Ghani Desta Setyawan** untuk memenuhi tugas proyek capstone Hacktiv8.

## Kontribusi

Kontribusi sangat dihargai! Jika Anda memiliki saran atau ingin berkontribusi, silakan buka *issue* atau *pull request*.

## Lisensi

[Tambahkan informasi lisensi di sini, contoh: MIT License]
