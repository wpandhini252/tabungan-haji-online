import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import {
    CreateTabunganSchema,
    ListTabunganQuerySchema,
    TabunganIdParamSchema,
    UpdateTabunganSchema,
} from "./tabungan.schema";
import { tabunganService } from "./tabungan.service";

function parseId(req: Request, res: Response): string | null {
    const parsed = TabunganIdParamSchema.safeParse(req.params);
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

function handleNotFound(err: unknown, res: Response): boolean {
    if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2025"
    ) {
        res.status(404).json({
            error: "NOT_FOUND",
            message: "Tabungan tidak ditemukan",
        });
        return true;
    }
    return false;
}

function handleForeignKey(err: unknown, res: Response): boolean {
    if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2003"
    ) {
        res.status(400).json({
            error: "INVALID_REFERENCE",
            message: "nasabahId tidak ditemukan",
        });
        return true;
    }
    return false;
}

export const tabunganController = {
    async create(req: Request, res: Response) {
        const parsed = CreateTabunganSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: "VALIDATION_ERR",
                details: z.flattenError(parsed.error),
            });
        }

        try {
            const tabungan = await tabunganService.create(parsed.data);
            return res.status(201).json({
                data: tabungan,
                message: "Tabungan berhasil dibuat",
            });
        } catch (err) {
            if (handleDuplicate(err, res)) return;
            if (handleForeignKey(err, res)) return;
            throw err;
        }
    },

    async findAll(req: Request, res: Response) {
        const parsed = ListTabunganQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            return res.status(400).json({
                error: "VALIDATION_ERR",
                details: z.flattenError(parsed.error),
            });
        }

        const data = await tabunganService.findAll(parsed.data);
        return res.status(200).json({ data, total: data.length });
    },

    async findById(req: Request, res: Response) {
        const id = parseId(req, res);
        if (!id) return;

        const tabungan = await tabunganService.findById(id);
        if (!tabungan) {
            return res.status(404).json({
                error: "NOT_FOUND",
                message: "Tabungan tidak ditemukan",
            });
        }
        return res.status(200).json({ data: tabungan });
    },

    async update(req: Request, res: Response) {
        const id = parseId(req, res);
        if (!id) return;

        const parsed = UpdateTabunganSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: "VALIDATION_ERR",
                details: z.flattenError(parsed.error),
            });
        }

        try {
            const tabungan = await tabunganService.update(id, parsed.data);
            return res.status(200).json({
                data: tabungan,
                message: "Tabungan berhasil diupdate",
            });
        } catch (err) {
            if (handleNotFound(err, res)) return;
            throw err;
        }
    },

    async remove(req: Request, res: Response) {
        const id = parseId(req, res);
        if (!id) return;

        try {
            await tabunganService.remove(id);
            return res.status(204).send();
        } catch (err) {
            if (handleNotFound(err, res)) return;
            throw err;
        }
    },
};
