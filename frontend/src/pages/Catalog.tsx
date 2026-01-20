import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TopBar from "../components/TopBar";
import { fetchProducts } from "../api/catalog";
import type { Product } from "../api/catalog";
import { addToCart } from "../cart/cartStore";

export default function Catalog() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProducts()
            .then(setProducts)
            .catch(() => setError("Erro ao carregar produtos."))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={pageStyle}>
            <TopBar />

            <div style={wrapStyle}>
                <div style={titleRowStyle}>
                    <div>
                        <div style={kickerStyle}>Loja</div>
                        <h1 style={h1Style}>CAPACETES</h1>
                        <div style={subTitleStyle}>Destaques para mobilidade elétrica e urbana.</div>
                    </div>

                    <Link to="/carrinho" style={ghostLinkStyle}>
                        Ir para o carrinho →
                    </Link>
                </div>

                {loading && <div style={{ color: "rgba(255,255,255,.75)" }}>Carregando...</div>}
                {error && <div style={errorStyle}>{error}</div>}

                {!loading && !error && (
                    <div style={gridStyle}>
                        {products.map((p) => {
                            const img = p.images?.[0]?.image;

                            return (
                                <div key={p.id} style={cardStyle}>
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
                                        <button
                                            onClick={() => addToCart(p, 1)}
                                            style={{ ...btnStyle, ...btnPrimaryStyle }}
                                        >
                                            Adicionar
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

/* styles */
const pageStyle: React.CSSProperties = { background: "#0f1115", minHeight: "100vh", color: "#e8eaf0" };
const wrapStyle: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", padding: "26px 20px 50px" };
const titleRowStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, marginBottom: 18 };
const kickerStyle: React.CSSProperties = { color: "rgba(255,255,255,.6)", fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", fontSize: 12 };
const h1Style: React.CSSProperties = { margin: "6px 0 0", fontSize: 52, letterSpacing: 1, lineHeight: 1 };
const subTitleStyle: React.CSSProperties = { marginTop: 10, color: "rgba(255,255,255,.75)", fontWeight: 700 };
const ghostLinkStyle: React.CSSProperties = { color: "rgba(255,255,255,.85)", fontWeight: 900, textDecoration: "none", whiteSpace: "nowrap" };

const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 };
const cardStyle: React.CSSProperties = { background: "#141824", border: "1px solid #252a3a", borderRadius: 14, padding: 14 };
const imgWrapStyle: React.CSSProperties = { width: "100%", aspectRatio: "4 / 3", borderRadius: 12, overflow: "hidden", border: "1px solid #252a3a", background: "#0e111a" };
const imgStyle: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover" };
const prodNameStyle: React.CSSProperties = { fontWeight: 1000, letterSpacing: 0.2 };
const metaStyle: React.CSSProperties = { marginTop: 4, color: "rgba(255,255,255,.65)", fontSize: 12, fontWeight: 800 };
const priceRowStyle: React.CSSProperties = { marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 };
const priceStyle: React.CSSProperties = { fontWeight: 1000, fontSize: 18 };

const btnStyle: React.CSSProperties = { borderRadius: 12, border: "1px solid rgba(255,255,255,.14)", padding: "10px 12px", fontWeight: 1000, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" };
const btnPrimaryStyle: React.CSSProperties = { background: "#ffffff", color: "#111" };

const errorStyle: React.CSSProperties = {
    border: "1px solid rgba(255,92,119,.35)",
    background: "rgba(255,92,119,.12)",
    color: "#ff5c77",
    padding: 12,
    borderRadius: 12,
    fontWeight: 800,
};