# Dokumentasi API — Tabungan & Transaksi

Dokumentasi untuk modul `tabungan` dan `transaksi` pada Tabungan Haji API.

- **Base URL:** `http://localhost:3000`
- **Prefix:** `/api/v1`
- **Content-Type:** `application/json`

> **Catatan tipe data:** field `saldo` (Tabungan) dan `nominal` / `saldoSebelum` / `saldoSesudah` (Transaksi) disimpan sebagai `BigInt` di Postgres dan dikembalikan sebagai **string** di response JSON (custom serializer di [src/index.ts](../src/index.ts)). Saat kirim request, gunakan **number** biasa — Zod akan parse ke integer.

---

## Format respons umum

**Sukses:**
```json
{ "data": { ... }, "message": "..." }
```

**List:**
```json
{ "data": [ ... ], "total": 12 }
```

**Error:**
```json
{ "error": "KODE_ERROR", "message": "...", "details": { ... } }
```

**Kode error standar:**
| Kode | HTTP | Arti |
|---|---|---|
| `VALIDATION_ERR` | 400 | Body / param / query gagal validasi Zod (lihat `details`) |
| `INVALID_REFERENCE` | 400 | Foreign key tidak ditemukan (`nasabahId` salah) |
| `NOT_FOUND` | 404 | Resource tidak ada |
| `DUPLICATE_ENTRY` | 409 | Field unique sudah terpakai |
| `TABUNGAN_NOT_FOUND` | 404 | Khusus transaksi — tabungan target tidak ada |
| `TABUNGAN_NOT_ACTIVE` | 409 | Khusus transaksi — status rekening bukan `AKTIF` |
| `SALDO_INSUFFICIENT` | 422 | Khusus penarikan — saldo < nominal |

---

## Tabungan — `/api/v1/tabungan`

Pengelolaan rekening tabungan haji. Setiap rekening terikat ke satu `Nasabah`.

### `POST /api/v1/tabungan` — Buka rekening

**Body:**
| Field | Tipe | Wajib | Aturan |
|---|---|---|---|
| `nasabahId` | string (UUID) | ya | Harus merujuk nasabah yang ada |
| `nomorRekening` | string | tidak | 10-20 digit angka. Kalau kosong → auto-generate 13 digit |
| `saldoAwal` | integer | tidak | ≥ 0, default `0` |

**Contoh request:**
```json
{
  "nasabahId": "8f3e2c1b-4a5d-4e6f-9b0c-1d2e3f405a6b",
  "saldoAwal": 500000
}
```

**Respons 201:**
```json
{
  "data": {
    "id": "a1b2...",
    "nasabahId": "8f3e2c1b-...",
    "nomorRekening": "1716712345678",
    "saldo": "500000",
    "status": "AKTIF",
    "dibukaAt": "2026-05-26T10:00:00.000Z"
  },
  "message": "Tabungan berhasil dibuat"
}
```

**Possible errors:** `400 VALIDATION_ERR`, `400 INVALID_REFERENCE`, `409 DUPLICATE_ENTRY` (nomorRekening).

---

### `GET /api/v1/tabungan` — List

**Query params:**
| Field | Tipe | Keterangan |
|---|---|---|
| `nasabahId` | UUID | opsional, filter rekening milik nasabah tertentu |

Urut `dibukaAt` desc. Setiap item include ringkasan nasabah (`id`, `nik`, `nama`, `email`).

---

### `GET /api/v1/tabungan/:id` — Detail

Return satu rekening + nasabah pemilik. 404 kalau tidak ada.

---

### `PATCH /api/v1/tabungan/:id` — Update status

**Body:**
| Field | Tipe | Aturan |
|---|---|---|
| `status` | enum | `AKTIF` \| `BLOKIR` \| `TUTUP` |

Hanya status yang bisa diubah. Saldo tidak boleh diubah via endpoint ini — gunakan transaksi.

---

### `DELETE /api/v1/tabungan/:id`

204 No Content kalau sukses. Akan fail jika masih ada transaksi tertaut (FK constraint).

---

### `GET /api/v1/tabungan/:id/estimasi` — Estimasi keberangkatan haji & sisa kuota

