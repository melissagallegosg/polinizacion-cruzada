import { NextResponse } from "next/server";
import { isAuthenticated } from "../../../../lib/auth";
import { uploadProductImage } from "../../../../lib/images";

export async function POST(request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "No se pudo leer el archivo." }, { status: 400 });
  }

  const file = formData.get("file");
  const productId = formData.get("productId");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Falta el archivo." }, { status: 400 });
  }
  if (!productId || typeof productId !== "string") {
    return NextResponse.json({ error: "Falta el id del producto." }, { status: 400 });
  }

  try {
    const url = await uploadProductImage(productId, file);
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Error al subir la imagen." }, { status: 500 });
  }
}
