const ALLOWED_TYPES = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Sube una imagen de producto a Vercel Blob y devuelve su URL pública.
 * Requiere BLOB_READ_WRITE_TOKEN configurado (Vercel lo define solo al
 * conectar un Blob store al proyecto).
 */
export async function uploadProductImage(productId, file) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "Falta conectar un Blob store en Vercel (o definir BLOB_READ_WRITE_TOKEN en local) para poder subir imágenes."
    );
  }
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    throw new Error("Formato no soportado. Usa JPG, PNG o WEBP.");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("La imagen es demasiado grande (máximo 8 MB).");
  }

  const { put } = await import("@vercel/blob");
  const pathname = `products/${productId}-${Date.now()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  const blob = await put(pathname, Buffer.from(arrayBuffer), {
    access: "public",
    addRandomSuffix: true,
    contentType: file.type,
  });
  return blob.url;
}

/** Borra una imagen de Vercel Blob a partir de su URL pública. */
export async function deleteProductImage(url) {
  if (!url || !process.env.BLOB_READ_WRITE_TOKEN) return;
  try {
    const { del } = await import("@vercel/blob");
    await del(url);
  } catch {
    // Si falla el borrado no bloqueamos la operación principal.
  }
}
