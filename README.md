# 🏥 MEDISTOCK - Application Documentation & Refactoring Architecture

**MEDISTOCK** adalah platform marketplace obat bebas (OTC) yang menghubungkan **Customer** dengan **Apotek Lokal** (Partner Apotek: **Apotek Sehat**).

Aplikasi telah berhasil di-refactor dari prototype HTML file tunggal menjadi **Full-Stack Application yang terstruktur, modular, maintainable, dan production-ready**.

---

## 🏗️ Structural Architecture Overview

```
medistock-app/
├── backend/                        # Node.js + Express + SQLite Backend API
│   ├── db/
│   │   ├── init.js                 # Skema tabel database (SQLite / PostgreSQL ready)
│   │   └── seed.js                 # Migration script untuk initial dummy data
│   ├── src/
│   │   ├── config/database.js      # Database connection & Query wrapper
│   │   ├── controllers/            # Logic controllers (Auth, Medicine, Order, Pharmacy)
│   │   ├── middleware/             # JWT Authentication Middleware
│   │   ├── routes/                 # REST API Routers
│   │   └── server.js               # Express Server Entrypoint
│   ├── package.json
│   └── .env.example
├── frontend/                       # Vite + React Modular Frontend Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/             # Reusable UI (DemoBanner, Footer)
│   │   │   ├── customer/           # Customer Components (Home, Checkout, QRIS)
│   │   │   └── pharmacy/           # Pharmacy Components (Login, Dashboard, Orders, Inventory, Reports)
│   │   ├── services/
│   │   │   ├── api.js              # Centralized REST API Service Client
│   │   │   └── formatters.js       # IDR Currency & Timer Formatters
│   │   ├── App.jsx                 # Application Shell & Shared State
│   │   ├── main.jsx
│   │   └── index.css               # Tailwind CSS & Custom Styles
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server.py                       # Zero-dependency Python API Server (untuk instant preview tanpa node)
└── README.md                       # Dokumentasi Lengkap
```

---

## 🗄️ Database Schema (SQLite / PostgreSQL Portable)

### 1. `pharmacy_info`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | TEXT (PK) | Unique ID apotek (Default: `APOTEK-1`) |
| `name` | TEXT | Nama apotek partner (`Apotek Sehat`) |
| `is_open` | INTEGER | Status operasional (1 = Buka, 0 = Tutup) |
| `updated_at` | DATETIME | Timestamp update terakhir |

### 2. `medicines`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | TEXT (PK) | ID obat (`MED-1`, `MED-2`, dll) |
| `name` | TEXT | Nama obat |
| `desc` | TEXT | Deskripsi singkat & kegunaan obat |
| `price` | INTEGER | Harga per unit dalam Rupiah (IDR) |
| `stock` | INTEGER | Jumlah stok fisik tersedia |
| `status` | TEXT | Status ketersediaan (`Tersedia` / `Habis`) |

### 3. `orders`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | TEXT (PK) | Kode Transaksi (`MDS-9824`, dll) |
| `customer_name` | TEXT | Nama lengkap pembeli |
| `phone` | TEXT | Nomor telepon / WhatsApp |
| `address` | TEXT | Alamat pengantaran (atau `-` jika Ambil Sendiri) |
| `delivery_type` | TEXT | `Pengantaran` atau `Ambil Sendiri` |
| `subtotal` | INTEGER | Total harga obat |
| `service_fee` | INTEGER | Biaya layanan apotek (Rp 3.000) |
| `total_amount` | INTEGER | Total tagihan |
| `payment_status` | TEXT | Status pembayaran (`Lunas (QRIS)`) |
| `order_status` | TEXT | Status pesanan (`Menunggu Konfirmasi`, `Selesai`, `Dibatalkan`) |
| `timestamp` | TEXT | Tanggal & waktu transaksi |

