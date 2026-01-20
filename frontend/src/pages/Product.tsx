import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import TopBar from "../components/TopBar";
import { fetchProductBySlug } from "../api/catalog";
import type { Product } from "../api/catalog";
import { addToCart } from "../cart/cartStore";

export default function ProductPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        if (!slug) return;

        fetchProductBySlug(slug)
            .then(setProduct)
            .catch(() => setErr("Produto não encontrado."))
            .finally(() => setLoading(false));
    }, [slug]);

    return (
        <div style={pageStyle}>
            <TopBar />

            <div style={wrapStyle}>
                <Link to="/" style={ghostLinkStyle}>← Voltar</Link>

                {loading && <div style={{ color: "rgba(255,255,255,.75)", marginTop: 12 }}>Carregando...</div>}
                {err && <div style={errorStyle}>{err}</div>}

                {product && (
                    <div style={gridStyle}>
                        <div style={leftStyle}>
                            <div style={imgWrapStyle}>
                                {product.images?.[0]?.image ? (
                                    <img src={product.images[0].image} alt={product.name} style={imgStyle} />
                                ) : (
                                    <div style={{ width: "100%", height: "100%", background: "#0e111a" }} />
                                )}
                            </div>

                            {product.images?.length > 1 && (
                                <div style={thumbRowStyle}>
                                    {product.images.slice(1).map((im) => (
                                        <img key={im.id} src={im.image} alt={product.name} style={thumbStyle} />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={rightStyle}>
                            <div style={kickerStyle}>Produto</div>
                            <h1 style={h1Style}>{product.name}</h1>

                            <div style={metaStyle}>
                                {product.category?.name}{product.brand ? ` • ${product.brand.name}` : ""}
                            </div>

                            <div style={priceStyle}>R$ {product.price}</div>

                            {product.description && (
                                <div style={descStyle}>{product.description}</div>
                            )}

                            <div style={ctaRowStyle}>
                                <button
                                    onClick={() => {
                                        addToCart(product, 1);
                                        navigate("/carrinho");
                                    }}
                                    style={{ ...btnStyle, ...btnPrimaryStyle }}
                                >
                                    Comprar agora
                                </button>

                                <button
                                    onClick={() => addToCart(product, 1)}
                                    style={{ ...btnStyle, ...btnGhostStyle }}
                                >
                                    Adicionar
                                </button>
                            </div>

                            <div style={noteStyle}>
                                Pagamento via Pix ou Cartão (Mercado Pago). Entrega com cálculo no checkout.
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const pageStyle: React.CSSProperties = { background: "#0f1115", minHeight: "100vh", color: "#e8eaf0" };
const wrapStyle: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", padding: "26px 20px 50px" };
const ghostLinkStyle: React.CSSProperties = { color: "rgba(255,255,255,.85)", fontWeight: 900, textDecoration: "none" };

const gridStyle: React.CSSProperties = { marginTop: 14, display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 18, alignItems: "start" };
const leftStyle: React.CSSProperties = {};
const rightStyle: React.CSSProperties = { background: "#141824", border: "1px solid #252a3a", borderRadius: 14, padding: 16 };

const imgWrapStyle: React.CSSProperties = { width: "100%", aspectRatio: "4 / 3", borderRadius: 14, overflow: "hidden", border: "1px solid #252a3a", background: "#0e111a" };
const imgStyle: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover" };
const thumbRowStyle: React.CSSProperties = { marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" };
const thumbStyle: React.CSSProperties = { width: 84, height: 84, objectFit: "cover", borderRadius: 12, border: "1px solid #252a3a" };

const kickerStyle: React.CSSProperties = { color: "rgba(255,255,255,.6)", fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", fontSize: 12 };
const h1Style: React.CSSProperties = { margin: "6px 0 0", fontSize: 42, letterSpacing: 0.6, lineHeight: 1.05 };
const metaStyle: React.CSSProperties = { marginTop: 8, color: "rgba(255,255,255,.65)", fontSize: 12, fontWeight: 800 };
const priceStyle: React.CSSProperties = { marginTop: 14, fontWeight: 1000, fontSize: 22 };
const descStyle: React.CSSProperties = { marginTop: 14, color: "rgba(255,255,255,.85)", lineHeight: 1.6, whiteSpace: "pre-wrap" };

const ctaRowStyle: React.CSSProperties = { marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" };
const btnStyle: React.CSSProperties = { borderRadius: 12, border: "1px solid rgba(255,255,255,.14)", padding: "12px 14px", fontWeight: 1000, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" };
const btnPrimaryStyle: React.CSSProperties = { background: "#ffffff", color: "#111" };
const btnGhostStyle: React.CSSProperties = { background: "transparent", color: "rgba(255,255,255,.9)" };

const noteStyle: React.CSSProperties = { marginTop: 14, color: "rgba(255,255,255,.6)", fontSize: 12, fontWeight: 700 };

const errorStyle: React.CSSProperties = {
    marginTop: 12,
    border: "1px solid rgba(255,92,119,.35)",
    background: "rgba(255,92,119,.12)",
    color: "#ff5c77",
    padding: 12,
    borderRadius: 12,
    fontWeight: 800,
};