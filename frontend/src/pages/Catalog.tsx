import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import TopBar from "../components/TopBar";
import { fetchProducts } from "../api/catalog";
import type { Product } from "../api/catalog";
import { addToCart } from "../cart/cartStore";
import "../styles/catalog.css";

export default function Catalog() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        fetchProducts()
            .then(setProducts)
            .catch(() => setErr("Erro ao carregar produtos."))
            .finally(() => setLoading(false));
    }, []);

    // “Destaques” simples: os 3 primeiros
    const featured = useMemo(() => products.slice(0, 3), [products]);
    const rest = useMemo(() => products.slice(3), [products]);

    return (
        <div style={pageStyle}>
            <TopBar />

            <div className="catalog-wrap" style={wrapStyle}>
                {/* HERO */}
                <section className="catalog-hero" style={heroStyle}>
                    <div style={heroLeftStyle}>
                        <div style={heroKickerStyle}>Capacetes • Acessórios • Motos elétricas</div>
                        <h1 className="hero-title" style={heroTitleStyle}>
                            PROTEÇÃO
                            <br />
                            COM ESTILO
                        </h1>
                        <p style={heroTextStyle}>
                            Capacetes e acessórios selecionados para mobilidade elétrica e urbana.
                            Compra rápida com Pix ou cartão.
                        </p>

                        <div style={heroCtasStyle}>
                            <a href="#catalogo" style={{ ...btnStyle, ...btnPrimaryStyle, textDecoration: "none", display: "inline-block" }}>
                                Ver catálogo
                            </a>
                            <Link to="/carrinho" style={{ ...btnStyle, ...btnGhostStyle, textDecoration: "none", display: "inline-block" }}>
                                Ir ao carrinho
                            </Link>
                        </div>

                        <div style={chipsRowStyle}>
                            <Chip text="5% OFF no Pix" />
                            <Chip text="Parcele no cartão" />
                            <Chip text="Frete no checkout" />
                        </div>
                    </div>

                    {/* HERO visual (sem imagem externa) */}
                    <div style={heroRightStyle}>
                        <div style={heroVisualStyle}>
                            <div style={heroVisualTopStyle}>
                                <div style={{ fontWeight: 1000, letterSpacing: 2, fontSize: 12, opacity: 0.85 }}>NOVIDADE</div>
                                <div style={{ fontWeight: 1000, fontSize: 18, marginTop: 6 }}>Linha urbana</div>
                            </div>

                            <div style={heroVisualMidStyle}>
                                <div style={heroCircleStyle} />
                                <div style={heroCircle2Style} />
                                <div style={heroVisualLabelStyle}>E-MOBILITY READY</div>
                            </div>

                            <div style={heroVisualBottomStyle}>
                                <div style={{ color: "rgba(255,255,255,.75)", fontSize: 12, fontWeight: 800 }}>
                                    Segurança • Conforto • Ventilação
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* STATUS */}
                {loading && <div style={{ color: "rgba(255,255,255,.75)", marginTop: 16 }}>Carregando...</div>}
                {err && <div style={errorStyle}>{err}</div>}

                {!loading && !err && products.length > 0 && (
                    <>
                        {/* FEATURED */}
                        <section style={{ marginTop: 18 }}>
                            <div style={sectionTitleRowStyle}>
                                <div>
                                    <div style={kickerStyle}>Destaques</div>
                                    <h2 style={h2Style}>ESCOLHIDOS DA SEMANA</h2>
                                </div>
                                <a href="#catalogo" style={ghostLinkStyle}>Ver tudo →</a>
                            </div>

                            <div className="catalog-grid-3" style={featuredGridStyle}>
                                {featured.map((p) => {
                                    const img = p.images?.[0]?.image;

                                    return (
                                        <div key={p.id} style={featuredCardStyle}>
                                            <Link to={`/produto/${p.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                                                <div style={featuredImgWrapStyle}>
                                                    {img ? (
                                                        <img src={img} alt={p.name} style={imgStyle} />
                                                    ) : (
                                                        <div style={{ width: "100%", height: "100%", background: "#0e111a" }} />
                                                    )}
                                                </div>

                                                <div style={{ marginTop: 12 }}>
                                                    <div style={prodNameStyle}>{p.name}</div>
                                                    <div style={metaStyle}>
                                                        {p.category?.name}{p.brand ? ` • ${p.brand.name}` : ""}
                                                    </div>
                                                </div>
                                            </Link>

                                            <div style={priceRowStyle}>
                                                <div style={priceStyle}>R$ {p.price}</div>
                                                <button onClick={() => addToCart(p, 1)} style={{ ...btnStyle, ...btnPrimaryStyle }}>
                                                    Comprar
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* CATALOG */}
                        <section id="catalogo" style={{ marginTop: 22 }}>
                            <div style={sectionTitleRowStyle}>
                                <div>
                                    <div style={kickerStyle}>Catálogo</div>
                                    <h2 style={h2Style}>TODOS OS PRODUTOS</h2>
                                </div>
                                <div style={{ color: "rgba(255,255,255,.7)", fontWeight: 800, fontSize: 12 }}>
                                    {products.length} itens
                                </div>
                            </div>

                            <div className="catalog-grid-3" style={gridStyle}>
                                {rest.length ? (
                                    rest.map((p) => <ProductCard key={p.id} p={p} />)
                                ) : (
                                    featured.map((p) => <ProductCard key={p.id} p={p} />)
                                )}
                            </div>
                        </section>

                        {/* FOOT NOTE */}
                        <div style={footNoteStyle}>
                            Pagamento via Pix e Cartão (Mercado Pago). Frete e prazo calculados no checkout.
                        </div>
                    </>
                )}

                {!loading && !err && products.length === 0 && (
                    <div style={emptyCardStyle}>
                        <div style={{ fontWeight: 1000, fontSize: 20 }}>Sem produtos cadastrados.</div>
                        <div style={{ color: "rgba(255,255,255,.75)", marginTop: 6 }}>
                            Cadastre produtos no admin do Django para aparecerem aqui.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function ProductCard({ p }: { p: Product }) {
    const img = p.images?.[0]?.image;

    return (
        <div style={cardStyle}>
            <Link to={`/produto/${p.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div style={imgWrapStyle}>
                    {img ? (
                        <img src={img} alt={p.name} style={imgStyle} />
                    ) : (
                        <div style={{ width: "100%", height: "100%", background: "#0e111a" }} />
                    )}
                </div>

                <div style={{ marginTop: 10 }}>
                    <div style={prodNameStyle}>{p.name}</div>
                    <div style={metaStyle}>
                        {p.category?.name}{p.brand ? ` • ${p.brand.name}` : ""}
                    </div>
                </div>
            </Link>

            <div style={priceRowStyle}>
                <div style={priceStyle}>R$ {p.price}</div>
                <button onClick={() => addToCart(p, 1)} style={{ ...btnStyle, ...btnPrimaryStyle }}>
                    Adicionar
                </button>
            </div>
        </div>
    );
}

function Chip({ text }: { text: string }) {
    return <span style={chipStyle}>{text}</span>;
}

/* ------------------ styles ------------------ */

const pageStyle: React.CSSProperties = {
    background: "#0f1115",
    minHeight: "100vh",
    color: "#e8eaf0",
};

const wrapStyle: React.CSSProperties = {
    maxWidth: 1180,
    margin: "0 auto",
    padding: "26px 20px 50px",
};

/* HERO */
const heroStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: 18,
    alignItems: "stretch",
    background: "#ffffff",
    color: "#111",
    borderRadius: 18,
    padding: 22,
    border: "1px solid rgba(0,0,0,.08)",
};

const heroLeftStyle: React.CSSProperties = { paddingRight: 8 };

const heroKickerStyle: React.CSSProperties = {
    fontWeight: 900,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontSize: 12,
    color: "rgba(0,0,0,.65)",
};

const heroTitleStyle: React.CSSProperties = {
    margin: "10px 0 0",
    fontSize: 64,
    letterSpacing: 1,
    lineHeight: 0.95,
    fontWeight: 1000,
};

const heroTextStyle: React.CSSProperties = {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 1.6,
    color: "rgba(0,0,0,.75)",
    fontWeight: 700,
    maxWidth: 520,
};

const heroCtasStyle: React.CSSProperties = {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 14,
};

const chipsRowStyle: React.CSSProperties = {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 14,
};

const chipStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,.12)",
    fontWeight: 900,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "rgba(0,0,0,.78)",
};

const heroRightStyle: React.CSSProperties = {
    display: "grid",
    placeItems: "stretch",
};

const heroVisualStyle: React.CSSProperties = {
    borderRadius: 16,
    background: "#0f1115",
    color: "#e8eaf0",
    border: "1px solid rgba(0,0,0,.08)",
    padding: 16,
    display: "grid",
    gridTemplateRows: "auto 1fr auto",
    overflow: "hidden",
};

const heroVisualTopStyle: React.CSSProperties = {};
const heroVisualMidStyle: React.CSSProperties = {
    marginTop: 12,
    position: "relative",
    display: "grid",
    placeItems: "center",
    minHeight: 220,
};

const heroCircleStyle: React.CSSProperties = {
    width: 220,
    height: 220,
    borderRadius: "50%",
    background: "radial-gradient(circle at 30% 30%, rgba(106,166,255,.8), rgba(15,17,21,0) 60%)",
    filter: "blur(0px)",
};

const heroCircle2Style: React.CSSProperties = {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: "50%",
    background: "radial-gradient(circle at 70% 70%, rgba(255,255,255,.25), rgba(15,17,21,0) 55%)",
};

const heroVisualLabelStyle: React.CSSProperties = {
    position: "absolute",
    bottom: 14,
    left: 14,
    fontWeight: 1000,
    letterSpacing: 2,
    fontSize: 12,
    opacity: 0.85,
};

const heroVisualBottomStyle: React.CSSProperties = {
    marginTop: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
};

/* Sections */
const sectionTitleRowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 16,
    marginBottom: 12,
};

const kickerStyle: React.CSSProperties = {
    color: "rgba(255,255,255,.6)",
    fontWeight: 900,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontSize: 12,
};

const h2Style: React.CSSProperties = {
    margin: "6px 0 0",
    fontSize: 40,
    letterSpacing: 0.8,
    lineHeight: 1,
    fontWeight: 1000,
};

const ghostLinkStyle: React.CSSProperties = {
    color: "rgba(255,255,255,.85)",
    fontWeight: 900,
    textDecoration: "none",
    whiteSpace: "nowrap",
};

/* Featured grid */
const featuredGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 16,
};

const featuredCardStyle: React.CSSProperties = {
    background: "#141824",
    border: "1px solid #252a3a",
    borderRadius: 16,
    padding: 14,
};

const featuredImgWrapStyle: React.CSSProperties = {
    width: "100%",
    aspectRatio: "16 / 10",
    borderRadius: 14,
    overflow: "hidden",
    border: "1px solid #252a3a",
    background: "#0e111a",
};

/* Catalog grid */
const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 16,
};

