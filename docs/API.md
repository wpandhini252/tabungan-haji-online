# Tabungan Haji API — Documentation

REST API untuk produk **Tabungan Haji**. Dibangun dengan Node.js + TypeScript, Express 5, Prisma 6, dan PostgreSQL.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup database (.env)
DATABASE_URL="postgresql://user:password@localhost:5432/Tabungan_Haji?schema=public"
PORT=3000

# 3. Jalankan migrasi
npx prisma migrate dev

# 4. Run server (development)
npm run dev
```

Server akan jalan di `http://localhost:3000`.

---

## Base URL

```
http://localhost:3000
```

Semua endpoint resource menggunakan prefix `/api/v1`.

---

## Konvensi Response

**Success** selalu membungkus payload dalam `data`:

```json
{ "data": { ... }, "message": "..." }
```

**Error** selalu memiliki shape:

```json
{ "error": "ERROR_CODE", "message": "Pesan untuk user", "details": { ... } }
```

### Error Codes

| HTTP | `error`           | Kapan terjadi                                    |
|------|-------------------|--------------------------------------------------|
| 400  | `VALIDATION_ERR`  | Body / parameter tidak lolos validasi Zod        |
| 404  | `NOT_FOUND`       | Resource (mis. nasabah) tidak ada                |
| 409  | `DUPLICATE_ENTRY` | Unique constraint terlanggar (NIK / email)       |
| 500  | _(default)_       | Error tak tertangani                             |

---

## Health Check

### `GET /health`

Memastikan server hidup.

**Response 200**

```json
{
  "status": "ok",
  "service": "tabungan-haji-api",
  "timestamp": "2026-05-26T10:00:00.000Z"
}
```

---

## Modul Nasabah

Base path: `/api/v1/nasabah`

### Schema

| Field      | Tipe   | Aturan                                                       |
|------------|--------|--------------------------------------------------------------|
| `nik`      | string | Wajib, **tepat 16 digit angka**, unique                      |
| `nama`     | string | Wajib, 3–100 karakter                                        |
| `email`    | string | Wajib, format email valid, ≤150 karakter, unique             |
| `nomorHp`  | string | Wajib, format `08xxxxxxxxxx` (10–13 digit)                   |

---

### 1) Create Nasabah

`POST /api/v1/nasabah`

**Request body**

```json
{
  "nik": "3201020107950001",
  "nama": "Andhini Wira Pratiwi",
  "email": "andhini@example.com",
  "nomorHp": "081234567890"
}
```

**Response 201**

```json
{
  "data": {
    "id": "a4d9f2a7-1234-4abc-9876-0e1f2a3b4c5d",
    "nik": "3201020107950001",
    "nama": "Andhini Wira Pratiwi",
    "email": "andhini@example.com",
    "nomorHp": "081234567890",
    "createdAt": "2026-05-26T10:00:00.000Z",
    "updatedAt": "2026-05-26T10:00:00.000Z"
  },
  "message": "Nasabah berhasil dibuat"
}
```

**Possible errors**

| Status | `error`           | Contoh penyebab                       |
|--------|-------------------|----------------------------------------|
| 400    | `VALIDATION_ERR`  | NIK bukan 16 digit, email invalid, dst |
| 409    | `DUPLICATE_ENTRY` | NIK atau email sudah terdaftar         |

---

### 2) List Nasabah

`GET /api/v1/nasabah`

Mengembalikan semua nasabah, terurut `createdAt` descending.

**Response 200**

```json
{
  "data": [
    { "id": "...", "nik": "...", "nama": "...", "email": "...", "nomorHp": "...", "createdAt": "...", "updatedAt": "..." }
  ],
  "total": 1
}
```

---

### 3) Get Nasabah by ID

`GET /api/v1/nasabah/:id`

Param `id` **wajib UUID** valid.

**Response 200**

```json
{
  "data": { "id": "...", "nik": "...", "nama": "...", "email": "...", "nomorHp": "...", "createdAt": "...", "updatedAt": "..." }
}
```

**Possible errors**

| Status | `error`          | Penyebab                       |
|--------|------------------|---------------------------------|
| 400    | `VALIDATION_ERR` | `id` bukan UUID valid           |
| 404    | `NOT_FOUND`      | Nasabah dengan ID tsb tidak ada |

---

### 4) Update Nasabah

`PATCH /api/v1/nasabah/:id`

Update parsial. **Minimal satu field** harus dikirim. Aturan validasi tiap field sama dengan Create.

**Request body** (contoh: cuma update nomor HP)

```json
{ "nomorHp": "082345678901" }
```

**Response 200**

```json
{
  "data": { "id": "...", "nik": "...", "nama": "...", "email": "...", "nomorHp": "082345678901", "createdAt": "...", "updatedAt": "..." },
  "message": "Nasabah berhasil diupdate"
}
```

**Possible errors**

| Status | `error`           | Penyebab                                     |
|--------|-------------------|----------------------------------------------|
| 400    | `VALIDATION_ERR`  | `id` invalid, body kosong, atau field invalid|
| 404    | `NOT_FOUND`       | ID tidak ada                                 |
| 409    | `DUPLICATE_ENTRY` | NIK / email ditabrak ke nasabah lain         |

---

### 5) Delete Nasabah

`DELETE /api/v1/nasabah/:id`

**Response 204** — no body.

**Possible errors**

| Status | `error`          | Penyebab            |
|--------|------------------|---------------------|
| 400    | `VALIDATION_ERR` | `id` bukan UUID     |
| 404    | `NOT_FOUND`      | ID tidak ada        |

---

## Postman Collection

Import file berikut ke Postman:

```
postman/tabungan-haji-api.postman_collection.json
postman/tabungan-haji-api.postman_environment.json
```

Variabel environment:

| Variable    | Default                  | Keterangan                                          |
|-------------|--------------------------|-----------------------------------------------------|
| `baseUrl`   | `http://localhost:3000`  | Base URL server                                     |
| `nasabahId` | _(kosong)_               | Otomatis terisi setelah `Create Nasabah` sukses     |

Request `Create Nasabah` punya test-script yang menyimpan `data.id` ke variable `nasabahId`, jadi request `Get / Update / Delete by ID` langsung bisa dijalankan setelahnya.