Menghitung estimasi keberangkatan haji dan sisa kuota tahun berjalan berdasarkan **saldo** rekening. Read-only, tidak mengubah data.

**Parameter (konstanta, di [tabungan.schema.ts](../src/modules/tabungan/tabungan.schema.ts) — ubah sesuai kebijakan):**
| Konstanta | Nilai default | Arti |
|---|---|---|
| `SETORAN_AWAL_PORSI` | `25000000` | Saldo minimum agar dapat nomor porsi |
| `BIAYA_PELUNASAN` | `56000000` | Total biaya pelunasan (Bipih) per jamaah |
| `KUOTA_HAJI_TAHUNAN` | `221000` | Kuota nasional per tahun |
| `MASA_TUNGGU_TAHUN` | `20` | Rata-rata masa tunggu (tahun) |

**Alur internal:**
1. Cari `TabunganHaji` by `id` → kalau tidak ada → `404 NOT_FOUND`
2. `eligiblePorsi` = `status === "AKTIF"` **dan** `saldo >= SETORAN_AWAL_PORSI`
3. Kalau eligible → `estimasiTahunKeberangkatan = tahun sekarang + MASA_TUNGGU_TAHUN`; kalau tidak → `null` + `kekuranganSetoranAwal`
4. `porsiTerisi` = jumlah rekening `AKTIF` yang saldonya ≥ setoran awal (proksi kuota terpakai); `sisaKuota = max(0, KUOTA_HAJI_TAHUNAN - porsiTerisi)`

**Respons 200 (saldo memenuhi setoran awal):**
```json
{
  "data": {
    "tabunganId": "b95bfc85-...",
    "nomorRekening": "9892838190640",
    "status": "AKTIF",
    "nasabah": { "id": "2555...", "nik": "3201...", "nama": "Lisya Rasawari" },
    "saldo": "60000000",
    "setoranAwalPorsi": "25000000",
    "biayaPelunasan": "56000000",
    "eligiblePorsi": true,
    "lunas": true,
    "kekuranganSetoranAwal": "0",
    "kekuranganPelunasan": "0",
    "persenTerkumpul": 100,
    "masaTungguTahun": 20,
    "tahunPendaftaran": 2026,
    "estimasiTahunKeberangkatan": 2046,
    "kuotaTahunan": 221000,
    "tahunKuota": 2026,
    "porsiTerisi": 1,
    "sisaKuota": 220999,
    "keterangan": "Saldo memenuhi setoran awal porsi. Estimasi berangkat 2046 (masa tunggu 20 tahun)."
  },
  "message": "Estimasi keberangkatan haji berhasil dihitung"
}
```

Kalau saldo belum cukup, `eligiblePorsi`/`lunas` = `false`, `tahunPendaftaran` & `estimasiTahunKeberangkatan` = `null`, dan `kekuranganSetoranAwal` berisi sisa yang harus disetor.

**Possible errors:** `400 VALIDATION_ERR` (id bukan UUID), `404 NOT_FOUND`.

---

## Transaksi — `/api/v1/transaksi`

Mencatat mutasi rekening. **Operasi `create` bersifat atomic** — saldo rekening dan record transaksi diupdate dalam satu DB transaction (`prisma.$transaction`).

### `POST /api/v1/transaksi` — Catat transaksi

**Alur internal:**
1. Cari `TabunganHaji` by `tabunganId` → kalau tidak ada → `404 TABUNGAN_NOT_FOUND`
2. Cek `status === "AKTIF"` → kalau tidak → `409 TABUNGAN_NOT_ACTIVE`
3. Hitung `saldoSesudah`:
   - `SETORAN`  → `saldo + nominal`
   - `PENARIKAN` → `saldo - nominal`
4. Kalau `saldoSesudah < 0` → `422 SALDO_INSUFFICIENT`
5. Update `tabungan.saldo` + insert `transaksi` dalam transaction yang sama

**Body:**
| Field | Tipe | Wajib | Aturan |
|---|---|---|---|
| `tabunganId` | string (UUID) | ya | |
| `jenis` | enum | ya | `SETORAN` \| `PENARIKAN` |
| `nominal` | integer | ya | > 0 |
| `referensi` | string | tidak | 6-50 karakter, unique. Auto-generate `STR-<timestamp>-<rand>` / `PNR-<timestamp>-<rand>` |
| `metode` | enum | tidak | `TUNAI` \| `TRANSFER` \| `DEBIT` \| `KARTU` |

