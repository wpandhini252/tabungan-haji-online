import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import {
    CreateNasabahSchema,
    UpdateNasabahSchema,
    NasabahIdParamSchema,
} from "./nasabah.schema";
import { nasabahService } from "./nasabah.service";

function parseId(req: Request, res: Response): string | null {
    const parsed = NasabahIdParamSchema.safeParse(req.params);
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
            message: "Nasabah tidak ditemukan",
        });
        return true;
    }
    return false;
}

export const nasabahController = {
    async create(req: Request, res: Response) {
        const parsed = CreateNasabahSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: "VALIDATION_ERR",
                details: z.flattenError(parsed.error),
            });
        }

        try {
            const nasabah = await nasabahService.create(parsed.data);
            return res.status(201).json({
                data: nasabah,
                message: "Nasabah berhasil dibuat",
            });
        } catch (err) {
            if (handleDuplicate(err, res)) return;
            throw err;
        }
    },

    async findAll(_req: Request, res: Response) {
        const data = await nasabahService.findAll();
        return res.status(200).json({ data, total: data.length });
    },

    async findById(req: Request, res: Response) {
        const id = parseId(req, res);
        if (!id) return;

        const nasabah = await nasabahService.findById(id);
        if (!nasabah) {
            return res.status(404).json({
                error: "NOT_FOUND",
                message: "Nasabah tidak ditemukan",
            });
        }
        return res.status(200).json({ data: nasabah });
    },

    async update(req: Request, res: Response) {
        const id = parseId(req, res);
        if (!id) return;

        const parsed = UpdateNasabahSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: "VALIDATION_ERR",
                details: z.flattenError(parsed.error),
            });
        }

        try {
            const nasabah = await nasabahService.update(id, parsed.data);
            return res.status(200).json({
                data: nasabah,
                message: "Nasabah berhasil diupdate",
            });
        } catch (err) {
            if (handleNotFound(err, res)) return;
            if (handleDuplicate(err, res)) return;
            throw err;
        }
    },

    async remove(req: Request, res: Response) {
        const id = parseId(req, res);
        if (!id) return;

        try {
            await nasabahService.remove(id);
            return res.status(204).send();
        } catch (err) {
            if (handleNotFound(err, res)) return;
            throw err;
        }
    },
};
