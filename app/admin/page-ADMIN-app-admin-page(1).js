"use client";

import { useEffect, useRef, useState } from "react";

function slugify(text) {
  return (
    text
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "categoria"
  );
}

export default function AdminPage() {
  const [phase, setPhase] = useState("checking"); // checking | login | panel
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [store, setStore] = useState(null);
  const [error, setError] = useState("");
  const [savedTag, setSavedTag] = useState(null); // productId con "Guardado ✓" visible
  const [uploadingId, setUploadingId] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const fileInputRef = useRef(null);
  const activeUploadIdRef = useRef(null);

  async function loadStore() {
    const res = await fetch("/api/admin/store", { cache: "no-store" });
    if (res.status === 401) {
      setPhase("login");
      return;
    }
    const data = await res.json();
    setStore(data);
    setPhase("panel");
  }

  useEffect(() => {
    loadStore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setLoginError(data.error || "No se pudo iniciar sesión.");
        return;
      }
      setPassword("");
      await loadStore();
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setStore(null);
    setPhase("login");
  }

  async function persist(nextStore) {
    setError("");
    const res = await fetch("/api/admin/store", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextStore),
    });
    if (res.status === 401) {
      setPhase("login");
      return null;
    }
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "No se pudo guardar.");
      return null;
    }
    setStore(data);
    return data;
  }

  function updateProductField(id, field, value) {
    setStore((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    }));
  }

  async function handleSaveProduct(id) {
    const saved = await persist(store);
    if (saved) {
      setSavedTag(id);
      setTimeout(() => setSavedTag(null), 1800);
    }
  }

  function handleToggleAvailable(id) {
    setStore((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === id ? { ...p, available: !p.available } : p)),
    }));
  }

  function triggerUpload(productId) {
    activeUploadIdRef.current = productId;
    fileInputRef.current?.click();
  }

  async function handleFileChange(e) {
    const file = e.target.files[0];
    e.target.value = "";
    const productId = activeUploadIdRef.current;
    if (!file || !productId) return;

    setUploadingId(productId);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("productId", productId);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.status === 401) {
        setPhase("login");
        return;
      }
      if (!res.ok) {
        setError(data.error || "No se pudo subir la imagen.");
        return;
      }
      const nextStore = {
        ...store,
        products: store.products.map((p) => (p.id === productId ? { ...p, imageUrl: data.url } : p)),
      };
      await persist(nextStore);
    } finally {
      setUploadingId(null);
    }
  }

  async function handleDeleteImage(productId) {
    const nextStore = {
      ...store,
      products: store.products.map((p) => (p.id === productId ? { ...p, imageUrl: null } : p)),
    };
    await persist(nextStore);
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;
    let id = slugify(name);
    let suffix = 2;
    const existingIds = new Set(store.categories.map((c) => c.id));
    while (existingIds.has(id)) {
      id = `${slugify(name)}-${suffix}`;
      suffix += 1;
    }
    const nextStore = {
      ...store,
      categories: [...store.categories, { id, label: name, cssClass: "cat-miel" }],
    };
    const saved = await persist(nextStore);
    if (saved) setNewCategoryName("");
  }

  async function handleDeleteCategory(id) {
    const inUse = store.products.some((p) => p.category === id);
    if (inUse) {
      setError("No puedes borrar una categoría que todavía tiene productos. Cambia esos productos de categoría primero.");
      return;
    }
    const nextStore = { ...store, categories: store.categories.filter((c) => c.id !== id) };
    await persist(nextStore);
  }

  async function handleAddProduct(categoryId) {
    const id = `${categoryId}-${Date.now()}`;
    const newProduct = {
      id,
      name: "Nuevo producto",
      category: categoryId,
      description: "",
      price: 0,
      imageUrl: null,
      available: false,
      cartLabel: "Nuevo producto",
    };
    const nextStore = { ...store, products: [...store.products, newProduct] };
    await persist(nextStore);
  }

  async function handleDeleteProduct(id) {
    if (!confirm("¿Borrar este producto? Esta acción no se puede deshacer.")) return;
    const nextStore = { ...store, products: store.products.filter((p) => p.id !== id) };
    await persist(nextStore);
  }

  function updateFourpackField(field, value) {
    setStore((prev) => ({
      ...prev,
      fourpack: { ...prev.fourpack, [field]: value },
    }));
  }

  async function handleSaveFourpack() {
    const saved = await persist(store);
    if (saved) {
      setSavedTag("fourpack");
      setTimeout(() => setSavedTag(null), 1800);
    }
  }

  if (phase === "checking") {
    return <div className="admin-login-wrap" />;
  }

  if (phase === "login") {
    return (
      <div className="admin-login-wrap">
        <form className="admin-login-card" onSubmit={handleLogin}>
          <h1>Administrar productos</h1>
          <p className="sub">Acceso privado. Introduce la contraseña de administración.</p>
          <label htmlFor="admin-password">Contraseña</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <button type="submit" disabled={loggingIn || !password}>
            {loggingIn ? "Entrando…" : "Entrar"}
          </button>
          {loginError && <div className="admin-login-error">{loginError}</div>}
        </form>
      </div>
    );
  }

  return (
    <div className="admin-overlay open">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
      />
      <div className="admin-head">
        <h2>Administrar productos</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <a href="/" className="admin-close" style={{ textDecoration: "none" }}>
            Ver tienda
          </a>
          <button className="admin-logout-btn" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </div>
      <div className="admin-body">
        {error && <div className="admin-global-error">{error}</div>}

        <form className="admin-add-category" onSubmit={handleAddCategory}>
          <div>
            <label>Nueva categoría</label>
            <input
              type="text"
              placeholder="p. ej. Propóleo puro"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
          </div>
          <button type="submit" className="admin-add-product-btn">
            + Añadir categoría
          </button>
        </form>

        {store.fourpack && (
          <div>
            <div className="admin-toolbar">
              <div className="admin-cat-title" style={{ margin: "36px 0 0" }}>
                Four Pack (oferta destacada)
              </div>
            </div>
            <div className="admin-card">
              <div className="admin-fields" style={{ width: "100%" }}>
                <div>
                  <label>Nombre</label>
                  <input
                    type="text"
                    value={store.fourpack.name || ""}
                    onChange={(e) => updateFourpackField("name", e.target.value)}
                  />
                </div>
                <div className="field-row">
                  <div>
                    <label>Precio (MXN)</label>
                    <input
                      type="number"
                      min="0"
                      value={store.fourpack.price || 0}
                      onChange={(e) => updateFourpackField("price", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label>Precio tachado (MXN)</label>
                    <input
                      type="number"
                      min="0"
                      value={store.fourpack.compareAt || 0}
                      onChange={(e) => updateFourpackField("compareAt", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div className="admin-save-row">
                  <button className="save-btn" onClick={handleSaveFourpack}>
                    Guardar cambios
                  </button>
                  <span className={`saved-tag ${savedTag === "fourpack" ? "show" : ""}`}>Guardado ✓</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {store.categories.map((cat) => {
          const items = store.products.filter((p) => p.category === cat.id);
          return (
            <div key={cat.id}>
              <div className="admin-toolbar">
                <div className="admin-cat-title" style={{ margin: "36px 0 0" }}>
                  {cat.label}
                </div>
                <button className="admin-add-product-btn" onClick={() => handleAddProduct(cat.id)}>
                  + Añadir producto
                </button>
                {items.length === 0 && (
                  <button className="admin-delete-btn" onClick={() => handleDeleteCategory(cat.id)}>
                    Borrar categoría vacía
                  </button>
                )}
              </div>

              {items.map((p) => (
                <div className="admin-card" key={p.id}>
                  <div className="admin-img-col">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="admin-img-preview" src={p.imageUrl} alt={p.name} />
                    ) : (
                      <div
                        className="admin-img-preview"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--pearl-dim)",
                          fontSize: "10px",
                          textAlign: "center",
                          padding: "8px",
                        }}
                      >
                        Sin imagen
                      </div>
                    )}
                    <div className="admin-img-actions">
                      <button
                        className="admin-btn"
                        onClick={() => triggerUpload(p.id)}
                        disabled={uploadingId === p.id}
                      >
                        {uploadingId === p.id ? "Subiendo…" : p.imageUrl ? "Cambiar imagen" : "Subir imagen"}
                      </button>
                      <button
                        className="admin-btn danger"
                        onClick={() => handleDeleteImage(p.id)}
                        disabled={!p.imageUrl}
                      >
                        Eliminar imagen
                      </button>
                    </div>
                  </div>
                  <div className="admin-fields">
                    <div>
                      <label>Nombre</label>
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => updateProductField(p.id, "name", e.target.value)}
                      />
                    </div>
                    {p.category === "kombucha" && (
                      <div>
                        <label>Código (texto grande en la tarjeta)</label>
                        <input
                          type="text"
                          value={p.code || ""}
                          onChange={(e) => updateProductField(p.id, "code", e.target.value)}
                        />
                      </div>
                    )}
                    <div>
                      <label>Etiqueta en carrito / WhatsApp</label>
                      <input
                        type="text"
                        value={p.cartLabel || ""}
                        onChange={(e) => updateProductField(p.id, "cartLabel", e.target.value)}
                      />
                    </div>
                    <div>
                      <label>Descripción</label>
                      <textarea
                        value={p.description || ""}
                        onChange={(e) => updateProductField(p.id, "description", e.target.value)}
                      />
                    </div>
                    <div className="field-row">
                      <div>
                        <label>Precio (MXN)</label>
                        <input
                          type="number"
                          min="0"
                          value={p.price}
                          onChange={(e) => updateProductField(p.id, "price", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label>Categoría</label>
                        <select
                          value={p.category}
                          onChange={(e) => updateProductField(p.id, "category", e.target.value)}
                        >
                          {store.categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label>Disponibilidad</label>
                      <div className="avail-row">
                        <button
                          type="button"
                          className={`switch ${p.available ? "on" : ""}`}
                          onClick={() => handleToggleAvailable(p.id)}
                        />
                        <span className="avail-label">{p.available ? "Disponible" : "Agotado"}</span>
                      </div>
                    </div>
                    <div className="admin-save-row">
                      <button className="save-btn" onClick={() => handleSaveProduct(p.id)}>
                        Guardar cambios
                      </button>
                      <span className={`saved-tag ${savedTag === p.id ? "show" : ""}`}>Guardado ✓</span>
                      <button className="admin-delete-btn" onClick={() => handleDeleteProduct(p.id)}>
                        Eliminar producto
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
