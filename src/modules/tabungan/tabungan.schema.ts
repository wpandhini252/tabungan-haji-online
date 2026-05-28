import { z } from "zod";

export const StatusTabunganEnum = z.enum(["AKTIF", "BLOKIR", "TUTUP"]);

// Parameter estimasi keberangkatan haji (preset default 2026, ubah sesuai kebijakan)
export const SETORAN_AWAL_PORSI = 25000000;
export const BIAYA_PELUNASAN = 56000000;
export const KUOTA_HAJI_TAHUNAN = 221000;
export const MASA_TUNGGU_TAHUN = 20;

export const CreateTabunganSchema = z.object({
    nasabahId: z.string().uuid("nasabahId harus berupa UUID yang valid"),
    nomorRekening: z
        .string()
        .regex(/^\d{10,20}$/, "Nomor rekening harus 10-20 digit angka")
        .optional(),
    saldoAwal: z
        .number()
        .int("Saldo awal harus bilangan bulat")
        .nonnegative("Saldo awal tidak boleh negatif")
        .optional(),
});

export const UpdateTabunganSchema = z
    .object({
        status: StatusTabunganEnum,
    })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "Minimal satu field harus diisi",
    });

export const TabunganIdParamSchema = z.object({
    id: z.string().uuid("ID harus berupa UUID yang valid"),
});

export const ListTabunganQuerySchema = z.object({
    nasabahId: z.string().uuid("nasabahId harus berupa UUID yang valid").optional(),
});

export type CreateTabunganInput = z.infer<typeof CreateTabunganSchema>;
export type UpdateTabunganInput = z.infer<typeof UpdateTabunganSchema>;
export type ListTabunganQuery = z.infer<typeof ListTabunganQuerySchema>;
