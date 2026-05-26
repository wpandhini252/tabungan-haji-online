"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nasabahController = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const nasabah_schema_1 = require("./nasabah.schema");
const nasabah_service_1 = require("./nasabah.service");
exports.nasabahController = {
    async create(req, res) {
        const parsed = nasabah_schema_1.CreateNasabahSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: "VALIDATION_ERR",
                details: zod_1.z.flattenError(parsed.error),
            });
        }
        try {
            const nasabah = await nasabah_service_1.nasabahService.create(parsed.data);
            return res.status(201).json({
                data: nasabah,
                message: "Nasabah berhasil dibuat",
            });
        }
        catch (err) {
            if (err instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                err.code === "P2002") {
                const field = err.meta?.target?.[0] ?? "field";
                return res.status(409).json({
                    error: "DUPLICATE_ENTRY",
                    message: `${field} sudah terdaftar`,
                });
            }
            throw err;
        }
    },
    async findAll(_req, res) {
        const data = await nasabah_service_1.nasabahService.findAll();
        return res.status(200).json({
            data,
            total: data.length,
        });
    },
    async findById(req, res) {
        const { id } = req.params;
        const nasabah = await nasabah_service_1.nasabahService.findById(id);
        if (!nasabah) {
            return res.status(404).json({
                error: "NOT_FOUND",
                message: "Nasabah tidak ditemukan",
            });
        }
        return res.status(200).json({ data: nasabah });
    },
};
