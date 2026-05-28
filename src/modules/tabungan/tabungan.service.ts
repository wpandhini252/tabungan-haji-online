import { prisma } from "../../lib/prisma";
import {
    BIAYA_PELUNASAN,
    KUOTA_HAJI_TAHUNAN,
    MASA_TUNGGU_TAHUN,
    SETORAN_AWAL_PORSI,
} from "./tabungan.schema";
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

    async estimasiKeberangkatan(id: string) {
        const tabungan = await prisma.tabunganHaji.findUnique({
            where: { id },
            include: {
                nasabah: { select: { id: true, nik: true, nama: true } },
            },
        });

        if (!tabungan) return null;

        const setoranAwal = BigInt(SETORAN_AWAL_PORSI);
        const biayaPelunasan = BigInt(BIAYA_PELUNASAN);
        const saldo = tabungan.saldo;

        const eligiblePorsi = tabungan.status === "AKTIF" && saldo >= setoranAwal;
        const lunas = saldo >= biayaPelunasan;
        const kekuranganSetoranAwal = saldo >= setoranAwal ? 0n : setoranAwal - saldo;
        const kekuranganPelunasan = lunas ? 0n : biayaPelunasan - saldo;
        const persenTerkumpul = Math.min(
            100,
            Number((saldo * 100n) / biayaPelunasan),
        );

        const tahunSekarang = new Date().getFullYear();
        const tahunPendaftaran = eligiblePorsi ? tahunSekarang : null;
        const estimasiTahunKeberangkatan = eligiblePorsi
            ? tahunSekarang + MASA_TUNGGU_TAHUN
            : null;

        // Porsi terisi = jumlah rekening aktif yang sudah memenuhi setoran awal,
        // dipakai sebagai proksi kuota terpakai tahun berjalan.
        const porsiTerisi = await prisma.tabunganHaji.count({
            where: { status: "AKTIF", saldo: { gte: setoranAwal } },
        });
        const sisaKuota = Math.max(0, KUOTA_HAJI_TAHUNAN - porsiTerisi);

        const keterangan = eligiblePorsi
            ? `Saldo memenuhi setoran awal porsi. Estimasi berangkat ${estimasiTahunKeberangkatan} (masa tunggu ${MASA_TUNGGU_TAHUN} tahun).`
            : tabungan.status !== "AKTIF"
              ? `Rekening berstatus ${tabungan.status}, belum bisa didaftarkan porsi.`
              : `Saldo belum memenuhi setoran awal porsi. Kurang Rp ${kekuranganSetoranAwal.toLocaleString("id-ID")}.`;

        return {
            tabunganId: tabungan.id,
            nomorRekening: tabungan.nomorRekening,
            status: tabungan.status,
            nasabah: tabungan.nasabah,
            saldo,
            setoranAwalPorsi: setoranAwal,
            biayaPelunasan,
            eligiblePorsi,
            lunas,
            kekuranganSetoranAwal,
            kekuranganPelunasan,
            persenTerkumpul,
            masaTungguTahun: MASA_TUNGGU_TAHUN,
            tahunPendaftaran,
            estimasiTahunKeberangkatan,
            kuotaTahunan: KUOTA_HAJI_TAHUNAN,
            tahunKuota: tahunSekarang,
            porsiTerisi,
            sisaKuota,
            keterangan,
        };
    },
};
