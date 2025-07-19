# Patungan - Aplikasi Split Bill Modern dengan AI

<div align="center">
  <img src="public/placeholder-logo.svg" alt="Patungan Logo" width="120" />
  <h3>Patungan App</h3>
  <p>Bayar Bersama, Tanpa Ribet</p>
</div>

## 📋 Deskripsi

Patungan adalah aplikasi inovatif yang dirancang untuk menyederhanakan proses pembagian tagihan dan pelacakan pengeluaran sosial. Dengan memanfaatkan kekuatan AI dan antarmuka yang intuitif, Patungan membuat pengelolaan keuangan bersama teman atau keluarga menjadi mudah dan menyenangkan.

## ✨ Fitur Utama

- **Scan Struk Cerdas**: Manfaatkan kekuatan AI (Google Gemini) untuk secara otomatis mengekstrak detail item, harga, pajak, dan total dari foto struk.
- **Pembagian Fleksibel**: Mudah mengklaim item personal atau membagi item yang bisa dibagi dengan porsi yang disesuaikan antar peserta.
- **Input Item Manual**: Tambahkan item secara manual ke sesi pembagian tagihan, dengan opsi untuk mengklaim atau membagi porsi.
- **Manajemen Transaksi**: Lacak dan kelola transaksi yang tertunda dan selesai antar peserta.
- **Perhitungan Otomatis**: Secara otomatis menghitung siapa yang berhutang berapa kepada siapa.
- **Fitur Chat dengan AI**: Diskusikan pengeluaran dengan bantuan AI untuk mendapatkan saran dan bantuan.
- **QR Code Sharing**: Bagikan sesi pembagian tagihan dengan mudah melalui QR code yang dapat dipindai.
- **Pemrosesan Gambar Struk**: Unggah dan proses gambar struk untuk ekstraksi otomatis (fitur yang direncanakan).
- **Manajemen Grup**: Buat dan kelola grup untuk split bill yang berulang.
- **Antarmuka Responsif & Estetik**: Desain yang modern dan responsif, dioptimalkan untuk pengalaman seluler yang mulus.
- **Informasi Lokasi & Waktu**: Aplikasi menampilkan salam dinamis, lokasi, dan waktu saat ini berdasarkan data perangkat pengguna.
- **Firebase Integration**: Sinkronisasi data real-time, autentikasi, dan penyimpanan cloud.

## 🚀 Teknologi yang Digunakan

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, Framer Motion, glassmorphic UI
- **UI Components**: shadcn/ui, Lucide Icons
- **AI Integration**: Google Gemini API, IBM Granite
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage, Local Storage, Session Storage
- **State Management**: React Context API dan React Hooks
- **Location**: Geolocation API, OpenStreetMap (Nominatim)
- **QR Code**: react-qr-code
- **Forms**: React Hook Form, Zod
- **Deployment**: Vercel

## 💻 Instalasi dan Setup

```bash
# Clone repository
git clone https://github.com/yourusername/patungan-app.git
cd patungan-app

# Install dependencies
npm install
# atau
pnpm install
# atau
yarn install

# Konfigurasi Environment Variables
# Buat file .env.local berdasarkan .env.example
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=YOUR_FIREBASE_MEASUREMENT_ID
NEXT_PUBLIC_GEMINI_API_KEY=YOUR_GOOGLE_GEMINI_API_KEY

# Run development server
npm run dev
# atau
pnpm dev
# atau
yarn dev

# Build untuk production
npm run build
# atau
pnpm build
# atau
yarn build
```

## 📱 Penggunaan

1. **Scan Struk**: Di dashboard, pilih "Scan Struk" untuk mengambil foto struk.
2. **Upload Struk**: Upload foto struk dari galeri atau ambil foto dengan kamera.
3. **Proses AI**: AI akan memproses struk dan mengekstrak informasi.
4. **Sesi Split Bill**: 
   - Tambahkan peserta
   - Klaim item atau bagi di antara peserta
   - Tambahkan item manual jika diperlukan
   - Lihat ringkasan pembagian
5. **Mengelola Transaksi**: Lacak transaksi yang tertunda dan tandai setelah pembayaran selesai.
6. **Bagikan Hasil**: Bagikan hasil perhitungan melalui QR code atau link.
7. **AI Chat**: Akses AI Chat untuk analisis atau saran keuangan.
8. **Manajemen Grup**: Buat grup untuk pengeluaran berulang dengan anggota yang sama.

## 🔐 Firebase Integration

Aplikasi ini menggunakan Firebase untuk beberapa fitur utama:

1. **Authentication**:
   - Autentikasi Email/Password
   - Integrasi Google OAuth
   - Manajemen profil pengguna

2. **Firestore Database**:
   - Profil pengguna
   - Sesi split bill
   - Pengeluaran dan transaksi
   - Data grup
   - Pesan chat

3. **Storage**:
   - Gambar profil pengguna
   - Gambar struk

## 🤝 Kontribusi

Kontribusi selalu disambut! Silakan fork repositori, buat branch fitur, dan ajukan pull request.

1. Fork repositori
2. Buat branch fitur (`git checkout -b feature/amazing-feature`)
3. Commit perubahan (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buka Pull Request

## 📄 Lisensi

Didistribusikan di bawah lisensi MIT. Lihat `LICENSE` untuk informasi lebih lanjut.

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Google Gemini](https://ai.google.dev/)
- [Firebase](https://firebase.google.com/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
- [Vercel](https://vercel.com/)

---

<div align="center">
  <p>Dibuat dengan ❤️ oleh Al-Ghani Desta Setyawan</p>
  <p>© 2025 Patungan App. All rights reserved.</p>
</div>
