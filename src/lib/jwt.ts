import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET belum diset di environment");
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "1h";

export interface NasabahClaim {
    id: string;
    nik: string;
    nama: string;
    email: string;
    nomorHp: string;
}

export interface AuthUser {
    id: string;
    username: string;
    nasabahId: string;
    nasabah: NasabahClaim;
}

export interface AuthTokenPayload extends AuthUser {
    jti: string;
    iat: number;
    exp: number;
}

export function signAuthToken(user: AuthUser): string {
    const options: jwt.SignOptions = {
        expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
        jwtid: randomUUID(),
    };
    return jwt.sign(user, JWT_SECRET as jwt.Secret, options);
}

export function verifyAuthToken(token: string): AuthTokenPayload {
    return jwt.verify(token, JWT_SECRET as jwt.Secret) as AuthTokenPayload;
}
