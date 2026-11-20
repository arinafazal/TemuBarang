# TemuBarang — Lost & Found Kampus
**Tugas Akhir Praktikum PPB 2026**

* **Nama**: Arina Fazal Hak
* **NIM**: 21120124120042
* **Departemen**: Teknik Komputer

Sistem Pelaporan dan Pencarian Barang Hilang & Temuan berbasis **Progressive Web App (PWA)** dengan Backend REST API Node.js + Express dan database PostgreSQL via Supabase.

---

## ✨ Fitur Utama

* **7 Halaman SPA** via hash router: Beranda, Daftar Temuan, Daftar Hilang, Detail Barang, Buat Laporan, Profil, Bantuan
* **Sidebar collapsible** (desktop) + **bottom navigation** (mobile) — responsive penuh
* **Upload foto barang** langsung dari file (auto-resize & kompresi canvas, maks 800px)
* **Pusat Pemberitahuan** (Notification Center) dengan badge titik merah dan notifikasi kampus
* **Pusat Bantuan** via WhatsApp: `085795457137`
* **Format kontak pelapor**: `08xxxxxxxxxx (Nama Pelapor)` — nama otomatis diekstrak dan ditampilkan di kartu
* **Verifikasi kepemilikan fisik** di Pos Satpam (KTM + detail rahasia barang)
* Terhubung langsung ke **Supabase PostgreSQL** secara realtime

---

## 📁 Struktur Folder

```text
temubarang/
├── api/                        # Backend Node.js + Express + Supabase
│   ├── src/
│   │   ├── config/             # Konfigurasi Supabase Client
│   │   ├── controllers/        # Logic CRUD: kategori, hilang, temuan
│   │   ├── routes/             # Definisi route endpoints
│   │   └── index.js            # Entry point Express server
│   ├── .env                    # Kredensial Supabase (jangan di-commit!)
│   ├── package.json
│   └── vercel.json             # Konfigurasi deploy ke Vercel
│
├── pwa/                        # Frontend PWA (Vanilla HTML + CSS + JS)
│   ├── index.html              # Single Page App (hash router)
│   ├── manifest.json           # Konfigurasi install PWA
│   ├── service-worker.js       # Offline cache (temubarang-v5008)
│   ├── css/
│   │   └── style.css           # Desain Figma-revamp, font Manrope, responsif
│   ├── js/
│   │   ├── api.js              # Fetcher ke Backend REST API
│   │   └── app.js              # Router + render 7 halaman + logika form
│   ├── icons/
│   │   ├── icon-homescreen.png # Ikon 192×192 — shortcut homescreen Android
│   │   └── icon-splash.png     # Ikon 512×512 — splash screen saat PWA dibuka
│   └── images/
│       └── profile.jpg         # Foto profil pengguna
│
└── README.md
```

---

## 🚀 Cara Menjalankan Secara Lokal

### 1. Backend API

```bash
cd "D:\Kuliah\Semester 5\TA PRAK PPB\temubarang\api"
```

Pastikan file `.env` sudah terisi:

```env
PORT=3000
SUPABASE_URL=https://zffeoyxadflhroqkgpls.supabase.co
SUPABASE_KEY=sb_publishable_...
```

Jalankan server:

```bash
npm run dev   # development (nodemon)
# atau
npm start     # production
```

API berjalan di: `http://localhost:3000`

### 2. Frontend PWA

Buka folder `pwa/` via **Live Server** (ekstensi VS Code), atau:

```bash
npx serve pwa
# atau
python -m http.server 8080   # di dalam folder pwa/
```

> **Catatan**: Pastikan backend API sudah berjalan di `localhost:3000` sebelum membuka PWA, agar data dari Supabase bisa dimuat.

---

## 📡 Endpoint API

### Kategori — `/api/categories`

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/categories` | Ambil semua kategori |
| GET | `/api/categories/:id` | Detail kategori |
| POST | `/api/categories` | Tambah kategori `{ "name": "..." }` |
| PUT | `/api/categories/:id` | Edit kategori |
| DELETE | `/api/categories/:id` | Hapus kategori |

### Barang Hilang — `/api/lost-items`

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/lost-items` | Ambil semua (filter: `?category_id=&search=&status=&limit=`) |
| GET | `/api/lost-items/:id` | Detail barang hilang |
| POST | `/api/lost-items` | Buat laporan hilang |
| PUT | `/api/lost-items/:id` | Update data / status (`searching` → `found`) |
| DELETE | `/api/lost-items/:id` | Hapus laporan |

### Barang Temuan — `/api/found-items`

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/found-items` | Ambil semua (filter: `?category_id=&search=&status=&limit=`) |
| GET | `/api/found-items/:id` | Detail barang temuan |
| POST | `/api/found-items` | Buat laporan temuan |
| PUT | `/api/found-items/:id` | Update data / status (`available` → `claimed`) |
| DELETE | `/api/found-items/:id` | Hapus laporan |

---

## 🔒 Mekanisme Verifikasi Tanpa Login

Aplikasi ini bersifat **publik tanpa autentikasi** (zero-friction) agar mudah diakses seluruh civitas kampus. Verifikasi kepemilikan barang dilakukan secara berlapis:

1. **Verifikasi Fisik di Pos Satpam** — Pengklaim wajib menunjukkan KTM dan membuktikan kepemilikan dengan detail rahasia barang (PIN/pola HP, isi dompet, dsb.)
2. **Koordinasi P2P via WhatsApp** — Setiap laporan menyertakan nomor WA pelapor untuk konfirmasi langsung sebelum pengambilan
3. **Filter Waktu & Lokasi** — Tanggal kejadian dan lokasi spesifik menjadi filter awal kecocokan barang

---

## 🛠️ Teknologi

| Layer | Stack |
|-------|-------|
| Frontend | Vanilla HTML5, CSS3, JavaScript (ES6+) |
| PWA | Web App Manifest, Service Worker, Cache API |
| Backend | Node.js, Express.js |
| Database | PostgreSQL via Supabase |
| Font | Manrope (Google Fonts) |
| Deploy API | Vercel |
