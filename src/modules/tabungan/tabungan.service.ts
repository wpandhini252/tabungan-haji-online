import { prisma } from "../../lib/prisma";
import type {
    CreateTabunganInput,
    ListTabunganQuery,
    UpdateTabunganInput,
} from "./tabungan.schema";

function generateNomorRekening(): string {
    const timestamp = Date.now().toString().slice(-10);
    const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
    return `${timestamp}${random}`;
}

export const tabunganService = {
    create: (data: CreateTabunganInput) =>
        prisma.tabunganHaji.create({
            data: {
                nasabahId: data.nasabahId,
                nomorRekening: data.nomorRekening ?? generateNomorRekening(),
                saldo: BigInt(data.saldoAwal ?? 0),
            },
        }),

    findAll: (query: ListTabunganQuery) =>
        prisma.tabunganHaji.findMany({
            where: query.nasabahId ? { nasabahId: query.nasabahId } : undefined,
            orderBy: { dibukaAt: "desc" },
            include: {
                nasabah: {
                    select: { id: true, nik: true, nama: true, email: true },
                },
            },
        }),

    findById: (id: string) =>
        prisma.tabunganHaji.findUnique({
            where: { id },
            include: {
                nasabah: {
                    select: { id: true, nik: true, nama: true, email: true },
                },
            },
        }),

    update: (id: string, data: UpdateTabunganInput) =>
        prisma.tabunganHaji.update({ where: { id }, data }),

    remove: (id: string) => prisma.tabunganHaji.delete({ where: { id } }),
};
