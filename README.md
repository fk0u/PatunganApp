# Patungan - Aplikasi Split Bill Modern dengan AI

<div align="center">
  <img src="public/placeholder-logo.svg" alt="Patungan Logo" width="120" />
  <h3>Patungan App</h3>
  <p>Platform Split Bill Modern dengan Teknologi AI</p>
</div>

## 📋 Deskripsi

Patungan adalah aplikasi inovatif yang dirancang untuk menyederhanakan proses pembagian tagihan dan pelacakan pengeluaran sosial. Dengan memanfaatkan kekuatan AI dan antarmuka yang intuitif, Patungan membuat pengelolaan keuangan bersama teman atau keluarga menjadi mudah dan menyenangkan.

## ✨ Fitur Utama

- **Scan Struk Cerdas**: Manfaatkan kekuatan AI (Google Gemini) untuk secara otomatis mengekstrak detail item, harga, pajak, dan total dari foto struk.
- **Mode Split Bill**: Pilih antara mode lokal (perangkat ini saja) atau mode online (bagikan dengan link) untuk pembagian tagihan.
- **Pembagian Fleksibel**: Mudah mengklaim item personal atau membagi item yang bisa dibagi dengan porsi yang disesuaikan antar peserta.
- **Input Item Manual**: Tambahkan item secara manual ke sesi pembagian tagihan, dengan opsi untuk mengklaim atau membagi porsi.
- **QR Code Sharing**: Bagikan sesi pembagian tagihan dengan mudah melalui QR code yang dapat dipindai.
- **AI Chat**: Berinteraksi dengan AI untuk mendapatkan analisis, tips keuangan, atau jawaban atas pertanyaan terkait pengeluaran.
- **Antarmuka Responsif & Estetik**: Desain yang modern dan responsif, dioptimalkan untuk pengalaman seluler yang mulus.
- **Informasi Lokasi & Waktu**: Aplikasi menampilkan salam dinamis, lokasi, dan waktu saat ini berdasarkan data perangkat pengguna.

## 🚀 Teknologi yang Digunakan

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, Framer Motion, glassmorphic UI
- **UI Components**: shadcn/ui, Lucide Icons
- **AI Integration**: Google Gemini API, IBM Granite
- **Authentication**: Firebase Authentication
- **State Management**: React Context API dan React Hooks
- **Storage**: Local Storage, Session Storage
- **Location**: Geolocation API, OpenStreetMap (Nominatim)
- **QR Code**: react-qr-code
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
GEMINI_API_KEY=YOUR_GOOGLE_GEMINI_API_KEY
REPLICATE_API_TOKEN=YOUR_REPLICATE_API_TOKEN

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

1. **Scan Struk**: Di dashboard, pilih "Scan Struk" dan tentukan mode (Lokal/Online).
2. **Upload Struk**: Upload foto struk dari galeri atau ambil foto dengan kamera.
3. **Proses AI**: AI akan memproses struk dan mengekstrak informasi.
4. **Sesi Split Bill**: 
   - Tambahkan peserta
   - Klaim item atau bagi di antara peserta
   - Tambahkan item manual jika diperlukan
   - Lihat ringkasan pembagian
5. **Bagikan Hasil**: Bagikan hasil perhitungan melalui QR code atau link.
6. **AI Chat**: Akses AI Chat untuk analisis atau saran keuangan.

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
- [IBM Granite](https://ibm.com/products/granite)
- [Firebase](https://firebase.google.com/)
- [Vercel](https://vercel.com/)

---

<div align="center">
  <p>Dibuat dengan ❤️ oleh Al-Ghani Desta Setyawan</p>
  <p>© 2025 Patungan App. All rights reserved.</p>
</div>
