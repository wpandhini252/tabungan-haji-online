import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import {
    CreateUserSchema,
    UpdateUserSchema,
    LoginSchema,
    UserIdParamSchema,
} from "./user.schema";
import { userService, UserBusinessError } from "./user.service";
import { signAuthToken } from "../../lib/jwt";
import { tokenDenylist } from "../../lib/token-denylist";

function parseId(req: Request, res: Response): string | null {
    const parsed = UserIdParamSchema.safeParse(req.params);
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

function handleForeignKey(err: unknown, res: Response): boolean {
    if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2003"
    ) {
        res.status(422).json({
            error: "NASABAH_NOT_FOUND",
            message: "Nasabah tidak ditemukan",
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
            message: "User tidak ditemukan",
        });
        return true;
    }
    return false;
}

function handleBusinessError(err: unknown, res: Response): boolean {
    if (err instanceof UserBusinessError) {
        res.status(401).json({ error: err.code, message: err.message });
        return true;
    }
    return false;
}

export const userController = {
    async create(req: Request, res: Response) {
        const parsed = CreateUserSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: "VALIDATION_ERR",
                details: z.flattenError(parsed.error),
            });
        }

        try {
            const user = await userService.create(parsed.data);
            return res.status(201).json({
                data: user,
                message: "User berhasil dibuat",
            });
        } catch (err) {
            if (handleDuplicate(err, res)) return;
            if (handleForeignKey(err, res)) return;
            throw err;
        }
    },

    async findAll(_req: Request, res: Response) {
        const data = await userService.findAll();
        return res.status(200).json({ data, total: data.length });
    },

    async findById(req: Request, res: Response) {
        const id = parseId(req, res);
        if (!id) return;

        const user = await userService.findById(id);
        if (!user) {
            return res.status(404).json({
                error: "NOT_FOUND",
                message: "User tidak ditemukan",
            });
        }
        return res.status(200).json({ data: user });
    },

    async update(req: Request, res: Response) {
        const id = parseId(req, res);
        if (!id) return;

        const parsed = UpdateUserSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: "VALIDATION_ERR",
                details: z.flattenError(parsed.error),
            });
        }

        try {
            const user = await userService.update(id, parsed.data);
            return res.status(200).json({
                data: user,
                message: "User berhasil diupdate",
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
            await userService.remove(id);
            return res.status(204).send();
        } catch (err) {
            if (handleNotFound(err, res)) return;
            throw err;
        }
    },

    async login(req: Request, res: Response) {
        const parsed = LoginSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: "VALIDATION_ERR",
                details: z.flattenError(parsed.error),
            });
        }

        try {
            const user = await userService.login(parsed.data);
            const token = signAuthToken({
                id: user.id,
                username: user.username,
                nasabahId: user.nasabahId,
                nasabah: {
                    id: user.nasabah.id,
                    nik: user.nasabah.nik,
                    nama: user.nasabah.nama,
                    email: user.nasabah.email,
                    nomorHp: user.nasabah.nomorHp,
                },
            });
            return res.status(200).json({
                message: "Login berhasil",
                token,
                data: user,
            });
        } catch (err) {
            if (handleBusinessError(err, res)) return;
            throw err;
        }
    },

    async logout(req: Request, res: Response) {
        if (req.auth?.jti) {
            tokenDenylist.revoke(req.auth.jti, req.auth.exp);
        }
        return res.status(200).json({ message: "Logout berhasil" });
    },
};
