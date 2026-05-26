import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import {
    CreateTransaksiSchema,
    ListTransaksiQuerySchema,
    TransaksiIdParamSchema,
} from "./transaksi.schema";
import { transaksiService, TransaksiBusinessError } from "./transaksi.service";

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

function handleDuplicate(err: unknown, res: Response): boolean {
    if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
    ) {
        const field = (err.meta?.target as string[])?.[0] ?? "field";
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
                : err.code === "SALDO_INSUFFICIENT"
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
