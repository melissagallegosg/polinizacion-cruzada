import path from "path";
import fs from "fs/promises";
import seed from "../data/seed.json";

const STORE_PATHNAME = "store/data.json";
const LOCAL_FALLBACK_PATH = path.join(process.cwd(), "data", "store.local.json");

function hasBlobToken() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readLocalFallback() {
  try {
    const raw = await fs.readFile(LOCAL_FALLBACK_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeLocalFallback(data) {
  await fs.writeFile(LOCAL_FALLBACK_PATH, JSON.stringify(data, null, 2), "utf-8");
}

async function readFromBlob() {
  const { list } = await import("@vercel/blob");
  const { blobs } = await list({ prefix: STORE_PATHNAME, limit: 1 });
  if (!blobs.length) return null;
  const res = await fetch(blobs[0].url, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

async function writeToBlob(data) {
  const { put } = await import("@vercel/blob");
  await put(STORE_PATHNAME, JSON.stringify(data, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 0,
  });
}

/** Devuelve los datos actuales de la tienda (productos + categorías). */
export async function getStore() {
  let data = null;
  if (hasBlobToken()) {
    data = await readFromBlob();
  } else {
    data = await readLocalFallback();
  }
  if (!data) {
    // Primera vez: no hay nada guardado todavía, usamos los datos semilla.
    data = seed;
  }
  return data;
}

/** Guarda el objeto completo de la tienda (sobrescribe). */
export async function saveStore(data) {
  const payload = { ...data, updatedAt: new Date().toISOString() };
  if (hasBlobToken()) {
    await writeToBlob(payload);
  } else {
    await writeLocalFallback(payload);
  }
  return payload;
}