**Contoh request (setoran):**
```json
{
  "tabunganId": "a1b2...",
  "jenis": "SETORAN",
  "nominal": 250000,
  "metode": "TUNAI"
}
```

**Respons 201:**
```json
{
  "data": {
    "id": "c3d4...",
    "tabunganId": "a1b2...",
    "jenis": "SETORAN",
    "nominal": "250000",
    "saldoSebelum": "500000",
    "saldoSesudah": "750000",
    "referensi": "STR-1716712345678-0421",
    "metode": "TUNAI",
    "waktu": "2026-05-26T10:05:00.000Z"
  },
  "message": "Transaksi berhasil dicatat"
}
```

**Possible errors:** `400 VALIDATION_ERR`, `404 TABUNGAN_NOT_FOUND`, `409 TABUNGAN_NOT_ACTIVE`, `422 SALDO_INSUFFICIENT`, `409 DUPLICATE_ENTRY` (referensi).

---

### `GET /api/v1/transaksi` — List

**Query params:**
| Field | Tipe | Keterangan |
|---|---|---|
| `tabunganId` | UUID | opsional, filter per rekening |
| `jenis` | enum | opsional, `SETORAN` atau `PENARIKAN` |

Urut `waktu` desc.

---

### `GET /api/v1/transaksi/:id` — Detail

Return satu transaksi + ringkasan tabungan (`id`, `nomorRekening`, `status`, `nasabahId`).

---

### `GET /api/v1/transaksi/laporan/bulanan` — Export laporan bulanan (CSV)

Mengunduh laporan transaksi satu bulan sebagai file **CSV** (bukan JSON). Filter rentang waktu `[awal bulan, awal bulan berikutnya)` dihitung berbasis **UTC**.

**Query params:**
| Field | Tipe | Wajib | Aturan |
|---|---|---|---|
| `tahun` | integer | ya | 2000-2100 |
| `bulan` | integer | ya | 1-12 |
| `tabunganId` | UUID | tidak | filter per rekening |
| `jenis` | enum | tidak | `SETORAN` atau `PENARIKAN` |

**Respons 200:**
- `Content-Type: text/csv; charset=utf-8`
- `Content-Disposition: attachment; filename="laporan-transaksi-<tahun>-<bulan>.csv"` (mis. `laporan-transaksi-2026-05.csv`)
- Body diawali BOM UTF-8 (agar Excel membaca karakter Indonesia dengan benar), baris dipisah CRLF.

**Kolom CSV (urut `waktu` asc):**
```
waktu,referensi,nomorRekening,namaNasabah,nik,jenis,metode,nominal,saldoSebelum,saldoSesudah
```
Kalau tidak ada transaksi di bulan tersebut → tetap 200 dengan baris header saja.

**Contoh:**
```
GET /api/v1/transaksi/laporan/bulanan?bulan=5&tahun=2026
GET /api/v1/transaksi/laporan/bulanan?bulan=5&tahun=2026&tabunganId=a1b2...&jenis=SETORAN
```

**Possible errors:** `400 VALIDATION_ERR` (bulan/tahun kosong atau di luar rentang), `401 UNAUTHORIZED`.

---

## Postman

Collection & environment ada di [`postman/`](../postman/):
- `tabungan-haji-api.postman_collection.json`
- `tabungan-haji-api.postman_environment.json`

**Urutan run yang disarankan:**
1. **Health Check**
2. **Nasabah → Create** — auto-set `nasabahId`
3. **Tabungan → Create Tabungan** — auto-set `tabunganId`
4. **Transaksi → Create Setoran / Penarikan** — auto-set `transaksiId`
5. **Negative Cases** (opsional, untuk verifikasi error path)

Variabel `nasabahId`, `tabunganId`, `transaksiId` di-set otomatis oleh test script setelah Create masing-masing, jadi request berikutnya yang pakai `{{tabunganId}}` dll. langsung jalan.
