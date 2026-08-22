"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const FIXED_CATEGORY_IDS = ["kombucha", "miel-base", "miel-herbal"];

function ProductCard({ product, category }) {
  const isKombucha = product.category === "kombucha";
  const catLabel = isKombucha
    ? "Kombucha fermentada con miel"
    : category?.label || product.category;
  const cssClass = category?.cssClass || "cat-miel";

  return (
    <div className={`card ${cssClass} ${!product.available ? "sold-out" : ""}`} data-id={product.id}>
      <div className="card-band" />
      <div className="card-img-wrap">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} />
        ) : (
          <div className="placeholder-img">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
              <circle cx="24" cy="24" r="3" fill="currentColor" opacity="0.7" />
              <path d="M24 3v6M24 39v6M3 24h6M39 24h6" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
            </svg>
            <span>Sin fotografía aún</span>
          </div>
        )}
        {!product.available && <span className="badge-agotado">Agotado</span>}
      </div>
      <div className="card-body">
        {isKombucha ? (
          <>
            <div className="card-cat">{catLabel}</div>
            <div className="kombucha-code">{product.code || product.name}</div>
            <div className="kombucha-flavors">{product.ingredients || ""}</div>
            {product.claim && <div className="card-claim">{product.claim}</div>}
            <div className="card-desc" style={{ marginTop: "12px" }}>
              {product.description}
            </div>
            {product.benefitTitle && (
              <div className="benefit-box">
                <b>{product.benefitTitle}</b>
                <p>{product.benefitText || ""}</p>
              </div>
            )}
            <div className="card-footer">
              <div className="card-price">
                ${product.price} <small>MXN</small>
              </div>
              <button className="add-btn" data-id={product.id} disabled={!product.available}>
                {product.available ? "Añadir al carrito" : "Agotado"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="card-cat">{catLabel}</div>
            <div className="card-name">{product.name}</div>
            {product.claim && <div className="card-claim">{product.claim}</div>}
            <div className="card-desc">{product.description}</div>
            {product.ingredients && <div className="card-ingredients">{product.ingredients}</div>}
            {product.benefitTitle && (
              <div className="benefit-box">
                <b>{product.benefitTitle}</b>
                <p>{product.benefitText || ""}</p>
              </div>
            )}
            <div className="card-footer">
              <div>
                <div className="card-price">
                  ${product.price} <small>MXN</small>
                </div>
                {product.weight && <div className="card-weight">{product.weight}</div>}
              </div>
              <button className="add-btn" data-id={product.id} disabled={!product.available}>
                {product.available ? "Añadir al carrito" : "Agotado"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [store, setStore] = useState(null);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const starsRef = useRef(null);
  const gridsRef = useRef(null);

  useEffect(() => {
    fetch("/api/products", { cache: "no-store" })
      .then((r) => r.json())
      .then(setStore)
      .catch(() => setStore({ products: [], categories: [], fourpack: null }));
  }, []);

  // Estrellas de fondo — idéntico al script original.
  useEffect(() => {
    const wrap = starsRef.current;
    if (!wrap || wrap.childElementCount) return;
    const count = window.innerWidth < 600 ? 40 : 80;
    for (let i = 0; i < count; i++) {
      const s = document.createElement("span");
      s.style.top = Math.random() * 100 + "%";
      s.style.left = Math.random() * 100 + "%";
      s.style.animationDelay = Math.random() * 4 + "s, " + Math.random() * 6 + "s";
      s.style.setProperty("--dx", Math.random() * 46 - 23 + "px");
      s.style.setProperty("--dy", Math.random() * 46 - 23 + "px");
      wrap.appendChild(s);
    }
  }, []);

  // Reveal-on-scroll de las tarjetas, igual que el original.
  useEffect(() => {
    if (!store) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("in-view");
        });
      },
      { threshold: 0.15 }
    );
    const cards = gridsRef.current?.querySelectorAll(".card") || [];
    cards.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [store]);

  const categoriesById = useMemo(() => {
    const map = {};
    (store?.categories || []).forEach((c) => (map[c.id] = c));
    return map;
  }, [store]);

  const productsByCategory = useMemo(() => {
    const map = {};
    (store?.products || []).forEach((p) => {
      if (!map[p.category]) map[p.category] = [];
      map[p.category].push(p);
    });
    return map;
  }, [store]);

  const extraCategories = useMemo(
    () => (store?.categories || []).filter((c) => !FIXED_CATEGORY_IDS.includes(c.id)),
    [store]
  );

  function addToCart(id, name, price, qty) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing) {
        return prev.map((i) => (i.id === id ? { ...i, qty: i.qty + qty } : i));
      }
      return [...prev, { id, name, price, qty }];
    });
    setCartOpen(true);
  }
  function updateQty(id, delta) {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  }
  function removeItem(id) {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }
  function clearCart() {
    setCart([]);
  }
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  function handleGridClick(e) {
    const btn = e.target.closest(".add-btn[data-id]");
    if (!btn) return;
    const id = btn.dataset.id;
    const product = (store?.products || []).find((p) => p.id === id);
    if (product && product.available) {
      addToCart(product.id, product.cartLabel || product.name, product.price, 1);
    }
  }

  const whatsappNumber = store?.whatsappNumber || "";
  const socialLinks = store?.socialLinks || {};
  const fourpack = store?.fourpack;

  function handleWhatsappOrder() {
    if (cart.length === 0) return;
    let msg = "Hola, quiero hacer este pedido de Polinización Cruzada:\n\n";
    cart.forEach((i) => {
      msg += `${i.qty} x ${i.name} — $${i.price * i.qty} MXN\n`;
    });
    msg += `\nTotal: $${cartTotal} MXN (más envío)\n\n¿Me pueden confirmar disponibilidad, costo de envío y entrega?`;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  const catalogMsg =
    "Hola, vi la página de Polinización Cruzada y me gustaría conocer el catálogo completo de productos derivados de la miel 🍯";

  return (
    <>
      <div className="stars" id="stars" ref={starsRef} />
      <div className="cosmic-layer" aria-hidden="true">
        <div className="orbit-ring ring-a" />
        <div className="orbit-ring ring-b" />
        <div className="orbit-ring ring-c" />
      </div>
      <svg className="bee-fly" viewBox="0 0 60 34" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g className="bee-wing">
          <ellipse cx="20" cy="9" rx="12" ry="7" fill="rgba(243,239,230,0.55)" />
        </g>
        <g className="bee-wing">
          <ellipse cx="34" cy="9" rx="12" ry="7" fill="rgba(243,239,230,0.55)" />
        </g>
        <ellipse cx="27" cy="20" rx="16" ry="10" fill="#0A0912" />
        <rect x="16" y="15" width="4" height="11" rx="2" fill="#E8B33D" />
        <rect x="25" y="12" width="4" height="16" rx="2" fill="#E8B33D" />
        <rect x="34" y="15" width="4" height="11" rx="2" fill="#E8B33D" />
        <circle cx="12" cy="18" r="3" fill="#0A0912" stroke="#E8B33D" strokeWidth="1" />
        <line x1="10" y1="14" x2="6" y2="8" stroke="#E8B33D" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="14" y1="14" x2="16" y2="7" stroke="#E8B33D" strokeWidth="1.2" strokeLinecap="round" />
      </svg>

      <header>
        <div className="nav-wrap">
          <a href="#top" className="logo-wrap">
            <span className="logo-mark" aria-hidden="true" />
            <span className="logo">
              POLINIZACIÓN<span>·</span>CRUZADA
            </span>
          </a>
          <nav>
            <ul>
              <li>
                <a href="#universo">Universo</a>
              </li>
              <li>
                <a href="#kombucha">Kombucha</a>
              </li>
              <li>
                <a href="#mieles">Mieles</a>
              </li>
              <li>
                <a href="#historia">Nuestra historia</a>
              </li>
            </ul>
          </nav>
          <div className="nav-right">
            <button className="cart-btn" onClick={() => setCartOpen(true)} aria-label="Abrir carrito">
              🛒 Carrito <span className="cart-count">{cartCount}</span>
            </button>
          </div>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="orbit" />
        <div className="orbit orbit-2" />
        <div className="hero-eyebrow">Mieles · Fermentos · Botánicos — México</div>
        <h1>
          POLINIZACIÓN
          <br />
          CRUZADA
        </h1>
        <p className="hero-claim">&quot;De la miel nace el universo.&quot;</p>
        <p className="hero-sub">
          Una colección de mieles, fermentos y botánicos nacidos de la relación entre naturaleza,
          alimento y transformación.
        </p>
        <a href="#kombucha" className="hero-cta">
          Explorar el universo →
        </a>
      </section>

      <section className="section" id="universo">
        <div className="container">
          <div className="section-intro">
            <span className="eyebrow">El universo</span>
            <h2 className="section-title" style={{ marginTop: "14px" }}>
              Naturaleza → Intercambio
              <br />→ Transformación → Creación
            </h2>
          </div>

          <div className="universe-chain">
            <div className="uc-step">
              Flor
              <b>Néctar y polen</b>
            </div>
            <div className="uc-arrow">⟶</div>
            <div className="uc-step">
              Abeja
              <b>Recolecta y transporta</b>
            </div>
            <div className="uc-arrow">⟶</div>
            <div className="uc-step">
              Otra flor
              <b>Polinización cruzada</b>
            </div>
            <div className="uc-arrow">⟶</div>
            <div className="uc-step">
              Miel
              <b>El punto de partida</b>
            </div>
            <div className="uc-arrow">⟶</div>
            <div className="uc-step">
              Botánicos
              <b>Se cruzan</b>
            </div>
            <div className="uc-arrow">⟶</div>
            <div className="uc-step">
              Fermentación
              <b>Transforma</b>
            </div>
            <div className="uc-arrow">⟶</div>
            <div className="uc-step">
              Nuevos productos
              <b>Nace algo distinto</b>
            </div>
          </div>

          <p className="universe-text">
            Una flor produce néctar para alimentar a la abeja y polen para reproducirse. Cuando la
            abeja la visita, recoge el néctar y, sin saberlo, lleva consigo el polen de esa flor. Al
            visitar otra flor, parte de ese polen llega a ella — así ocurre la{" "}
            <em>polinización cruzada</em>.
            <br />
            <br />
            El néctar que la abeja recolecta se transforma en miel. Y nosotros tomamos esa miel como
            punto de partida para cruzarla con fermentos, botánicos y alimentos, creando nuevas
            combinaciones.
          </p>
          <p className="universe-final">
            Cuando existe intercambio, existe la posibilidad de transformar lo que ya existe en algo
            distinto.
          </p>
        </div>
      </section>

      <div ref={gridsRef} onClick={handleGridClick}>
        <section className="section kombucha-section" id="kombucha">
          <div className="container">
            <div className="kombucha-head">
              <span className="eyebrow">Kombucha Jun</span>
              <h2 className="section-title" style={{ marginTop: "14px" }}>
                Fermentada con miel.
              </h2>
              <p className="kombucha-sub">No con azúcar refinada</p>
            </div>

            <div className="kombucha-facts">
              <div className="fact-pill">
                <b>Fermentada con miel</b> — no con azúcar refinada, como fuente para la
                fermentación.
              </div>
              <div className="fact-pill">
                <b>Fresca · No pasteurizada</b> — conserva los microorganismos vivos propios de la
                fermentación.
              </div>
            </div>
            <p
              style={{
                fontSize: "11px",
                color: "var(--pearl-dim)",
                opacity: 0.7,
                maxWidth: "520px",
                margin: "-30px auto 40px",
                textAlign: "center",
              }}
            >
              Los beneficios mostrados se basan en el uso tradicional de cada botánico. No son
              afirmaciones médicas ni sustituyen atención profesional.
            </p>

            <div className="grid">
              {(productsByCategory["kombucha"] || []).map((p) => (
                <ProductCard key={p.id} product={p} category={categoriesById["kombucha"]} />
              ))}
            </div>

            {fourpack && (
              <div className="fourpack">
                <div className="fourpack-info">
                  <span className="eyebrow">Opción destacada</span>
                  <h3>{fourpack.name}</h3>
                  <p>La forma más conveniente de probar los dos sabores. Cuatro botellas, un solo pedido.</p>
                </div>
                <div className="fourpack-price">
                  <span className="was">${fourpack.compareAt} MXN</span>
                  <span className="now">${fourpack.price} MXN</span>
                  <button
                    className="add-btn"
                    style={{ marginTop: "6px" }}
                    onClick={() => addToCart(fourpack.id, fourpack.name, fourpack.price, 1)}
                  >
                    Añadir al carrito
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="section" id="mieles">
          <div className="container">
            <div className="section-intro">
              <span className="eyebrow">Mieles base</span>
              <h2 className="section-title" style={{ marginTop: "14px" }}>
                La miel, en su forma esencial.
              </h2>
              <p>Precio del producto — el envío se cotiza aparte por WhatsApp.</p>
            </div>
            <div className="grid">
              {(productsByCategory["miel-base"] || []).map((p) => (
                <ProductCard key={p.id} product={p} category={categoriesById["miel-base"]} />
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section-intro">
              <span className="eyebrow">Mieles herbales</span>
              <h2 className="section-title" style={{ marginTop: "14px" }}>
                Miel + botánicos.
              </h2>
              <p>
                Ingredientes, sabor, elaboración y experiencia sensorial — sin promesas terapéuticas.
                Precio del producto; el envío se cotiza aparte por WhatsApp.
              </p>
            </div>
            <div className="grid">
              {(productsByCategory["miel-herbal"] || []).map((p) => (
                <ProductCard key={p.id} product={p} category={categoriesById["miel-herbal"]} />
              ))}
            </div>
          </div>
        </section>

        {extraCategories.map((cat) => (
          <section className="section" key={cat.id}>
            <div className="container">
              <div className="section-intro">
                <span className="eyebrow">{cat.label}</span>
                <h2 className="section-title" style={{ marginTop: "14px" }}>
                  {cat.label}
                </h2>
              </div>
              <div className="grid">
                {(productsByCategory[cat.id] || []).map((p) => (
                  <ProductCard key={p.id} product={p} category={cat} />
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wa-cta">
          <span className="eyebrow">¿Buscas algo más?</span>
          <h3>Tenemos más productos derivados de la miel esperándote en WhatsApp.</h3>
          <p>
            Nuestro catálogo completo de WhatsApp incluye más creaciones a base de miel que aún no
            están en esta página. Escríbenos y te lo compartimos.
          </p>
          <a
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(catalogMsg)}`}
            className="wa-cta-btn"
          >
            📲 Ver catálogo completo en WhatsApp
          </a>
        </div>
      </section>

      <section className="strip">
        <span className="eyebrow" style={{ textAlign: "center", display: "block" }}>
          Hecho en México
        </span>
      </section>

      <section className="closing" id="historia">
        <h2>
          De la miel
          <br />
          nace el universo.
        </h2>
        <a href="#kombucha" className="closing-cta">
          Explorar el universo
        </a>
      </section>

      <footer>
        <div className="footer-grid">
          <div className="footer-brand">
            <span className="logo-mark lg" aria-hidden="true" style={{ marginBottom: "12px", display: "block" }} />
            <div className="logo">
              POLINIZACIÓN<span style={{ color: "var(--honey1)" }}>·</span>CRUZADA
            </div>
            <p>
              Kombucha · Mieles · Fermentos botánicos
              <br />
              México
            </p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4>Contacto</h4>
              <a href={`https://wa.me/${whatsappNumber}`}>WhatsApp</a>
              <a href={socialLinks.instagram || "#"}>Instagram</a>
              <a href={socialLinks.facebook || "#"}>Facebook</a>
            </div>
            <div className="footer-col">
              <h4>Navegación</h4>
              <a href="#universo">Universo</a>
              <a href="#kombucha">Kombucha</a>
              <a href="#mieles">Mieles</a>
            </div>
          </div>
        </div>
        <div className="footer-note">
          <span>Pedidos y entregas locales por WhatsApp.</span>
        </div>
      </footer>

      <div className={`overlay ${cartOpen ? "open" : ""}`} onClick={() => setCartOpen(false)} />
      <aside className={`drawer ${cartOpen ? "open" : ""}`}>
        <div className="drawer-head">
          <h3>Tu carrito</h3>
          <button className="close-btn" onClick={() => setCartOpen(false)}>
            ×
          </button>
        </div>
        <div className="drawer-items">
          {cart.length === 0 ? (
            <p className="empty-cart">
              Tu carrito está vacío.
              <br />
              Explora el universo y añade algo delicioso.
            </p>
          ) : (
            cart.map((item) => {
              const prod = (store?.products || []).find((p) => p.id === item.id);
              return (
                <div className="cart-item" key={item.id}>
                  {prod?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="cart-item-img" src={prod.imageUrl} alt={item.name} />
                  ) : (
                    <div
                      className="cart-item-img"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--pearl-dim)",
                        fontSize: "10px",
                        textAlign: "center",
                      }}
                    >
                      {item.name.split(" ")[0]}
                    </div>
                  )}
                  <div className="cart-item-info">
                    <div className="name">{item.name}</div>
                    <div className="price">${item.price} MXN c/u</div>
                    <div className="qty-row">
                      <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>
                        −
                      </button>
                      <span className="qty-val">{item.qty}</span>
                      <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>
                        +
                      </button>
                      <button className="remove-item" onClick={() => removeItem(item.id)}>
                        Quitar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="drawer-footer">
          <div className="total-row">
            <span>Total</span>
            <b>${cartTotal} MXN</b>
          </div>
          <button className="whatsapp-btn" disabled={cart.length === 0} onClick={handleWhatsappOrder}>
            📲 Pedir por WhatsApp
          </button>
          <button className="clear-cart" onClick={clearCart}>
            Vaciar carrito
          </button>
          <p className="drawer-note">
            Precios de producto — el envío se cotiza por WhatsApp. No hay pago en línea.
          </p>
        </div>
      </aside>
    </>
  );
}
