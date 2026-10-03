# InstaSave — Instagram Downloader

Website downloader Instagram dengan:
- HTML
- CSS modern responsive
- JavaScript frontend
- Node.js + Express backend
- `youtube-dl-exec` untuk mengambil media yang dapat diakses
- `ffmpeg-static` untuk membantu proses video

## 1. Persyaratan

Install:
- Node.js 18 atau lebih baru
- Internet aktif

## 2. Instalasi

Buka terminal di folder project:

```bash
npm install
```

## 3. Jalankan

```bash
npm start
```

Kemudian buka:

http://localhost:3000

Untuk mode development:

```bash
npm run dev
```

## 4. Cara menggunakan

1. Buka website.
2. Salin URL Instagram Reels/Post/Video publik.
3. Tempel pada kolom.
4. Klik `Proses Video`.
5. Jika video berhasil ditemukan, klik `Download MP4`.

## Catatan

Tidak semua URL Instagram dapat diproses. Konten privat, konten yang memerlukan login, konten yang dibatasi wilayah, atau perubahan sistem Instagram dapat menyebabkan proses gagal.

Gunakan hanya untuk konten yang memang boleh kamu unduh dan simpan. Jangan gunakan untuk mengambil ulang konten orang lain tanpa izin.

## Struktur

```text
instagram-downloader/
├── package.json
├── server.js
├── README.md
├── .gitignore
├── downloads/
│   └── .gitkeep
└── public/
    ├── index.html
    ├── style.css
    └── script.js
```
