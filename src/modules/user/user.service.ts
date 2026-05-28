import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma";
import type { CreateUserInput, UpdateUserInput, LoginInput } from "./user.schema";

const SALT_ROUNDS = 12;

const publicFields = { omit: { password: true } } as const;

export class UserBusinessError extends Error {
    constructor(
        public code: "INVALID_CREDENTIALS",
        message: string,
    ) {
        super(message);
        this.name = "UserBusinessError";
    }
}

export const userService = {
    async create(data: CreateUserInput) {
        const password = await bcrypt.hash(data.password, SALT_ROUNDS);
        return prisma.user.create({
            data: {
                nasabahId: data.nasabahId,
                username: data.username,
                password,
            },
            ...publicFields,
        });
    },

    findAll: () =>
        prisma.user.findMany({ orderBy: { createdAt: "desc" }, ...publicFields }),

    findById: (id: string) =>
        prisma.user.findUnique({ where: { id }, ...publicFields }),

    async update(id: string, data: UpdateUserInput) {
        const password =
            data.password !== undefined
                ? await bcrypt.hash(data.password, SALT_ROUNDS)
                : undefined;
        return prisma.user.update({
            where: { id },
            data: {
                username: data.username,
                password,
            },
            ...publicFields,
        });
    },

    remove: (id: string) => prisma.user.delete({ where: { id } }),

    async login(data: LoginInput) {
        const user = await prisma.user.findUnique({
            where: { username: data.username },
            include: { nasabah: true },
        });

        // Tetap jalankan compare meski user tidak ada, untuk mencegah timing attack
        const hash = user?.password ?? "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin";
        const valid = await bcrypt.compare(data.password, hash);

        if (!user || !valid) {
            throw new UserBusinessError(
                "INVALID_CREDENTIALS",
                "Username atau password salah",
            );
        }

        const { password: _password, ...safeUser } = user;
        return safeUser;
    },
};
