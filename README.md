# MEDISTOCK - Web UI MVP

Super clean, minimal, and lightweight Web UI MVP for **MEDISTOCK** (Local medicine ordering application for partner pharmacy **Apotek Sehat**).

---

## 🎨 Design System & Aesthetics
- **Style**: Ultra-minimalist, flat design, light mode only.
- **Color Palette**: Clean White (`#FFFFFF`), Deep Navy Blue (`#1E293B`) for primary actions, subtle crisp 1px borders (`#E2E8F0`).
- **Typography**: Modern High-Contrast Sans-Serif (`Inter`), clear visual hierarchy and generous whitespace.
- **No Clutter**: Zero decorative gradients, zero complex illustrations, zero unnecessary color elements. Purely functional and straight to the point.

---

## 🚀 How to Run

### Option 1: Instant Browser View (Zero Setup Required)
Simply double click or open `index.html` in any web browser!
```bash
# Path
C:\Users\lenovo\.gemini\antigravity-ide\scratch\medistock-app\index.html
```

---

## 📱 Component Specification Summary

### PART 1: CUSTOMER FLOW (`medistock.id`)
1. **Home & Search Screen**
   - Header with logo **MEDISTOCK** & label **Apotek Mitra: Apotek Sehat**.
   - Search input box with placeholder `"Cari nama obat..."`.
   - Medicine vertical list (Paracetamol, Amoxicillin, Vitamin C, Antasida, etc.) with price in IDR, stock status ("Stok Tersedia"), and `+ Tambah` button.
2. **Checkout Screen**
   - Order summary with item quantities & subtotal.
   - Delivery method selection (`Pengantaran` vs `Ambil Sendiri`).
   - Customer info fields (Nama Lengkap, No. Telepon/WA, Alamat Pengantaran).
   - Price breakdown (Subtotal + Jasa Rp 3.000 = Total Final).
   - Dark Navy Button `"Bayar via QRIS"`.
3. **QRIS Payment & Success Flow**
   - Header with `15:00` countdown timer.
   - Large total price text.
   - Centered QRIS QR Code box.
   - Instruction lines (`1. Buka e-wallet/bank 2. Scan & Bayar`).
   - Plain button `"Saya Sudah Bayar"`.
   - Payment Success Modal (`"Pembayaran Berhasil! Pesanan sedang disiapkan oleh Apotek."`) with button `"Kembali ke Beranda"`.

---

### PART 2: PHARMACY FLOW (`medistock.id/apotek`)
4. **Pharmacy Staff Login Screen**
   - Header `"MEDISTOCK - Portal Apotek"`.
   - Email/Username & Password fields.
   - Full-width button `"Masuk ke Dashboard"`.
5. **Pesanan Masuk (Incoming Orders Screen)**
   - Store status toggle `"Status Toko: Buka/Tutup"`.
   - Incoming order cards (Order ID, Customer Name, Delivery Type, Item list, `"Lunas (QRIS)"` badge).
   - Action buttons: `[ Konfirmasi & Siapkan ]` (Solid Dark) and `[ Tolak ]` (Outline).
6. **Kelola Stok & Harga (Inventory Screen)**
   - Clean minimal rows with medicine name, editable price text input, editable stock number input, availability toggle switch (`Tersedia` / `Habis`).
   - Bottom bar action `"Simpan Perubahan"`.
7. **Laporan Penjualan (Sales Report Screen)**
   - Summary cards: `Total Penjualan Hari Ini` & `Total Pesanan Selesai`.
   - Transaction History Table showing Date/Time | Order ID | Customer Name | Total Price | Status.
