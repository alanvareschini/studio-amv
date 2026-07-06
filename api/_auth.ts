// Sessão do painel: um cookie assinado (HMAC) — sem libs externas.
// A senha fica na variável de ambiente DASHBOARD_PASSWORD (nunca no código).
import crypto from "node:crypto";

const COOKIE = "amv_dash";
const MAX_AGE = 60 * 60 * 12; // 12h

function secret(): string {
  return process.env.SESSION_SECRET || process.env.DASHBOARD_PASSWORD || "dev-insecure-secret";
}

export function makeToken(): string {
  const exp = Date.now() + MAX_AGE * 1000;
  const payload = String(exp);
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function validToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  if (sig.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(new Uint8Array(Buffer.from(sig)), new Uint8Array(Buffer.from(expected)))) return false;
  return Number(payload) > Date.now();
}

export function readCookie(header: string | undefined, name = COOKIE): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

export function setCookie(token: string): string {
  return `${COOKIE}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${MAX_AGE}`;
}

export function clearCookie(): string {
  return `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

export function isAuthed(req: { headers: Record<string, unknown> }): boolean {
  const cookie = req.headers["cookie"] as string | undefined;
  return validToken(readCookie(cookie));
}

// Compara a senha enviada com a do ambiente, sem vazar tempo.
export function checkPassword(input: unknown): boolean {
  const expected = process.env.DASHBOARD_PASSWORD || "";
  if (!expected || typeof input !== "string") return false;
  const a = new Uint8Array(Buffer.from(input));
  const b = new Uint8Array(Buffer.from(expected));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
