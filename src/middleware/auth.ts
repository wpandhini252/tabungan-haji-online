import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { verifyAuthToken } from "../lib/jwt";
import type { AuthTokenPayload } from "../lib/jwt";
import { tokenDenylist } from "../lib/token-denylist";

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            auth?: AuthTokenPayload;
        }
    }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({
            error: "UNAUTHORIZED",
            message: "Token otorisasi tidak ditemukan",
        });
    }

    const token = header.slice("Bearer ".length).trim();

    let payload: AuthTokenPayload;
    try {
        payload = verifyAuthToken(token);
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                error: "TOKEN_EXPIRED",
                message: "Token sudah kedaluwarsa, silakan login ulang",
            });
        }
        return res.status(401).json({
            error: "INVALID_TOKEN",
            message: "Token tidak valid",
        });
    }

    if (payload.jti && tokenDenylist.isRevoked(payload.jti)) {
        return res.status(401).json({
            error: "TOKEN_REVOKED",
            message: "Token sudah tidak berlaku (logout)",
        });
    }

    req.auth = payload;
    next();
}
