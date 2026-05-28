// Denylist token (jti) yang sudah logout. In-memory: cukup untuk satu instance,
// akan reset saat server restart. Untuk multi-instance/persisten pakai Redis dsb.
const revoked = new Map<string, number>();

function sweep() {
    const nowSec = Math.floor(Date.now() / 1000);
    for (const [jti, exp] of revoked) {
        if (exp <= nowSec) revoked.delete(jti);
    }
}

export const tokenDenylist = {
    revoke(jti: string, exp: number) {
        revoked.set(jti, exp);
        sweep();
    },

    isRevoked(jti: string): boolean {
        const exp = revoked.get(jti);
        if (exp === undefined) return false;
        if (exp <= Math.floor(Date.now() / 1000)) {
            revoked.delete(jti);
            return false;
        }
        return true;
    },
};
