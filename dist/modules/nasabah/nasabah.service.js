"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nasabahService = void 0;
const prisma_1 = require("../../lib/prisma");
exports.nasabahService = {
    create: (data) => prisma_1.prisma.nasabah.create({ data }),
    findAll: () => prisma_1.prisma.nasabah.findMany({ orderBy: { createdAt: "desc" } }),
    findById: (id) => prisma_1.prisma.nasabah.findUnique({ where: { id } }),
};
