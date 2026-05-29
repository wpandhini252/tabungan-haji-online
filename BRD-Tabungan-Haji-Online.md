# Business Requirements Document (BRD)
## Aplikasi Tabungan Haji Online

| | |
|---|---|
| **Nama Proyek** | Tabungan Haji Online |
| **Komponen** | `tabungan-haji-online` (Backend API), `tabungan-haji-web/fe-odp` (Frontend Web) |
| **Versi Dokumen** | 1.0 |
| **Tanggal** | 29 Mei 2026 |
| **Status** | Draft |
| **Disusun untuk** | Tim Pengembang, Product Owner, Stakeholder Bisnis |

---

## Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Latar Belakang & Tujuan Bisnis](#2-latar-belakang--tujuan-bisnis)
3. [Ruang Lingkup Proyek](#3-ruang-lingkup-proyek)
4. [Pemangku Kepentingan & Aktor](#4-pemangku-kepentingan--aktor)
5. [Arsitektur Sistem](#5-arsitektur-sistem)
6. [Kebutuhan Fungsional](#6-kebutuhan-fungsional)
7. [Kebutuhan Non-Fungsional](#7-kebutuhan-non-fungsional)
8. [Aturan Bisnis](#8-aturan-bisnis)
9. [Model Data](#9-model-data)
10. [Spesifikasi API](#10-spesifikasi-api)
11. [Flow Process (Alur Proses)](#11-flow-process-alur-proses)
12. [Mock Up (Rancangan Antarmuka)](#12-mock-up-rancangan-antarmuka)
13. [Asumsi, Batasan & Risiko](#13-asumsi-batasan--risiko)
14. [Roadmap & Rekomendasi](#14-roadmap--rekomendasi)

---

## 1. Ringkasan Eksekutif

**Tabungan Haji Online** adalah sistem digital yang memungkinkan nasabah membuka dan mengelola rekening tabungan haji secara mandiri, melakukan setoran (termasuk via QRIS), memantau saldo, serta memperoleh estimasi tahun keberangkatan haji berdasarkan akumulasi dana dan kuota nasional.

Sistem terdiri atas dua komponen utama:

- **Backend API (`tabungan-haji-online`)** — RESTful API berbasis Node.js/Express/TypeScript dengan database PostgreSQL melalui ORM Prisma. Menyediakan manajemen nasabah, autentikasi (JWT), pengelolaan rekening tabungan, pencatatan transaksi yang atomik, perhitungan estimasi porsi haji, dan ekspor laporan bulanan dalam format CSV. **Status: Fungsional & Lengkap.**
- **Frontend Web (`tabungan-haji-web/fe-odp`)** — Aplikasi web berbasis Next.js 16 + React 19 + Tailwind CSS v4 yang mengonsumsi Backend API. **Status: Tahap awal (scaffolding)** — baru tersedia indikator status koneksi API. Seluruh layar fitur akan dibangun mengacu pada mockup di dokumen ini.

Dokumen ini menjadi acuan tunggal untuk kebutuhan bisnis, alur proses, dan rancangan antarmuka aplikasi.

---

## 2. Latar Belakang & Tujuan Bisnis

### 2.1 Latar Belakang
Pendaftaran haji di Indonesia memiliki masa tunggu panjang (rata-rata ±20 tahun) dan memerlukan akumulasi dana bertahap. Calon jamaah membutuhkan sarana untuk:
- Menabung secara terstruktur menuju **Setoran Awal Porsi** (Rp 25.000.000) dan **Biaya Pelunasan/Bipih** (Rp 56.000.000).
- Mengetahui progres dana dan estimasi tahun keberangkatan.
- Bertransaksi dengan mudah, termasuk pembayaran nontunai (QRIS).

### 2.2 Tujuan Bisnis
| Kode | Tujuan |
|------|--------|
| TB-01 | Menyediakan kanal digital pembukaan & pengelolaan rekening tabungan haji. |
| TB-02 | Mendorong konsistensi menabung melalui transparansi progres dan estimasi keberangkatan. |
| TB-03 | Mempermudah setoran melalui berbagai metode (tunai, transfer, debit, kartu, QRIS). |
| TB-04 | Menjamin integritas dan auditabilitas seluruh transaksi keuangan. |
| TB-05 | Menyediakan pelaporan bulanan untuk kebutuhan rekonsiliasi dan kepatuhan. |

### 2.3 Indikator Keberhasilan (KPI)
- Jumlah rekening tabungan haji aktif yang dibuka.
- Persentase nasabah yang mencapai Setoran Awal Porsi (≥ Rp 25 juta).
- Volume & nilai transaksi setoran per bulan.
- Tingkat keberhasilan transaksi (success rate) ≥ 99%.

---

## 3. Ruang Lingkup Proyek

### 3.1 Termasuk dalam Lingkup (In-Scope)
- Registrasi & manajemen data **Nasabah**.
- **Autentikasi** pengguna (registrasi akun login, login, logout) berbasis JWT.
- Pembukaan & manajemen **Rekening Tabungan Haji** (status: AKTIF, BLOKIR, TUTUP).
- Pencatatan **Transaksi** setoran & penarikan secara atomik, termasuk setoran **QRIS**.
- **Estimasi keberangkatan haji** & informasi kuota.
- **Laporan transaksi bulanan** (ekspor CSV).
- **Antarmuka Web** untuk seluruh fitur di atas (mengacu pada mockup).

### 3.2 Di Luar Lingkup (Out-of-Scope) — Fase Ini
- Integrasi *real* dengan payment gateway/host-to-host bank & SISKOHAT Kementerian Agama.
- Notifikasi push/email/SMS otomatis.
- Aplikasi mobile native (Android/iOS).
- Manajemen peran/role (RBAC) bertingkat (admin vs nasabah) — saat ini autentikasi bersifat tunggal.
- Persistensi denylist token pada penyimpanan eksternal (saat ini in-memory).

---

## 4. Pemangku Kepentingan & Aktor

### 4.1 Aktor Sistem
| Aktor | Deskripsi | Hak Akses Utama |
|-------|-----------|-----------------|
| **Calon Pendaftar (Publik)** | Pengunjung yang belum memiliki akun. | Registrasi nasabah, membuat akun login. |
| **Nasabah (Authenticated User)** | Pengguna yang sudah login (membawa JWT). | Melihat profil, mengelola rekening, transaksi, estimasi, laporan. |
| **Petugas/Operator** | Pengelola data (menggunakan kredensial terautentikasi). | Mengelola nasabah, rekening, dan memantau transaksi. |
| **Sistem Backend** | Mesin aturan bisnis & penyimpanan data. | Validasi, perhitungan saldo atomik, estimasi, audit. |

> Catatan: Pada implementasi saat ini, seluruh endpoint terautentikasi menggunakan satu jenis token (belum ada pembedaan peran nasabah vs admin). Pemisahan peran direkomendasikan pada roadmap.

### 4.2 Stakeholder Bisnis
- **Product Owner** — Pemilik kebutuhan & prioritas fitur.
- **Tim Pengembang** — Implementasi backend & frontend.
- **Tim Kepatuhan/Audit** — Pengguna laporan & jejak transaksi.

---

## 5. Arsitektur Sistem

### 5.1 Diagram Arsitektur Tingkat Tinggi

```
┌───────────────────────────────────────────────────────────────────────┐
│                              PENGGUNA                                   │
│                       (Browser Web / Nasabah)                           │
└───────────────────────────────┬───────────────────────────────────────┘
                                 │ HTTPS
                                 ▼
┌───────────────────────────────────────────────────────────────────────┐
│              FRONTEND — tabungan-haji-web/fe-odp                        │
│        Next.js 16 · React 19 · Tailwind CSS v4 · TypeScript            │
│   (Halaman: Login, Dashboard, Nasabah, Tabungan, Transaksi, Laporan)  │
└───────────────────────────────┬───────────────────────────────────────┘
                                 │ REST + JWT (Authorization: Bearer)
                                 │ Base URL: /api/v1
                                 ▼
┌───────────────────────────────────────────────────────────────────────┐
│              BACKEND — tabungan-haji-online                            │
│        Express 5 · TypeScript · Zod (validasi) · Helmet · CORS         │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐            │
│  │ Nasabah │  │   User   │  │ Tabungan │  │  Transaksi   │  Modul     │
│  └─────────┘  └──────────┘  └──────────┘  └──────────────┘            │
│        Pola 4-lapis: route → controller → service → schema            │
│        Auth: JWT (jsonwebtoken) + bcrypt + token denylist             │
└───────────────────────────────┬───────────────────────────────────────┘
                                 │ Prisma ORM
                                 ▼
┌───────────────────────────────────────────────────────────────────────┐
│                        DATABASE — PostgreSQL                            │
│        Tabel: nasabah · users · tabungan_haji · transaksi              │
└───────────────────────────────────────────────────────────────────────┘
```

### 5.2 Tumpukan Teknologi (Tech Stack)

| Lapisan | Teknologi |
|---------|-----------|
| **Frontend** | Next.js 16.2.6, React 19.2.4, TypeScript 5.x, Tailwind CSS v4, font Geist |
| **Backend** | Node.js ≥18, Express 5.2, TypeScript 6.x, Zod 4 (validasi), Helmet, CORS |
| **Autentikasi** | jsonwebtoken (JWT), bcrypt (12 salt rounds), token denylist (in-memory) |
| **Database/ORM** | PostgreSQL, Prisma 6.19 |
| **Pelaporan** | Ekspor CSV (UTF-8 BOM, CRLF) |
| **Dev Tools** | ts-node, nodemon, Postman collection |

### 5.3 Pola Arsitektur Backend
Setiap modul mengikuti pola **4-lapis**:
- `*.route.ts` — Definisi endpoint & pemasangan middleware.
- `*.controller.ts` — Penanganan request/response & kode error.
- `*.service.ts` — Logika bisnis & akses database (Prisma).
- `*.schema.ts` — Skema validasi (Zod) & konstanta bisnis.

---

## 6. Kebutuhan Fungsional

### 6.1 Modul Nasabah (Customer)
| Kode | Kebutuhan |
|------|-----------|
| FR-NSB-01 | Sistem dapat **mendaftarkan nasabah baru** dengan data NIK, nama, email, dan nomor HP. |
| FR-NSB-02 | Sistem **memvalidasi** NIK (16 digit numerik, unik), nama (3–100 karakter), email (format valid, unik), nomor HP (format `08xxxxxxxxxx`). |
| FR-NSB-03 | Sistem dapat menampilkan **daftar seluruh nasabah** (urut terbaru). |
| FR-NSB-04 | Sistem dapat menampilkan **detail nasabah** berdasarkan ID. |
| FR-NSB-05 | Sistem dapat **memperbarui** data nasabah (sebagian/parsial). |
| FR-NSB-06 | Sistem dapat **menghapus** nasabah. |
| FR-NSB-07 | Sistem menolak duplikasi NIK/email (error `DUPLICATE_ENTRY`). |

### 6.2 Modul User & Autentikasi
| Kode | Kebutuhan |
|------|-----------|
| FR-USR-01 | Sistem dapat **membuat akun login** yang terhubung 1:1 dengan seorang nasabah. |
| FR-USR-02 | Username 4–70 karakter (alfanumerik + `. _ -`), unik; password 8–72 karakter (di-*hash* bcrypt). |
| FR-USR-03 | Sistem menyediakan **login** dengan username & password, mengembalikan **JWT**. |
| FR-USR-04 | Login bersifat **timing-safe** untuk mencegah enumerasi pengguna; pesan error generik (`INVALID_CREDENTIALS`). |
| FR-USR-05 | Sistem menyediakan **logout** yang mencabut token (menambahkan `jti` ke denylist). |
| FR-USR-06 | Sistem dapat menampilkan daftar user, detail user, memperbarui, dan menghapus user. |
| FR-USR-07 | Password **tidak pernah** dikembalikan dalam respons API. |

### 6.3 Modul Tabungan (Rekening)
| Kode | Kebutuhan |
|------|-----------|
| FR-TAB-01 | Sistem dapat **membuka rekening tabungan haji** untuk nasabah, dengan nomor rekening (10–20 digit) yang dapat di-*generate* otomatis (13 digit) bila kosong. |
| FR-TAB-02 | Saldo awal opsional (≥ 0, default 0); status default **AKTIF**. |
| FR-TAB-03 | Sistem dapat menampilkan **daftar rekening** (dapat difilter per `nasabahId`) beserta ringkasan data nasabah. |
| FR-TAB-04 | Sistem dapat menampilkan **detail rekening** berdasarkan ID. |
| FR-TAB-05 | Sistem dapat **mengubah status** rekening (AKTIF / BLOKIR / TUTUP). Saldo **tidak** dapat diubah melalui endpoint ini. |
| FR-TAB-06 | Sistem dapat **menghapus** rekening (gagal bila masih memiliki transaksi terkait). |
| FR-TAB-07 | Sistem dapat menghitung **estimasi keberangkatan haji & kuota** untuk sebuah rekening. |

### 6.4 Modul Transaksi
| Kode | Kebutuhan |
|------|-----------|
| FR-TRX-01 | Sistem dapat **mencatat transaksi** SETORAN atau PENARIKAN secara **atomik** (update saldo + catat transaksi dalam satu transaksi DB). |
| FR-TRX-02 | Transaksi hanya diperbolehkan pada rekening berstatus **AKTIF**. |
| FR-TRX-03 | PENARIKAN tidak boleh menyebabkan saldo negatif (error `SALDO_INSUFFICIENT`). |
| FR-TRX-04 | SETORAN minimal **Rp 100.000** (error `SETORAN_BELOW_MIN`). |
| FR-TRX-05 | Sistem menyediakan endpoint khusus **setoran QRIS**. |
| FR-TRX-06 | Setiap transaksi menyimpan **snapshot** saldo sebelum & sesudah, serta **nomor referensi unik** (di-generate otomatis bila kosong). |
| FR-TRX-07 | Sistem dapat menampilkan **daftar transaksi** (filter per rekening & per jenis) dan **detail transaksi**. |
| FR-TRX-08 | Sistem dapat **mengekspor laporan transaksi bulanan** ke CSV (parameter tahun & bulan wajib). |

### 6.5 Modul Sistem
| Kode | Kebutuhan |
|------|-----------|
| FR-SYS-01 | Sistem menyediakan endpoint **health check** publik untuk memantau ketersediaan layanan. |
| FR-SYS-02 | Frontend menampilkan **indikator status API** (online/offline) secara real-time. |

---

## 7. Kebutuhan Non-Fungsional

| Kode | Kategori | Kebutuhan |
|------|----------|-----------|
| NFR-01 | **Keamanan** | Password di-*hash* bcrypt (12 rounds); JWT ditandatangani dengan `JWT_SECRET`; header keamanan via Helmet. |
| NFR-02 | **Keamanan** | Login timing-safe (anti user-enumeration); token dapat dicabut (logout/denylist). |
| NFR-03 | **Integritas Data** | Operasi keuangan bersifat atomik (DB transaction) untuk mencegah saldo tidak konsisten. |
| NFR-04 | **Validasi** | Seluruh input divalidasi dengan Zod sebelum diproses. |
| NFR-05 | **Kompatibilitas** | Nilai uang besar menggunakan BigInt; diserialisasi sebagai string pada JSON. |
| NFR-06 | **Auditabilitas** | Setiap transaksi menyimpan snapshot saldo & referensi unik; laporan bulanan tersedia. |
| NFR-07 | **Ketersediaan** | Endpoint health check untuk pemantauan uptime. |
| NFR-08 | **Usability** | Antarmuka & pesan berbahasa Indonesia; mendukung locale id-ID; dukungan mode terang/gelap. |
| NFR-09 | **Portabilitas** | Konfigurasi via environment variable (`DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `NEXT_PUBLIC_API_URL`). |
| NFR-10 | **Maintainability** | Pola modular 4-lapis; konstanta bisnis mudah dikonfigurasi pada lapisan schema. |

---

## 8. Aturan Bisnis

### 8.1 Konstanta Bisnis Haji
| Konstanta | Nilai Default | Makna |
|-----------|--------------|-------|
| `SETORAN_AWAL_PORSI` | Rp 25.000.000 | Saldo minimum agar memenuhi syarat mendapatkan porsi/slot kuota. |
| `BIAYA_PELUNASAN` (Bipih) | Rp 56.000.000 | Total biaya per jamaah (status "lunas"). |
| `KUOTA_HAJI_TAHUNAN` | 221.000 | Kuota haji nasional per tahun. |
| `MASA_TUNGGU_TAHUN` | 20 tahun | Rata-rata masa tunggu keberangkatan. |
| `MIN_SETORAN` | Rp 100.000 | Nominal minimum sekali setoran. |

### 8.2 Aturan Estimasi Keberangkatan
1. **Eligible Porsi** = rekening `AKTIF` **DAN** saldo ≥ `SETORAN_AWAL_PORSI`.
2. **Lunas** = saldo ≥ `BIAYA_PELUNASAN`.
3. **Kekurangan Setoran Awal** = `max(0, SETORAN_AWAL_PORSI − saldo)`.
4. **Kekurangan Pelunasan** = `max(0, BIAYA_PELUNASAN − saldo)`.
5. **Persen Terkumpul** = `min(100, saldo × 100 / BIAYA_PELUNASAN)`.
6. **Estimasi Tahun Berangkat** = bila eligible: `tahun_sekarang + MASA_TUNGGU_TAHUN`; bila tidak: `null`.
7. **Porsi Terisi** = jumlah rekening AKTIF dengan saldo ≥ `SETORAN_AWAL_PORSI`.
8. **Sisa Kuota** = `max(0, KUOTA_HAJI_TAHUNAN − porsiTerisi)`.

### 8.3 Aturan Transaksi
- Transaksi hanya pada rekening **AKTIF**.
- SETORAN: `saldoSesudah = saldoSebelum + nominal`; nominal ≥ Rp 100.000.
- PENARIKAN: `saldoSesudah = saldoSebelum − nominal`; `saldoSesudah` wajib ≥ 0.
- Nomor referensi auto-generate: `STR-<timestamp>-<rand>` (setoran), `PNR-<timestamp>-<rand>` (penarikan), `QRIS-<timestamp>-<rand>` (setoran QRIS).
- Operasi pencatatan + update saldo dijalankan **atomik**.

### 8.4 Aturan Relasi
- 1 Nasabah → **banyak** Rekening Tabungan (1:N).
- 1 Nasabah → **maksimal 1** akun User login (1:0..1).
- 1 Rekening Tabungan → **banyak** Transaksi (1:N).

---

## 9. Model Data

### 9.1 Entity Relationship Diagram (ERD)

```
┌──────────────────────────┐
│         NASABAH          │
├──────────────────────────┤
│ id            UUID  (PK)  │
│ nik           VARCHAR(16) UNIQUE
│ nama          VARCHAR(100)│
│ email         VARCHAR(150) UNIQUE
│ nomorHp       VARCHAR(20) │
│ createdAt     DateTime    │
│ updatedAt     DateTime    │
└────────┬─────────────┬────┘
         │ 1:N         │ 1:0..1
         │             │
         ▼             ▼
┌──────────────────┐  ┌─────────────────────────┐
│  TABUNGAN_HAJI   │  │          USERS          │
├──────────────────┤  ├─────────────────────────┤
│ id        UUID PK│  │ id          UUID  (PK)   │
│ nasabahId FK     │  │ nasabahId   FK UNIQUE     │
│ nomorRekening U  │  │ username    VARCHAR(70) U │
│ saldo     BigInt │  │ password    VARCHAR(255)  │
│ status    VARCHAR│  │ createdAt   DateTime       │
│ dibukaAt  DateTime  │ updatedAt   DateTime       │
└────────┬─────────┘  └─────────────────────────┘
         │ 1:N
         ▼
┌────────────────────────────┐
│         TRANSAKSI          │
├────────────────────────────┤
│ id            UUID  (PK)    │
│ tabunganId    FK            │
│ jenis         VARCHAR(20)   │  SETORAN | PENARIKAN
│ nominal       BigInt        │
│ saldoSebelum  BigInt        │
│ saldoSesudah  BigInt        │
│ referensi     VARCHAR(50) U │
│ metode        VARCHAR(20)   │  TUNAI|TRANSFER|DEBIT|KARTU|QRIS
│ waktu         DateTime      │
└────────────────────────────┘
```

### 9.2 Enumerasi
| Enum | Nilai |
|------|-------|
| **Status Tabungan** | `AKTIF`, `BLOKIR`, `TUTUP` |
| **Jenis Transaksi** | `SETORAN`, `PENARIKAN` |
| **Metode Transaksi** | `TUNAI`, `TRANSFER`, `DEBIT`, `KARTU`, `QRIS` |

---

## 10. Spesifikasi API

**Base URL:** `http://localhost:3000` · **Prefix:** `/api/v1` · **Auth:** `Authorization: Bearer <JWT>`

### 10.1 Ringkasan Endpoint
| Modul | Method | Path | Auth | Fungsi |
|-------|--------|------|:----:|--------|
| System | GET | `/health` | ❌ | Cek kesehatan layanan |
| Nasabah | POST | `/api/v1/nasabah` | ❌ | Daftar nasabah baru |
| Nasabah | GET | `/api/v1/nasabah` | ✅ | Daftar nasabah |
| Nasabah | GET | `/api/v1/nasabah/:id` | ✅ | Detail nasabah |
| Nasabah | PATCH | `/api/v1/nasabah/:id` | ✅ | Update nasabah |
| Nasabah | DELETE | `/api/v1/nasabah/:id` | ✅ | Hapus nasabah |
| User | POST | `/api/v1/user` | ❌ | Buat akun login |
| User | POST | `/api/v1/user/login` | ❌ | Login (dapatkan JWT) |
| User | POST | `/api/v1/user/logout` | ✅ | Logout (cabut token) |
| User | GET | `/api/v1/user` | ✅ | Daftar user |
| User | GET | `/api/v1/user/:id` | ✅ | Detail user |
| User | PATCH | `/api/v1/user/:id` | ✅ | Update user |
| User | DELETE | `/api/v1/user/:id` | ✅ | Hapus user |
| Tabungan | POST | `/api/v1/tabungan` | ✅ | Buka rekening |
| Tabungan | GET | `/api/v1/tabungan` | ✅ | Daftar rekening (filter `nasabahId`) |
| Tabungan | GET | `/api/v1/tabungan/:id` | ✅ | Detail rekening |
| Tabungan | GET | `/api/v1/tabungan/:id/estimasi` | ✅ | Estimasi keberangkatan haji |
| Tabungan | PATCH | `/api/v1/tabungan/:id` | ✅ | Ubah status rekening |
| Tabungan | DELETE | `/api/v1/tabungan/:id` | ✅ | Hapus rekening |
| Transaksi | POST | `/api/v1/transaksi` | ✅ | Catat transaksi |
| Transaksi | POST | `/api/v1/transaksi/qris/setor` | ✅ | Setoran QRIS |
| Transaksi | GET | `/api/v1/transaksi` | ✅ | Daftar transaksi (filter `tabunganId`, `jenis`) |
| Transaksi | GET | `/api/v1/transaksi/:id` | ✅ | Detail transaksi |
| Transaksi | GET | `/api/v1/transaksi/laporan/bulanan` | ✅ | Ekspor laporan CSV (`tahun`, `bulan`) |

### 10.2 Format Respons Standar
```json
// Sukses (tunggal)
{ "data": { ... }, "message": "..." }

// Sukses (list)
{ "data": [ ... ], "total": 10 }

// Error
{ "error": "KODE_ERROR", "message": "Penjelasan..." }
```

### 10.3 Kode Error Utama
| HTTP | Kode | Makna |
|------|------|-------|
| 400 | `VALIDATION_ERR` | Input tidak valid |
| 400 | `INVALID_REFERENCE` | Referensi (mis. nasabahId) tidak ditemukan |
| 401 | `UNAUTHORIZED` / `INVALID_TOKEN` / `TOKEN_EXPIRED` / `TOKEN_REVOKED` | Masalah autentikasi |
| 401 | `INVALID_CREDENTIALS` | Username/password salah |
| 404 | `NOT_FOUND` / `TABUNGAN_NOT_FOUND` | Data tidak ditemukan |
| 409 | `DUPLICATE_ENTRY` | Data unik sudah ada (NIK, email, username, no. rekening, referensi) |
| 409 | `TABUNGAN_NOT_ACTIVE` | Rekening tidak berstatus AKTIF |
| 422 | `SALDO_INSUFFICIENT` | Saldo tidak cukup untuk penarikan |
| 422 | `SETORAN_BELOW_MIN` | Setoran di bawah Rp 100.000 |
| 422 | `NASABAH_NOT_FOUND` | nasabahId tidak ada saat membuat user |

### 10.4 Contoh Payload Kunci
**Registrasi Nasabah** — `POST /api/v1/nasabah`
```json
{ "nik": "3201020107950001", "nama": "Andhini Wira Pratiwi",
  "email": "andhini@example.com", "nomorHp": "081234567890" }
```
**Login** — `POST /api/v1/user/login`
```json
{ "username": "andhini", "password": "rahasia123" }
// → { "token": "eyJ...", "data": { "id", "username", "nasabahId", "nasabah": {...} } }
```
**Catat Transaksi** — `POST /api/v1/transaksi`
```json
{ "tabunganId": "<uuid>", "jenis": "SETORAN", "nominal": 250000, "metode": "TUNAI" }
```
**Setoran QRIS** — `POST /api/v1/transaksi/qris/setor`
```json
{ "tabunganId": "<uuid>", "nominal": 150000 }
```

---

## 11. Flow Process (Alur Proses)

### 11.1 Alur Onboarding Nasabah Baru (End-to-End)

```
┌──────────┐   ┌─────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  MULAI   │──▶│ Registrasi      │──▶│ Buat Akun Login  │──▶│ Buka Rekening    │
│          │   │ Nasabah         │   │ (User)           │   │ Tabungan Haji    │
│          │   │ POST /nasabah   │   │ POST /user       │   │ POST /tabungan   │
└──────────┘   └─────────────────┘   └──────────────────┘   └────────┬─────────┘
                                                                       │
   ┌───────────────────────────────────────────────────────────────────┘
   ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐   ┌────────┐
│ Login            │──▶│ Setoran Rutin    │──▶│ Pantau Estimasi  │──▶│ SELESAI│
│ POST /user/login │   │ POST /transaksi  │   │ GET .../estimasi │   │        │
│ (dapat JWT)      │   │ (SETORAN/QRIS)   │   │                  │   │        │
└──────────────────┘   └──────────────────┘   └──────────────────┘   └────────┘
```

### 11.2 Alur Autentikasi (Login → Akses → Logout)

```
    Nasabah                Frontend              Backend API           Database
       │                      │                      │                    │
       │  isi username/pass   │                      │                    │
       ├─────────────────────▶│                      │                    │
       │                      │  POST /user/login    │                    │
       │                      ├─────────────────────▶│  cari user         │
       │                      │                      ├───────────────────▶│
       │                      │                      │◀───────────────────┤
       │                      │                      │ bcrypt.compare     │
       │                      │                      │ (timing-safe)      │
       │                      │  200 + JWT token     │                    │
       │                      │◀─────────────────────┤                    │
       │                      │ simpan token         │                    │
       │  tampilkan dashboard │ (localStorage)       │                    │
       │◀─────────────────────┤                      │                    │
       │                      │                      │                    │
       │  aksi terproteksi    │  Bearer <token>      │                    │
       ├─────────────────────▶├─────────────────────▶│ verifikasi JWT     │
       │                      │                      │ cek denylist (jti) │
       │                      │  200 data            │                    │
       │◀─────────────────────┤◀─────────────────────┤                    │
       │                      │                      │                    │
       │  klik Logout         │  POST /user/logout   │                    │
       ├─────────────────────▶├─────────────────────▶│ revoke jti         │
       │                      │  200 OK              │ (denylist)         │
       │◀─────────────────────┤◀─────────────────────┤                    │
```

### 11.3 Alur Transaksi Setoran (dengan Validasi Aturan Bisnis)

```
                          ┌─────────────────────────────┐
                          │  POST /api/v1/transaksi      │
                          │  { tabunganId, jenis,        │
                          │    nominal, metode }         │
                          └──────────────┬──────────────┘
                                         ▼
                          ┌─────────────────────────────┐
                          │ 1. Validasi skema (Zod)      │
                          └──────────────┬──────────────┘
                                 valid?  │
                       ┌────── tidak ────┴──── ya ───────┐
                       ▼                                  ▼
            ┌────────────────────┐         ┌─────────────────────────────┐
            │ 400 VALIDATION_ERR │         │ 2. Cari rekening (tabunganId)│
            └────────────────────┘         └──────────────┬──────────────┘
                                              ada?         │
                                  ┌─── tidak ──┴─── ya ────┐
                                  ▼                        ▼
                       ┌────────────────────┐  ┌─────────────────────────────┐
                       │ 404 TABUNGAN_       │  │ 3. Cek status == AKTIF?      │
                       │     NOT_FOUND       │  └──────────────┬──────────────┘
                       └────────────────────┘     AKTIF?      │
                                       ┌─── tidak ─┴─── ya ────┐
                                       ▼                       ▼
                            ┌────────────────────┐ ┌─────────────────────────────┐
                            │ 409 TABUNGAN_       │ │ 4. Hitung saldoSesudah       │
                            │     NOT_ACTIVE      │ │   SETORAN: +nominal          │
                            └────────────────────┘ │   PENARIKAN: -nominal        │
                                                    └──────────────┬──────────────┘
                                                                   ▼
                            ┌─────────────────────────────────────────────────────┐
                            │ 5. Validasi aturan:                                   │
                            │   • PENARIKAN → saldoSesudah ≥ 0 ?                    │
                            │       tidak → 422 SALDO_INSUFFICIENT                  │
                            │   • SETORAN  → nominal ≥ Rp 100.000 ?                 │
                            │       tidak → 422 SETORAN_BELOW_MIN                   │
                            └──────────────────────┬──────────────────────────────┘
                                          lolos?   │
                                                   ▼
                            ┌─────────────────────────────────────────────────────┐
                            │ 6. TRANSAKSI DB ATOMIK:                               │
                            │   • UPDATE tabungan.saldo                             │
                            │   • INSERT transaksi (snapshot + referensi unik)      │
                            └──────────────────────┬──────────────────────────────┘
                                                   ▼
                            ┌─────────────────────────────────────────────────────┐
                            │ 201 Created — { data: transaksi, message }            │
                            └─────────────────────────────────────────────────────┘
```

### 11.4 Alur Estimasi Keberangkatan Haji

```
  GET /api/v1/tabungan/:id/estimasi
            │
            ▼
  Ambil rekening + saldo + status
            │
            ▼
  ┌────────────────────────────────────────────┐
  │ saldo ≥ 25 juta DAN status AKTIF ?          │
  └───────────────┬─────────────────┬───────────┘
            ya    │                 │   tidak
                  ▼                 ▼
  ┌───────────────────────┐  ┌───────────────────────────┐
  │ eligiblePorsi = true  │  │ eligiblePorsi = false      │
  │ estimasiBerangkat =   │  │ estimasiBerangkat = null   │
  │   2026 + 20 = 2046    │  │ kekuranganSetoranAwal =    │
  │ cek lunas (≥56 juta)  │  │   25jt − saldo             │
  └──────────┬────────────┘  └─────────────┬─────────────┘
             └───────────────┬─────────────┘
                             ▼
  ┌──────────────────────────────────────────────────────┐
  │ Hitung: persenTerkumpul, sisaKuota, keterangan         │
  │ → 200 { data: { ...estimasi }, message }               │
  └──────────────────────────────────────────────────────┘
```

### 11.5 Alur Laporan Bulanan (CSV)

```
GET /api/v1/transaksi/laporan/bulanan?tahun=2026&bulan=5
        │
        ▼
Validasi tahun (2000–2100) & bulan (1–12)  ──tidak──▶ 400 VALIDATION_ERR
        │ valid
        ▼
Query transaksi rentang [awal bulan, awal bulan berikutnya) (UTC)
opsional filter: tabunganId, jenis · urut waktu ASC
        │
        ▼
Bangun CSV (UTF-8 BOM, CRLF):
waktu,referensi,nomorRekening,namaNasabah,nik,jenis,metode,nominal,saldoSebelum,saldoSesudah
        │
        ▼
200 · Content-Type: text/csv · attachment: laporan-transaksi-2026-05.csv
```

---

## 12. Mock Up (Rancangan Antarmuka)

> Rancangan wireframe low-fidelity berbahasa Indonesia. Skema warna mengikuti frontend: **Emerald/Hijau** (utama & status sukses), **Merah** (error/penarikan), **Abu** (netral). Mendukung mode terang/gelap & responsif.

### 12.1 Halaman Login
```
┌───────────────────────────────────────────────────────────────┐
│                                                                 │
│                    🕋  TABUNGAN HAJI ONLINE                     │
│                                                                 │
│            ┌─────────────────────────────────────┐             │
│            │            Masuk Akun               │             │
│            │  ─────────────────────────────────  │             │
│            │  Username                            │             │
│            │  ┌─────────────────────────────────┐ │             │
│            │  │ andhini                         │ │             │
│            │  └─────────────────────────────────┘ │             │
│            │  Password                            │             │
│            │  ┌─────────────────────────────────┐ │             │
│            │  │ ••••••••••              👁       │ │             │
│            │  └─────────────────────────────────┘ │             │
│            │                                      │             │
│            │  ┌─────────────────────────────────┐ │             │
│            │  │           MASUK  ▶              │ │  (hijau)    │
│            │  └─────────────────────────────────┘ │             │
│            │                                      │             │
│            │  Belum punya akun? Daftar di sini    │             │
│            └─────────────────────────────────────┘             │
│                                                                 │
│              ● API Online · dicek 10:30:45   [Cek ulang]        │
└───────────────────────────────────────────────────────────────┘
```

### 12.2 Halaman Registrasi Nasabah + Akun
```
┌───────────────────────────────────────────────────────────────┐
│  🕋 Tabungan Haji        Daftar Nasabah Baru                    │
├───────────────────────────────────────────────────────────────┤
│  Langkah 1 dari 2 — Data Diri                                   │
│                                                                 │
│   NIK (16 digit)            ┌──────────────────────────────┐    │
│                             │ 3201020107950001             │    │
│                             └──────────────────────────────┘    │
│   Nama Lengkap              ┌──────────────────────────────┐    │
│                             │ Andhini Wira Pratiwi         │    │
│                             └──────────────────────────────┘    │
│   Email                     ┌──────────────────────────────┐    │
│                             │ andhini@example.com          │    │
│                             └──────────────────────────────┘    │
│   Nomor HP                  ┌──────────────────────────────┐    │
│                             │ 081234567890                 │    │
│                             └──────────────────────────────┘    │
│                                                                 │
│   Langkah 2 — Akun Login                                        │
│   Username                  ┌──────────────────────────────┐    │
│                             │ andhini                      │    │
│                             └──────────────────────────────┘    │
│   Password (min. 8)         ┌──────────────────────────────┐    │
│                             │ ••••••••••                   │    │
│                             └──────────────────────────────┘    │
│                                                                 │
│        [ Batal ]                       [  DAFTAR  ▶ ] (hijau)    │
└───────────────────────────────────────────────────────────────┘
```

### 12.3 Dashboard Nasabah
```
┌───────────────────────────────────────────────────────────────┐
│ 🕋 Tabungan Haji   Dashboard │ Rekening │ Transaksi │ Laporan   │
│                                          Andhini ▾  [Keluar]    │
├───────────────────────────────────────────────────────────────┤
│  Assalamualaikum, Andhini 👋                                    │
│                                                                 │
│  ┌─────────────────────┐ ┌─────────────────────┐ ┌───────────┐ │
│  │ Total Saldo         │ │ Estimasi Berangkat  │ │ Progres   │ │
│  │ Rp 60.000.000       │ │ 2046                │ │   ▓▓▓▓░ 100%│ │
│  │ (hijau)             │ │ (masa tunggu 20 th) │ │ Lunas ✓   │ │
│  └─────────────────────┘ └─────────────────────┘ └───────────┘ │
│                                                                 │
│  Rekening Saya                              [+ Buka Rekening]   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ No. Rekening    │ Saldo         │ Status  │ Aksi          │  │
│  │ ─────────────── │ ───────────── │ ─────── │ ───────────── │  │
│  │ 9892838190640   │ Rp 60.000.000 │ ●AKTIF  │ Detail │ Setor│  │
│  │ 9953879406674   │ Rp 15.000.000 │ ●AKTIF  │ Detail │ Setor│  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Transaksi Terakhir                                             │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ 28 Mei 2026  SETORAN  TUNAI   + Rp 250.000   STR-...0421 │  │
│  │ 27 Mei 2026  SETORAN  QRIS    + Rp 150.000   QRIS-..1102 │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

### 12.4 Detail Rekening + Estimasi Haji
```
┌───────────────────────────────────────────────────────────────┐
│ ← Kembali     Detail Rekening Tabungan Haji                     │
├───────────────────────────────────────────────────────────────┤
│  No. Rekening : 9892838190640          Status: ● AKTIF          │
│  Pemilik      : Andhini Wira Pratiwi (NIK 3201020107950001)     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  SALDO SAAT INI                                          │  │
│  │  Rp 60.000.000                                  (hijau)  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Estimasi Keberangkatan Haji                                    │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Setoran Awal Porsi (25jt)  ✓ Terpenuhi                   │  │
│  │ Pelunasan (Bipih 56jt)     ✓ Lunas                       │  │
│  │ Progres   ▓▓▓▓▓▓▓▓▓▓ 100%                                 │  │
│  │ Tahun Daftar : 2026   →   Estimasi Berangkat : 2046      │  │
│  │ Sisa Kuota Nasional 2026 : 220.999 / 221.000             │  │
│  │ "Saldo memenuhi setoran awal porsi. Estimasi berangkat   │  │
│  │  2046 (masa tunggu 20 tahun)."                           │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [ + Setor Tunai ] [ 📷 Setor QRIS ] [ − Tarik ] [ ⚙ Status ]  │
└───────────────────────────────────────────────────────────────┘
```

### 12.5 Form Transaksi (Setor / Tarik)
```
┌─────────────────────────────────────────┐
│  Setor Dana — Rek. 9892838190640         │
├─────────────────────────────────────────┤
│  Jenis     ( • Setoran )  ( ◦ Penarikan )│
│                                           │
│  Nominal (Rp)                             │
│  ┌─────────────────────────────────────┐ │
│  │ 250.000                             │ │
│  └─────────────────────────────────────┘ │
│  ⓘ Setoran minimal Rp 100.000           │
│                                           │
│  Metode                                   │
│  ┌─────────────────────────────────────┐ │
│  │ TUNAI                            ▾  │ │
│  └─────────────────────────────────────┘ │
│   TUNAI · TRANSFER · DEBIT · KARTU · QRIS │
│                                           │
│  Saldo setelah transaksi: Rp 60.250.000   │
│                                           │
│   [ Batal ]            [ PROSES ▶ ](hijau)│
└─────────────────────────────────────────┘
```

### 12.6 Setoran QRIS
```
┌─────────────────────────────────────────┐
│  Setor via QRIS                           │
├─────────────────────────────────────────┤
│  Nominal (Rp)  ┌──────────────────────┐  │
│                │ 150.000              │  │
│                └──────────────────────┘  │
│                                           │
│        ┌───────────────────────┐          │
│        │  ▓▓ ▓  ▓▓▓ ▓ ▓▓       │          │
│        │  ▓ QR  CODE  QRIS ▓   │          │
│        │  ▓▓▓ ▓ ▓  ▓▓ ▓  ▓     │          │
│        └───────────────────────┘          │
│   Pindai dengan aplikasi pembayaran Anda  │
│                                           │
│   Status: ⏳ Menunggu pembayaran...       │
│                                           │
│   [ Batal ]        [ Saya Sudah Bayar ]   │
└─────────────────────────────────────────┘
   → POST /transaksi/qris/setor
```

### 12.7 Daftar / Riwayat Transaksi (dengan Filter)
```
┌───────────────────────────────────────────────────────────────┐
│  Riwayat Transaksi                                              │
├───────────────────────────────────────────────────────────────┤
│  Rekening: [ Semua ▾ ]  Jenis: [ Semua ▾ ]  [🔍 Terapkan]      │
├───────────────────────────────────────────────────────────────┤
│ Waktu        │ Jenis    │ Metode │ Nominal      │ Saldo Akhir   │
│ ──────────── │ ──────── │ ────── │ ──────────── │ ───────────── │
│ 28/05 14:05  │ SETORAN  │ TUNAI  │ +Rp 250.000  │ Rp 60.250.000 │
│ 28/05 10:30  │ PENARIKAN│ TUNAI  │ −Rp 500.000  │ Rp 60.000.000 │
│ 27/05 09:15  │ SETORAN  │ QRIS   │ +Rp 150.000  │ Rp 60.500.000 │
│ ...                                                            │
├───────────────────────────────────────────────────────────────┤
│              Total: 24 transaksi          ‹ 1 2 3 ›            │
└───────────────────────────────────────────────────────────────┘
```

### 12.8 Halaman Laporan Bulanan (Ekspor CSV)
```
┌───────────────────────────────────────────────────────────────┐
│  Laporan Transaksi Bulanan                                      │
├───────────────────────────────────────────────────────────────┤
│  Tahun  [ 2026 ▾ ]   Bulan  [ Mei ▾ ]                           │
│  Rekening (opsional) [ Semua ▾ ]   Jenis [ Semua ▾ ]            │
│                                                                 │
│              [ 📥 Unduh CSV ]   (hijau)                         │
│                                                                 │
│  Pratinjau:                                                     │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ waktu | referensi | nomorRekening | nama | jenis | ...   │  │
│  │ 2026-05-28 | STR-...0500 | 9953... | Widya | SETORAN ... │  │
│  └─────────────────────────────────────────────────────────┘  │
│  File: laporan-transaksi-2026-05.csv                            │
└───────────────────────────────────────────────────────────────┘
```

### 12.9 Manajemen Status Rekening (Petugas)
```
┌─────────────────────────────────────────┐
│  Ubah Status Rekening                     │
├─────────────────────────────────────────┤
│  Rek. 9892838190640 — Andhini             │
│                                           │
│  Status saat ini : ● AKTIF                │
│                                           │
│  Ubah menjadi:                            │
│    ( • AKTIF )                            │
│    ( ◦ BLOKIR )                           │
│    ( ◦ TUTUP )                            │
│                                           │
│  ⚠ Rekening non-AKTIF tidak dapat         │
│    menerima transaksi.                    │
│                                           │
│   [ Batal ]          [ SIMPAN ](hijau)    │
└─────────────────────────────────────────┘
```

### 12.10 Peta Navigasi Antar Layar
```
                         ┌──────────────┐
                         │    LOGIN     │◀──────────┐
                         └──────┬───────┘           │
                  daftar │      │ login ok          │ logout
                         ▼      ▼                   │
              ┌──────────────┐  ┌──────────────────────────┐
              │  REGISTRASI  │  │       DASHBOARD          │
              └──────────────┘  └───┬───────┬──────┬───────┘
                                    │       │      │
                  ┌─────────────────┘       │      └────────────┐
                  ▼                         ▼                   ▼
         ┌─────────────────┐      ┌──────────────────┐  ┌──────────────┐
         │ DETAIL REKENING │      │ RIWAYAT TRANSAKSI│  │   LAPORAN    │
         │  + Estimasi     │      │   + Filter       │  │   (CSV)      │
         └───────┬─────────┘      └──────────────────┘  └──────────────┘
                 │
     ┌───────────┼───────────┬───────────────┐
     ▼           ▼           ▼               ▼
 ┌────────┐ ┌────────┐ ┌──────────┐  ┌──────────────┐
 │ Setor  │ │ Tarik  │ │ Setor    │  │ Ubah Status  │
 │ Tunai  │ │        │ │ QRIS     │  │ Rekening     │
 └────────┘ └────────┘ └──────────┘  └──────────────┘
```

---

## 13. Asumsi, Batasan & Risiko

### 13.1 Asumsi
- Backend berjalan pada `http://localhost:3000`; frontend membaca `NEXT_PUBLIC_API_URL`.
- Konstanta haji (porsi, pelunasan, kuota, masa tunggu) bersifat parameter yang dapat dikonfigurasi.
- Satu nasabah memiliki maksimal satu akun login.

### 13.2 Batasan Saat Ini
- **Frontend** baru tahap awal — hanya indikator health check; seluruh layar fitur masih harus dibangun.
- **Denylist token** disimpan in-memory → akan ter-reset saat server restart dan tidak cocok untuk multi-instance.
- **CORS** terbuka untuk semua origin (perlu dibatasi untuk produksi).
- Belum ada pemisahan **peran (RBAC)** antara nasabah dan petugas/admin.
- Estimasi keberangkatan bersifat **proksi** (porsi terisi = jumlah rekening eligible), bukan integrasi data SISKOHAT nyata.

### 13.3 Risiko & Mitigasi
| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| Denylist in-memory hilang saat restart | Token yang sudah logout bisa dipakai lagi sebelum kedaluwarsa | Gunakan Redis/penyimpanan persisten |
| CORS terbuka | Potensi penyalahgunaan lintas origin | Whitelist origin di produksi |
| Tidak ada RBAC | Nasabah berpotensi mengakses data nasabah lain | Tambahkan otorisasi berbasis kepemilikan & peran |
| Estimasi non-real | Ekspektasi keberangkatan keliru | Beri *disclaimer*; integrasi SISKOHAT pada fase lanjut |

---

## 14. Roadmap & Rekomendasi

### 14.1 Prioritas Pengembangan Frontend (mengacu mockup Bab 12)
1. **Fase 1 — Autentikasi:** Halaman Login & Registrasi + penyimpanan/penanganan JWT + proteksi route.
2. **Fase 2 — Dashboard & Rekening:** Dashboard nasabah, daftar & detail rekening, estimasi haji.
3. **Fase 3 — Transaksi:** Form setor/tarik, setoran QRIS, riwayat transaksi + filter.
4. **Fase 4 — Laporan:** Halaman laporan bulanan + unduh CSV.
5. **Fase 5 — Penyempurnaan:** Mode gelap, responsif penuh, state management (mis. Zustand/Context), penanganan error global.

### 14.2 Rekomendasi Backend
- Implementasi **RBAC** (peran nasabah vs petugas/admin) dan otorisasi berbasis kepemilikan rekening.
- Pindahkan **denylist token** ke Redis untuk dukungan multi-instance.
- Batasi **CORS** & terapkan **rate limiting** pada endpoint sensitif (login).
- Integrasi nyata dengan **payment gateway** (QRIS) & **SISKOHAT** pada fase lanjut.
- Tambahkan **refresh token** untuk pengalaman sesi yang lebih baik.

---

> **Catatan Akhir:** Dokumen ini disusun berdasarkan analisis kode sumber aktual ketiga repositori (`tabungan-haji-online`, `tabungan-haji-web`, `fe-odp`). Seluruh nama field, path endpoint, aturan validasi, dan logika bisnis telah diverifikasi langsung dari kode. Mockup pada Bab 12 merupakan rancangan target UI yang menyelaraskan kapabilitas backend yang sudah lengkap dengan frontend yang masih perlu dibangun.
