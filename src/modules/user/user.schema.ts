import { z } from "zod";

export const CreateUserSchema = z.object({
    nasabahId: z.string().uuid("nasabahId harus berupa UUID yang valid"),
    username: z
        .string()
        .min(4, "Username minimal 4 karakter")
        .max(70)
        .regex(/^[a-zA-Z0-9._-]+$/, "Username hanya boleh huruf, angka, titik, garis bawah, dan strip"),
    password: z.string().min(8, "Password minimal 8 karakter").max(72, "Password maksimal 72 karakter"),
});

export const UpdateUserSchema = z
    .object({
        username: CreateUserSchema.shape.username,
        password: CreateUserSchema.shape.password,
    })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: "Minimal satu field harus diisi",
    });

export const LoginSchema = z.object({
    username: z.string().min(1, "Username wajib diisi"),
    password: z.string().min(1, "Password wajib diisi"),
});

export const UserIdParamSchema = z.object({
    id: z.string().uuid("ID harus berupa UUID yang valid"),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