const cardStyle: React.CSSProperties = {
    background: "#141824",
    border: "1px solid #252a3a",
    borderRadius: 14,
    padding: 14,
};

const imgWrapStyle: React.CSSProperties = {
    width: "100%",
    aspectRatio: "4 / 3",
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid #252a3a",
    background: "#0e111a",
};

const imgStyle: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover" };
const prodNameStyle: React.CSSProperties = { fontWeight: 1000, letterSpacing: 0.2 };
const metaStyle: React.CSSProperties = { marginTop: 4, color: "rgba(255,255,255,.65)", fontSize: 12, fontWeight: 800 };
const priceRowStyle: React.CSSProperties = { marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 };
const priceStyle: React.CSSProperties = { fontWeight: 1000, fontSize: 18 };

/* Buttons */
const btnStyle: React.CSSProperties = {
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,.14)",
    padding: "12px 14px",
    fontWeight: 1000,
    letterSpacing: 1,
    textTransform: "uppercase",
    cursor: "pointer",
};

const btnPrimaryStyle: React.CSSProperties = { background: "#ffffff", color: "#111" };
const btnGhostStyle: React.CSSProperties = { background: "transparent", color: "rgba(0,0,0,.85)", border: "1px solid rgba(0,0,0,.16)" };

const errorStyle: React.CSSProperties = {
    marginTop: 14,
    border: "1px solid rgba(255,92,119,.35)",
    background: "rgba(255,92,119,.12)",
    color: "#ff5c77",
    padding: 12,
    borderRadius: 12,
    fontWeight: 800,
};

const emptyCardStyle: React.CSSProperties = {
    marginTop: 16,
    background: "#141824",
    border: "1px solid #252a3a",
    borderRadius: 14,
    padding: 16,
};

const footNoteStyle: React.CSSProperties = {
    marginTop: 18,
    color: "rgba(255,255,255,.65)",
    fontSize: 12,
    fontWeight: 700,
};