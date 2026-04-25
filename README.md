# NutriApp App

## Pengantar

Aplikasi web modern yang menggabungkan computer vision dan generative AI untuk mengidentifikasi makanan melalui kamera dan memberikan informasi nutrisi yang akurat.

## Table of Contents

- [Cara Menggunakan](#cara-menggunakan)
- [Struktur Project](#struktur-project)

## Cara Menggunakan

### Menjalankan Aplikasi (VS Code Live Server)
1. Install extension "Live Server" di VS Code
2. Klik kanan pada file `index.html`
3. Pilih "Open with Live Server"
4. Aplikasi akan terbuka di browser secara otomatis

### Alternatif Server Lain
```bash
# Node.js live-server
npx live-server .
```
## Struktur Project

```
assets/js/
├── core/                          # Inti aplikasi
│   ├── app.js                     # Kelas aplikasi utama
│   ├── config.js                  # Konfigurasi terpusat
│   └── utils.js                   # Fungsi utilitas umum
├── services/                      # Layanan bisnis
│   ├── camera.service.js          # Manajemen kamera
│   ├── detection.service.js       # Deteksi makanan AI
│   └── nutrition.service.js       # Generasi konten nutrisi AI
├── ui/                            # Antarmuka pengguna
|    └── ui.handler.js             # Manajemen DOM dan UI
├── index.html                     # Halaman utama
├── manifest.json                  # File manifest
└── README.md                      # Dokumentasi
```
