import { z } from "zod";

export const JenisTransaksiEnum = z.enum(["SETORAN", "PENARIKAN"]);
export const MetodeTransaksiEnum = z.enum(["TUNAI", "TRANSFER", "DEBIT", "KARTU", "QRIS"]);

export const MIN_SETORAN = 100000;

export const CreateTransaksiSchema = z
    .object({
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
    })
    .superRefine((data, ctx) => {
        if (data.jenis === "SETORAN" && data.nominal < MIN_SETORAN) {
            ctx.addIssue({
                code: "custom",
                path: ["nominal"],
                message: `Nominal setoran minimum Rp ${MIN_SETORAN.toLocaleString("id-ID")}`,
            });
        }
    });

export const TransaksiIdParamSchema = z.object({
    id: z.string().uuid("ID harus berupa UUID yang valid"),
});

export const ListTransaksiQuerySchema = z.object({
    tabunganId: z.string().uuid("tabunganId harus berupa UUID yang valid").optional(),
    jenis: JenisTransaksiEnum.optional(),
});

export const LaporanBulananQuerySchema = z.object({
    tahun: z.coerce
        .number()
        .int("Tahun harus bilangan bulat")
        .min(2000, "Tahun minimal 2000")
        .max(2100, "Tahun maksimal 2100"),
    bulan: z.coerce
        .number()
        .int("Bulan harus bilangan bulat")
        .min(1, "Bulan minimal 1")
        .max(12, "Bulan maksimal 12"),
    tabunganId: z.string().uuid("tabunganId harus berupa UUID yang valid").optional(),
    jenis: JenisTransaksiEnum.optional(),
});

export const SetorQrisSchema = z.object({
    tabunganId: z.string().uuid("tabunganId harus berupa UUID yang valid"),
    nominal: z
        .number()
        .int("Nominal harus bilangan bulat")
        .min(MIN_SETORAN, `Nominal setor QRIS minimum Rp ${MIN_SETORAN.toLocaleString("id-ID")}`),
    referensi: z
        .string()
        .min(6, "Referensi minimal 6 karakter")
        .max(50)
        .optional(),
});

export type CreateTransaksiInput = z.infer<typeof CreateTransaksiSchema>;
export type ListTransaksiQuery = z.infer<typeof ListTransaksiQuerySchema>;
export type LaporanBulananQuery = z.infer<typeof LaporanBulananQuerySchema>;
export type SetorQrisInput = z.infer<typeof SetorQrisSchema>;
