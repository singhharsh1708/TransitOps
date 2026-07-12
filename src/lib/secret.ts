// The JWT signing secret, shared by session handling (src/lib/auth.ts) and the
// edge middleware so the two can never drift apart. The hardcoded fallback is
// only for local development — in production it would make every session
// forgeable, so refuse to start without the real secret.
const raw = process.env.JWT_SECRET;

if (!raw && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET must be set in production");
}

export const jwtSecret = new TextEncoder().encode(raw ?? "insecure-dev-secret");
