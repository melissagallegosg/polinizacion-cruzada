import crypto from "crypto";

export const SESSION_COOKIE = "pc_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 días

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error(
      "Falta configurar ADMIN_SESSION_SECRET (o al menos ADMIN_PASSWORD) en las variables de entorno."
    );
  }
  return secret;
}

function sign(value) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

/** Crea un token firmado que expira en SESSION_TTL_MS. */
export function createSessionToken() {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = String(expires);
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

/** Verifica el token de la cookie. Devuelve true/false. */
export function verifySessionToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expectedSignature = sign(payload);
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expectedBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;

  const expires = Number(payload);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;

  return true;
}

/** Compara la contraseña recibida con ADMIN_PASSWORD de forma segura. */
export function checkPassword(candidate) {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) {
    throw new Error("Falta configurar ADMIN_PASSWORD en las variables de entorno.");
  }
  if (typeof candidate !== "string" || candidate.length === 0) return false;

  const a = Buffer.from(candidate);
  const b = Buffer.from(real);
  if (a.length !== b.length) {
    // Igual comparamos contra algo del mismo tamaño para no filtrar timing.
    crypto.timingSafeEqual(Buffer.from(real), Buffer.from(real));
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

/** Lee y valida la cookie de sesión en un Request de Next.js (route handler). */
export function isAuthenticated(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

export const SESSION_MAX_AGE_SECONDS = Math.floor(SESSION_TTL_MS / 1000);
