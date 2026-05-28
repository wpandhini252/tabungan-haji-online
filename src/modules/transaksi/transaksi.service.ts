import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { MIN_SETORAN } from "./transaksi.schema";
import type {
    CreateTransaksiInput,
    ListTransaksiQuery,
    SetorQrisInput,
} from "./transaksi.schema";

type TxClient = Prisma.TransactionClient;

export class TransaksiBusinessError extends Error {
    constructor(
        public code:
            | "TABUNGAN_NOT_FOUND"
            | "TABUNGAN_NOT_ACTIVE"
            | "SALDO_INSUFFICIENT"
            | "SETORAN_BELOW_MIN",
        message: string,
    ) {
        super(message);
        this.name = "TransaksiBusinessError";
    }
}

function generateReferensi(jenis: string, metode?: string): string {
    const prefix =
        metode === "QRIS"
            ? "QRIS"
            : jenis === "SETORAN"
              ? "STR"
              : "PNR";
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
    return `${prefix}-${timestamp}-${random}`;
}

export const transaksiService = {
    async create(data: CreateTransaksiInput) {
        if (data.jenis === "SETORAN" && data.nominal < MIN_SETORAN) {
            throw new TransaksiBusinessError(
                "SETORAN_BELOW_MIN",
                `Setoran minimum Rp ${MIN_SETORAN.toLocaleString("id-ID")}, transaksi gagal`,
            );
        }

        const nominal = BigInt(data.nominal);

        return prisma.$transaction(async (tx: TxClient) => {
            const tabungan = await tx.tabunganHaji.findUnique({
                where: { id: data.tabunganId },
            });

            if (!tabungan) {
                throw new TransaksiBusinessError(
                    "TABUNGAN_NOT_FOUND",
                    "Tabungan tidak ditemukan",
                );
            }

            if (tabungan.status !== "AKTIF") {
                throw new TransaksiBusinessError(
                    "TABUNGAN_NOT_ACTIVE",
                    `Tabungan berstatus ${tabungan.status}, transaksi tidak diizinkan`,
                );
            }

            const saldoSebelum = tabungan.saldo;
            const saldoSesudah =
                data.jenis === "SETORAN"
                    ? saldoSebelum + nominal
                    : saldoSebelum - nominal;

            if (saldoSesudah < 0n) {
                throw new TransaksiBusinessError(
                    "SALDO_INSUFFICIENT",
                    "Saldo tidak mencukupi untuk penarikan",
                );
            }

            await tx.tabunganHaji.update({
                where: { id: tabungan.id },
                data: { saldo: saldoSesudah },
            });

            return tx.transaksi.create({
                data: {
                    tabunganId: tabungan.id,
                    jenis: data.jenis,
                    nominal,
                    saldoSebelum,
                    saldoSesudah,
                    referensi:
                        data.referensi ??
                        generateReferensi(data.jenis, data.metode),
                    metode: data.metode,
                },
            });
        });
    },

    setorQris(data: SetorQrisInput) {
        return this.create({
            tabunganId: data.tabunganId,
            jenis: "SETORAN",
            nominal: data.nominal,
            referensi: data.referensi,
            metode: "QRIS",
        });
    },

    findAll: (query: ListTransaksiQuery) =>
        prisma.transaksi.findMany({
            where: {
                tabunganId: query.tabunganId,
                jenis: query.jenis,
            },
            orderBy: { waktu: "desc" },
        }),

    findById: (id: string) =>
        prisma.transaksi.findUnique({
            where: { id },
            include: {
                tabungan: {
                    select: {
                        id: true,
                        nomorRekening: true,
                        status: true,
                        nasabahId: true,
                    },
                },
            },
        }),
};