### 4. `order_items`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | INTEGER (PK) | Auto increment ID |
| `order_id` | TEXT (FK) | References `orders.id` |
| `name` | TEXT | Nama obat yang dipesan |
| `qty` | INTEGER | Jumlah item yang dibeli |
| `price` | INTEGER | Harga per item saat transaksi |

---

## 🔌 REST API Endpoints Specification

### Public / Customer Endpoints
- **`GET /api/health`**: Healthcheck endpoint server
- **`GET /api/pharmacy/info`**: Ambil informasi apotek & status buka/tutup toko
- **`GET /api/medicines?search=`**: Ambil katalog obat (support pencarian nama/deskripsi)
- **`POST /api/orders`**: Buat pesanan baru dari checkout customer
- **`POST /api/orders/:id/confirm-payment`**: Konfirmasi pembayaran QRIS & otomatis kurangi stok obat di database

### Protected / Pharmacy Endpoints
- **`POST /api/auth/login`**: Autentikasi login staf apotek (Credentials default: `apotek@medistock.id` / `password123`)
- **`PUT /api/pharmacy/status`**: Mengubah status operasional apotek (**BUKA / TUTUP**)
- **`GET /api/orders`**: Mengambil seluruh daftar pesanan masuk & riwayat transaksi
- **`PATCH /api/orders/:id/status`**: Mengubah status pesanan (`Selesai` atau `Dibatalkan`)
- **`PUT /api/medicines/inventory`**: Batch update harga, stok, & status obat

---

## 🚀 Cara Menjalankan Aplikasi

### Opsi 1: Menjalankan Backend dengan Python (Instant, Zero Setup)
Karena Python 3.12 sudah terinstall, Anda dapat langsung menjalankan server API backend tanpa perlu install Node.js:

```bash
# Jalankan API server di port 5000
python server.py
```
Setelah server berjalan, Anda dapat langsung membuka file `index.html` di browser.

---

### Opsi 2: Menjalankan dengan Node.js + Express & Vite React

```bash
# 1. Jalankan Backend (Express API)
cd backend
npm install
npm run dev

# 2. Jalankan Frontend (Vite React) di terminal baru
cd frontend
npm install
npm run dev
```

---

## 🔑 Hak Akses Demo
- **Customer Flow**: Langsung klik menu `medistock.id` di bar navigasi atas demo.
- **Pharmacy Portal**:
  - Email: `apotek@medistock.id`
  - Password: `password123`

---

## 🌐 Deployment Readiness & Production Setup

MEDISTOCK dirancang dengan arsitektur terpisah (Decoupled Architecture) antara **Frontend (React + Vite)** dan **Backend (Express + Prisma)**:

### 1. Environment Variables
- **Backend (`backend/.env`)**:
  - `PORT`: Port server backend (otomatis disesuaikan platform seperti Render/Railway/Heroku).
  - `HOST`: Host binding (default: `0.0.0.0`).
  - `DATABASE_URL`: Path SQLite database (`file:../db/medistock.db`).
  - `JWT_SECRET`: Secret key acak untuk enkripsi JWT token (wajib diisi di production).
  - `NODE_ENV`: Set `production`.
  - `ALLOWED_ORIGIN`: URL Frontend production untuk kebijakan CORS (misal: `https://medistock.vercel.app`).

- **Frontend (`frontend/.env`)**:
  - `VITE_API_BASE_URL`: Base URL Backend API production (misal: `https://medistock-api.onrender.com/api`). Jika dikosongkan pada development, otomatis menggunakan Vite proxy (`/api`).

### 2. Deploying Backend (Express + Prisma SQLite)
- **Rekomendasi Platform**: Render / Railway / Fly.io / VPS (Ubuntu).
- **Build Command**: `npm run build` (menjalankan `prisma generate`).
- **Migration Command**: `npx prisma migrate deploy`
- **Start Command**: `npm run start` (menjalankan `node src/server.js`).

### 3. Deploying Frontend (React Static Build)
- **Rekomendasi Platform**: Vercel / Netlify / Cloudflare Pages.
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

