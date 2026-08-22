import { NextResponse } from "next/server";
import { isAuthenticated } from "../../../../lib/auth";
import { getStore, saveStore } from "../../../../lib/store";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const store = await getStore();
  return NextResponse.json(store, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!Array.isArray(body?.products) || !Array.isArray(body?.categories)) {
    return NextResponse.json(
      { error: "El catálogo debe incluir 'products' y 'categories' como arreglos." },
      { status: 400 }
    );
  }

  // Validación mínima de cada producto.
  for (const p of body.products) {
    if (!p.id || !p.name || !p.category) {
      return NextResponse.json(
        { error: `Cada producto necesita al menos id, name y category. Revisa: ${JSON.stringify(p)}` },
        { status: 400 }
      );
    }
  }
  for (const c of body.categories) {
    if (!c.id || !c.label) {
      return NextResponse.json(
        { error: `Cada categoría necesita al menos id y label. Revisa: ${JSON.stringify(c)}` },
        { status: 400 }
      );
    }
  }

  const current = await getStore();
  const merged = {
    ...current,
    products: body.products,
    categories: body.categories,
    fourpack: body.fourpack ?? current.fourpack,
    whatsappNumber: current.whatsappNumber,
    socialLinks: current.socialLinks,
  };

  const saved = await saveStore(merged);
  return NextResponse.json(saved);
}
