import type { Request, Response } from "express";
import { z } from "zod";
import {
    CreateTransaksiSchema,
    LaporanBulananQuerySchema,
    ListTransaksiQuerySchema,
    SetorQrisSchema,
    TransaksiIdParamSchema,
} from "./transaksi.schema";
import { transaksiService, TransaksiBusinessError } from "./transaksi.service";

type LaporanRows = Awaited<ReturnType<typeof transaksiService.laporanBulanan>>;

function toCsvField(value: string | bigint | null | undefined): string {
    const str = value === null || value === undefined ? "" : String(value);
    return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function buildLaporanCsv(rows: LaporanRows): string {
    const header = [
        "waktu",
        "referensi",
        "nomorRekening",
        "namaNasabah",
        "nik",
        "jenis",
        "metode",
        "nominal",
        "saldoSebelum",
        "saldoSesudah",
    ];

    const lines = rows.map((t) =>
        [
            t.waktu.toISOString(),
            t.referensi,
            t.tabungan.nomorRekening,
            t.tabungan.nasabah.nama,
            t.tabungan.nasabah.nik,
            t.jenis,
            t.metode,
            t.nominal,
            t.saldoSebelum,
            t.saldoSesudah,
        ]
            .map(toCsvField)
            .join(","),
    );

    // BOM agar Excel membaca UTF-8 dengan benar; CRLF sesuai konvensi CSV.
    return "﻿" + [header.join(","), ...lines].join("\r\n") + "\r\n";
}

function parseId(req: Request, res: Response): string | null {
    const parsed = TransaksiIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
        res.status(400).json({
            error: "VALIDATION_ERR",
            details: z.flattenError(parsed.error),
        });
        return null;
    }
    return parsed.data.id;
}

function isPrismaKnownError(
    err: unknown,
): err is { code: string; meta?: { target?: string[] } } {
    return (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        typeof (err as { code: unknown }).code === "string"
    );
}

function handleDuplicate(err: unknown, res: Response): boolean {
    if (isPrismaKnownError(err) && err.code === "P2002") {
        const field = err.meta?.target?.[0] ?? "field";
        res.status(409).json({
            error: "DUPLICATE_ENTRY",
            message: `${field} sudah terdaftar`,
        });
        return true;
    }
    return false;
}

function handleBusinessError(err: unknown, res: Response): boolean {
    if (err instanceof TransaksiBusinessError) {
        const status =
            err.code === "TABUNGAN_NOT_FOUND"
                ? 404
                : err.code === "SALDO_INSUFFICIENT" ||
                    err.code === "SETORAN_BELOW_MIN"
                  ? 422
                  : 409;
        res.status(status).json({ error: err.code, message: err.message });
        return true;
    }
    return false;
}

export const transaksiController = {
    async create(req: Request, res: Response) {
        const parsed = CreateTransaksiSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: "VALIDATION_ERR",
                details: z.flattenError(parsed.error),
            });
        }

        try {
            const transaksi = await transaksiService.create(parsed.data);
            return res.status(201).json({
                data: transaksi,
                message: "Transaksi berhasil dicatat",
            });
        } catch (err) {
            if (handleBusinessError(err, res)) return;
            if (handleDuplicate(err, res)) return;
            throw err;
        }
    },

    async setorQris(req: Request, res: Response) {
        const parsed = SetorQrisSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: "VALIDATION_ERR",
                details: z.flattenError(parsed.error),
            });
        }

        try {
            const transaksi = await transaksiService.setorQris(parsed.data);
            return res.status(201).json({
                data: transaksi,
                message: "Setoran QRIS berhasil dicatat",
            });
        } catch (err) {
            if (handleBusinessError(err, res)) return;
            if (handleDuplicate(err, res)) return;
            throw err;
        }
    },

    async findAll(req: Request, res: Response) {
        const parsed = ListTransaksiQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            return res.status(400).json({
                error: "VALIDATION_ERR",
                details: z.flattenError(parsed.error),
            });
        }

        const data = await transaksiService.findAll(parsed.data);
        return res.status(200).json({ data, total: data.length });
    },

    async laporanBulanan(req: Request, res: Response) {
        const parsed = LaporanBulananQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            return res.status(400).json({
                error: "VALIDATION_ERR",
                details: z.flattenError(parsed.error),
            });
        }

        const rows = await transaksiService.laporanBulanan(parsed.data);
        const csv = buildLaporanCsv(rows);
        const { tahun, bulan } = parsed.data;
        const filename = `laporan-transaksi-${tahun}-${String(bulan).padStart(2, "0")}.csv`;

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}"`,
        );
        return res.status(200).send(csv);
    },

    async findById(req: Request, res: Response) {
        const id = parseId(req, res);
        if (!id) return;

        const transaksi = await transaksiService.findById(id);
        if (!transaksi) {
            return res.status(404).json({
                error: "NOT_FOUND",
                message: "Transaksi tidak ditemukan",
            });
        }
        return res.status(200).json({ data: transaksi });
    },
};
