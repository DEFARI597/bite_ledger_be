# Bite Ledger Backend (API)

Aplikasi backend untuk **Bite Ledger** — sistem manajemen inventaris, operasional dapur/produksi, dan Point of Sale (POS) berbasis Node.js, Express, dan PostgreSQL dengan Prisma ORM.

---

## 🛠️ Tech Stack

- **Runtime:** Node.js (v20+ / v22+)
- **Framework:** Express.js (v5)
- **Database:** PostgreSQL
- **ORM:** Prisma ORM (v6 dengan dukungan multi-file schema)

---

## 📋 Prasyarat (Prerequisites)

Sebelum menjalankan aplikasi, pastikan sistem Anda telah terpasang:

1. **Node.js** (rekomendasi LTS v20.x atau v22.x) & **npm**
2. **PostgreSQL** aktif (bisa melalui instalasi lokal atau via Docker)

---

## 🚀 Panduan Setup & Menjalankan Server

Ikuti langkah-langkah berikut secara berurutan:

### 1. Clone Repository & Install Dependencies

```bash
git clone https://github.com/DEFARI597/bite_ledger_be.git
cd bite_ledger_be
npm install
```

### 2. Konfigurasi Environment Variables (`.env`)

Salin file contoh `.env.example` ke `.env`:

```bash
cp .env.example .env
```

Buka dan sesuaikan variabel di dalam `.env`:

```env
PORT=8000

# Format: 

PORT=

DATABASE_URL= 

# JWT Secret Configuration
JWT_SECRET=
JWT_EXPIRES_IN=8h
```

### 3. Setup Database (Prisma Migration & Seeding)

Proyek ini menggunakan arsitektur multi-file schema yang terletak di `prisma/schema/`.

#### a. Generate Prisma Client
Pastikan client sinkron dengan schema terbaru:
```bash
npm run prisma:generate
# atau: npx prisma generate
```

#### b. Jalankan Migrasi Database
Terapkan migrasi skema ke database PostgreSQL:
```bash
npm run prisma:migrate
# atau: npx prisma migrate dev
```

Untuk mengecek status migrasi:
```bash
npx prisma migrate status
```

#### c. Jalankan Database Seeding
Isi data awal role, permissions, dan user default:
```bash
npm run prisma:seed
# atau: npx prisma db seed
```

---

### 4. Menjalankan Server

#### Mode Development (Auto-reload / Watch Mode):
```bash
npm run dev
```

#### Mode Standar / Production:
```bash
npm start
```
---

## 💡 Perintah Bantuan Tambahan
- **Reset Database & Re-seed:**
  > ⚠️ Perhatian: Perintah ini akan menghapus semua data dan membuat ulang database dari awal.
  ```bash
  npx prisma migrate reset
  ```
