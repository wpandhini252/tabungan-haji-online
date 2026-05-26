import { z } from "zod";

export const JenisTransaksiEnum = z.enum(["SETORAN", "PENARIKAN"]);
export const MetodeTransaksiEnum = z.enum(["TUNAI", "TRANSFER", "DEBIT", "KARTU"]);

export const CreateTransaksiSchema = z.object({
    tabunganId: z.string().uuid("tabunganId harus berupa UUID yang valid"),
    jenis: JenisTransaksiEnum,
    nominal: z
        .number()
        .int("Nominal harus bilangan bulat")
        .positive("Nominal harus lebih dari 0"),
    referensi: z
        .string()
        .min(6, "Referensi minimal 6 karakter")
        .max(50)
        .optional(),
    metode: MetodeTransaksiEnum.optional(),
});

export const TransaksiIdParamSchema = z.object({
    id: z.string().uuid("ID harus berupa UUID yang valid"),
});

export const ListTransaksiQuerySchema = z.object({
    tabunganId: z.string().uuid("tabunganId harus berupa UUID yang valid").optional(),
    jenis: JenisTransaksiEnum.optional(),
});

export type CreateTransaksiInput = z.infer<typeof CreateTransaksiSchema>;
export type ListTransaksiQuery = z.infer<typeof ListTransaksiQuerySchema>;
