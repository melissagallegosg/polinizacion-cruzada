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
  const [navOpen, setNavOpen] = useState(false);
  const [subFrequency, setSubFrequency] = useState("15dias");
  const [subQty, setSubQty] = useState(1);
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
  const fourpackUnits = fourpack?.units || 4;
  const fourpackUnitPrice = fourpack ? Math.round((fourpack.price / fourpackUnits) * 100) / 100 : 0;
  const frequencyLabel = subFrequency === "15dias" ? "Entrega cada 15 días" : "Entrega cada mes";

  function handleAddSubscription() {
    if (!fourpack || !fourpack.available) return;
    addToCart(
      `${fourpack.id}-${subFrequency}`,
      `${fourpack.name} · Suscripción (${frequencyLabel})`,
      fourpack.price,
      subQty
    );
  }

  function handleWhatsappOrder() {
    if (cart.length === 0) return;
    let msg = "Hola, quiero hacer este pedido a MELS:\n\n";
    cart.forEach((i) => {
      msg += `${i.qty} x ${i.name} — $${i.price * i.qty} MXN\n`;
    });
    msg += `\nTotal: $${cartTotal} MXN (más envío)\n\n¿Me pueden confirmar disponibilidad, costo de envío y entrega?`;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  const catalogMsg =
    "Hola, vi la página de MELS y me gustaría conocer el catálogo completo de kombucha, miel y fermentos botánicos 🍯";

  if (!store) {
    return (
      <div className="page-loader" role="status" aria-live="polite">
        <span className="logo-mark lg" aria-hidden="true" />
        <span className="page-loader-text">Cargando MELS…</span>
      </div>
    );
  }

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
            <span className="logo">MELS</span>
          </a>
          <nav className={navOpen ? "open" : ""}>
            <ul onClick={() => setNavOpen(false)}>
              <li>
                <a href="#concepto">El cruce</a>
              </li>
              <li>
                <a href="#kombucha">Kombucha</a>
              </li>
              <li>
                <a href="#suscripcion">Suscripción</a>
              </li>
              <li>
                <a href="#mieles">Mieles</a>
              </li>
              <li>
                <a href="#nosotros">Nosotros</a>
              </li>
              <li>
                <a href="#negocio">Tu negocio</a>
              </li>
            </ul>
          </nav>
          <div className="nav-right">
            <button className="cart-btn" onClick={() => setCartOpen(true)} aria-label="Abrir carrito">
              🛒 Carrito <span className="cart-count">{cartCount}</span>
            </button>
            <button
              className="menu-toggle"
              onClick={() => setNavOpen((v) => !v)}
              aria-label={navOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={navOpen}
            >
              {navOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="orbit" />
        <div className="orbit orbit-2" />
        <h1>MELS</h1>
        <p className="hero-claim">Miel × Fermentación × Botánicos</p>
        <p className="hero-sub">
          Alimentos vivos creados a partir del encuentro entre miel, fermentación y plantas.
        </p>
        <a href="#kombucha" className="hero-cta">
          Ver catálogo →
        </a>
        <div className="kombucha-facts" style={{ marginTop: "40px" }}>
          <div className="fact-pill">
            <b>Sin pasteurizar</b> — cultivos vivos.
          </div>
          <div className="fact-pill">
            <b>Extracciones herbales estandarizadas</b> — mismo perfil, cada vez.
          </div>
        </div>
      </section>

      <section className="section" id="concepto">
        <div className="container">
          <div className="section-intro">
            <span className="eyebrow">El concepto</span>
            <h2 className="section-title" style={{ marginTop: "14px" }}>
              Tres elementos.
              <br />
              Una misma fórmula.
            </h2>
            <p>MELS nace de combinar tres elementos que transforman y aportan algo distinto:</p>
          </div>

          <div className="kombucha-facts">
            <div className="fact-pill">
              <b>Miel</b> — el origen. Dulzura, cuerpo y profundidad.
            </div>
            <div className="fact-pill">
              <b>Fermentación</b> — el proceso. Tiempo, transformación y complejidad.
            </div>
            <div className="fact-pill">
              <b>Botánicos</b> — la materia. Plantas, aromas, sabores y carácter.
            </div>
          </div>

          <p className="universe-final">Miel × Fermentación × Botánicos</p>

          <p className="universe-text">
            No los pensamos como ingredientes separados ni como categorías independientes.
            Son la base de cada fórmula MELS.
            <br />
            <br />
            A partir de ellos creamos JUN, mieles y nuevos formatos que exploran distintas
            plantas, sabores y formas de incorporar botánicos a la vida cotidiana. Una
            fórmula que puede tomar muchas formas.
          </p>

          <p className="eyebrow" style={{ textAlign: "center", marginTop: "56px" }}>
            De dónde parte cada elemento
          </p>

          <div className="universe-chain" style={{ marginTop: "24px" }}>
            <div className="uc-step">
              Miel
              <b>Néctar transformado por las abejas</b>
            </div>
            <div className="uc-arrow">⟶</div>
            <div className="uc-step">
              Fermentación
              <b>Té transformado por microorganismos</b>
            </div>
            <div className="uc-arrow">⟶</div>
            <div className="uc-step">
              Botánicos
              <b>Plantas que aportan sabor, aroma y carácter</b>
            </div>
            <div className="uc-arrow">⟶</div>
            <div className="uc-step">
              MELS
              <b>Alimentos creados a partir de los tres</b>
            </div>
          </div>
        </div>
      </section>

      <div ref={gridsRef} onClick={handleGridClick}>
        <section className="section kombucha-section" id="kombucha">
          <div className="container">
            <div className="kombucha-head">
              <span className="eyebrow">Kombuchas JUN</span>
              <h2 className="section-title" style={{ marginTop: "25px" }}>
                Fermentos vivos elaborados con té, miel y botánicos.
              </h2>
              <p className="kombucha-sub" style={{ maxWidth: "620px", lineHeight: "1.6" }}>
                Nuestro JUN parte de una fermentación suave donde la miel se encuentra con el
                té y distintas plantas para crear bebidas de perfil fresco, complejo y
                naturalmente ácido.
                <br />
                <br />
                Cada fórmula combina botánicos y sabores en una experiencia pensada para
                disfrutarse fría, como parte de tu día.
              </p>
            </div>

            <div className="kombucha-facts">
              <div className="fact-pill">
                <b>Fermentada con miel</b> — no con azúcar refinada, como fuente para la
                fermentación.
              </div>
              <div className="fact-pill">
                <b>Base Jun</b> — kombucha con miel de origen desde el primer día.
              </div>
              <div className="fact-pill">
                <b>Fresca · No pasteurizada</b> — conserva los microorganismos vivos propios de
                la fermentación.
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
          </div>
        </section>

        <section className="section" id="mieles">
          <div className="container">
            <div className="section-intro">
              <span className="eyebrow">Mieles</span>
              <h2 className="section-title" style={{ marginTop: "14px" }}>
                Miel transformada con fermentación y botánicos.
              </h2>
              <p>
                Combinamos miel con cultivos de fermentación y plantas seleccionadas para
                crear fórmulas de sabor, textura y carácter propios.
                <br />
                <br />
                Pequeñas mezclas, ingredientes reales y una nueva forma de incorporar
                botánicos a tu día.
              </p>
            </div>
            <div className="grid">
              {[...(productsByCategory["miel-base"] || []), ...(productsByCategory["miel-herbal"] || [])].map(
                (p) => (
                  <ProductCard key={p.id} product={p} category={categoriesById[p.category]} />
                )
              )}
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

      <section className="section" id="suscripcion">
        <div className="container">
          <div className="section-intro">
            <span className="eyebrow">Suscripción</span>
            <h2 className="section-title" style={{ marginTop: "14px" }}>
              Que no te falte.
            </h2>
            <p>Kombucha en automático, con descuento y sin tener que acordarte de pedir.</p>
          </div>

          {fourpack && (
            <div className="sub-card">
              <div className="sub-img-wrap">
                {fourpack.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fourpack.imageUrl} alt={fourpack.name} />
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
              </div>
              <div className="sub-info">
                <h3>{fourpack.name}</h3>
                <div className="sub-price-row">
                  <span className="now">${fourpack.price} MXN</span>
                  <span className="was">${fourpack.compareAt} MXN</span>
                  <span className={`sub-badge ${fourpack.available ? "" : "off"}`}>
                    {fourpack.available ? "En stock" : "Agotado"}
                  </span>
                </div>
                <p className="sub-unit-price">
                  Equivale a ${fourpackUnitPrice} MXN por botella ({fourpackUnits} botellas).
                </p>

                <div className="sub-freq">
                  <label className={`sub-freq-option ${subFrequency === "15dias" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="frequency"
                      checked={subFrequency === "15dias"}
                      onChange={() => setSubFrequency("15dias")}
                    />
                    Entrega cada 15 días
                  </label>
                  <label className={`sub-freq-option ${subFrequency === "mes" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="frequency"
                      checked={subFrequency === "mes"}
                      onChange={() => setSubFrequency("mes")}
                    />
                    Entrega cada mes
                  </label>
                </div>

                <div className="sub-actions">
                  <div className="sub-qty">
                    <button type="button" onClick={() => setSubQty((q) => Math.max(1, q - 1))}>
                      −
                    </button>
                    <span>{subQty}</span>
                    <button type="button" onClick={() => setSubQty((q) => q + 1)}>
                      +
                    </button>
                  </div>
                  <button
                    className="add-btn"
                    onClick={handleAddSubscription}
                    disabled={!fourpack.available}
                  >
                    {fourpack.available ? "Añadir al carrito" : "Agotado"}
                  </button>
                </div>

                <p className="sub-note">
                  Tú eliges cada cuánto llega; nosotros nos encargamos del resto. Puedes
                  cambiar o cancelar la frecuencia cuando quieras escribiéndonos por
                  WhatsApp.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="section" id="nosotros">
        <div className="container">
          <div className="section-intro">
            <span className="eyebrow">Nosotros</span>
            <h2 className="section-title" style={{ marginTop: "14px" }}>
              MELS nace del encuentro.
            </h2>
            <p>
              Creemos que los alimentos pueden ser mucho más que algo que consumes. Pueden
              ser una forma cotidiana de explorar plantas, sabores y procesos vivos.
            </p>
          </div>

          <p className="universe-text" style={{ textAlign: "center" }}>
            Por eso creamos MELS alrededor de tres elementos:
          </p>

          <div className="kombucha-facts">
            <div className="fact-pill">
              <b>Miel</b> — aporta el origen.
            </div>
            <div className="fact-pill">
              <b>Fermentación</b> — transforma.
            </div>
            <div className="fact-pill">
              <b>Botánicos</b> — aportan diversidad, carácter y propósito.
            </div>
          </div>

          <p className="universe-text">
            Los cruzamos en alimentos funcionales pensados para integrarse fácilmente a tu
            día a día. No buscamos hacer productos complicados ni convertir las plantas en
            promesas extraordinarias. Nos interesa crear fórmulas honestas, bien pensadas y
            deliciosas, donde cada ingrediente tenga una razón de estar.
            <br />
            <br />
            MELS es nuestra manera de explorar ese cruce.
          </p>
          <p className="universe-final">Alimentos vivos. Botánicos. Hechos para tu día.</p>
        </div>
      </section>

      <section className="section" id="negocio">
        <div className="wa-cta">
          <span className="eyebrow">MELS en tu negocio</span>
          <h3>La bebida que tus clientes ya están buscando.</h3>
          <p>
            Cafeterías, restaurantes y tiendas que quieren sumar kombucha y miel fermentada
            a su oferta, sin complicarse con el reabasto. Te ayudamos con el volumen, el
            precio y la entrega.
          </p>
          <div className="kombucha-facts" style={{ marginBottom: "26px" }}>
            <div className="fact-pill">
              <b>Ticket promedio más alto</b> — por encima de una bebida convencional.
            </div>
            <div className="fact-pill">
              <b>Sin chamba extra</b> — nosotros nos encargamos del reabasto.
            </div>
            <div className="fact-pill">
              <b>Producto con historia</b> — fermentado en lotes pequeños, con cultivos
              vivos.
            </div>
          </div>
          <a
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
              "Hola, tengo un negocio y me gustaría conocer las condiciones para vender productos de MELS 🍯"
            )}`}
            className="wa-cta-btn"
          >
            📲 Contáctanos por WhatsApp
          </a>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-intro">
            <span className="eyebrow">Pedidos y entrega</span>
            <h2 className="section-title" style={{ marginTop: "14px" }}>
              ¿Cómo llega?
            </h2>
          </div>
          <div className="kombucha-facts">
            <div className="fact-pill">
              <b>Monterrey y área metropolitana</b> — coordinamos entrega a domicilio por
              WhatsApp.
            </div>
            <div className="fact-pill">
              <b>¿Fuera de Monterrey?</b> — escríbenos y vemos opciones de envío.
            </div>
            <div className="fact-pill">
              <b>Recién salida del refri</b> — sabe mejor fría; cuida la cadena de frío del
              cultivo vivo.
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wa-cta">
          <span className="eyebrow">¿Buscas algo más?</span>
          <h3>Tenemos más productos del cruce esperándote en WhatsApp.</h3>
          <p>
            Nuestro catálogo completo incluye más creaciones que aún no están en esta
            página. Escríbenos y te lo compartimos.
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
          Miel × Fermentación
          <br />× Botánicos.
        </h2>
        <a href="#kombucha" className="closing-cta">
          Explorar el catálogo
        </a>
      </section>

      <footer>
        <div className="footer-grid">
          <div className="footer-brand">
            <span className="logo-mark lg" aria-hidden="true" style={{ marginBottom: "12px", display: "block" }} />
            <div className="logo">MELS</div>
            <p>Kombucha · Miel · Fermentos botánicos</p>
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
              <a href="#concepto">El cruce</a>
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
              Explora el catálogo y añade algo delicioso.
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
