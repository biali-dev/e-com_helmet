import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";

import type { CartItem } from "../cart/cartStore";
import {
    getCart,
    removeFromCart,
    setQty,
    cartTotal,
    clearCart,
} from "../cart/cartStore";

function money(v: number): string {
    return v.toFixed(2);
}

function nMoney(s: string): number {
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
}

export default function CartPage() {
    const navigate = useNavigate();
    const [items, setItems] = useState<CartItem[]>([]);

    const refresh = useCallback(() => {
        setItems(getCart());
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    // Escuta alterações do carrinho (evento customizado do cartStore)
    useEffect(() => {
        const handler = () => refresh();
        window.addEventListener("cart:updated", handler);
        return () => window.removeEventListener("cart:updated", handler);
    }, [refresh]);

    const subtotal = cartTotal();

    return (
        <div style={pageStyle}>
            <TopBar />

            <div style={wrapStyle}>
                <div style={titleRowStyle}>
                    <div>
                        <div style={kickerStyle}>Carrinho</div>
                        <h1 style={h1Style}>SEUS ITENS</h1>
                        <div style={subTitleStyle}>
                            Subtotal: <strong>R$ {money(subtotal)}</strong>
                        </div>
                    </div>

                    <Link to="/" style={ghostLinkStyle}>
                        ← Voltar à loja
                    </Link>
                </div>

                {items.length === 0 ? (
                    <div style={emptyCardStyle}>
                        <div style={{ fontWeight: 1000, fontSize: 18 }}>Seu carrinho está vazio.</div>
                        <div style={{ color: "rgba(255,255,255,.7)", marginTop: 6 }}>
                            Volte para a loja e escolha um capacete.
                        </div>
                        <div style={{ marginTop: 12 }}>
                            <Link to="/" style={ghostLinkStyle}>Continuar comprando →</Link>
                        </div>
                    </div>
                ) : (
                    <div style={gridStyle}>
                        {/* LEFT: items */}
                        <div style={{ display: "grid", gap: 12 }}>
                            {items.map((i) => (
                                <div key={i.productId} style={itemCardStyle}>
                                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                        <div style={thumbStyle}>
                                            {i.image ? (
                                                <img
                                                    src={i.image}
                                                    alt={i.name}
                                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                />
                                            ) : null}
                                        </div>

                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <div style={itemNameStyle}>{i.name}</div>
                                            <div style={metaStyle}>
                                                R$ {i.price} •{" "}
                                                <Link to={`/produto/${i.slug}`} style={miniLinkStyle}>
                                                    ver produto
                                                </Link>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => removeFromCart(i.productId)}
                                            title="Remover"
                                            style={{ ...btnStyle, ...btnGhostStyle, padding: "10px 12px" }}
                                        >
                                            Remover
                                        </button>
                                    </div>

                                    <div style={itemBottomRowStyle}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div style={miniTitleStyle}>Quantidade</div>

                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <button
                                                    onClick={() => setQty(i.productId, i.qty - 1)}
                                                    style={qtyBtnStyle}
                                                >
                                                    -
                                                </button>

                                                <input
                                                    value={i.qty}
                                                    onChange={(e) => setQty(i.productId, Number(e.target.value || 1))}
                                                    inputMode="numeric"
                                                    style={qtyInputStyle}
                                                />

                                                <button
                                                    onClick={() => setQty(i.productId, i.qty + 1)}
                                                    style={qtyBtnStyle}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        <div style={{ fontWeight: 1000, fontSize: 16 }}>
                                            R$ {money(nMoney(i.price) * i.qty)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* RIGHT: summary */}
                        <div style={rightColStyle}>
                            <div style={summaryStickyStyle}>
                                <div style={summaryCardStyle}>
                                    <div style={miniTitleStyle}>RESUMO</div>

                                    <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                                        {items.map((i) => (
                                            <div key={i.productId} style={summaryLineStyle}>
                                                <div
                                                    style={{
                                                        color: "rgba(255,255,255,.85)",
                                                        fontWeight: 800,
                                                        minWidth: 0,
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {i.name}
                                                </div>
                                                <div style={{ fontWeight: 1000 }}>
                                                    R$ {money(nMoney(i.price) * i.qty)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={dividerStyle} />

                                    <div style={summaryLineStyle}>
                                        <div style={{ color: "rgba(255,255,255,.7)", fontWeight: 800 }}>Subtotal</div>
                                        <div style={{ fontWeight: 1000 }}>R$ {money(subtotal)}</div>
                                    </div>

                                    <div style={{ marginTop: 10, color: "rgba(255,255,255,.65)", fontSize: 12, fontWeight: 700 }}>
                                        Frete será calculado no checkout.
                                    </div>

                                    <button
                                        onClick={() => navigate("/checkout")}
                                        style={{ ...btnStyle, ...btnPrimaryStyle, width: "100%", marginTop: 14 }}
                                    >
                                        Ir para o checkout
                                    </button>

                                    <button
                                        onClick={() => clearCart()}
                                        style={{ ...btnStyle, ...btnGhostStyle, width: "100%", marginTop: 10 }}
                                    >
                                        Limpar carrinho
                                    </button>
                                </div>

                                <div style={{ marginTop: 12 }}>
                                    <Link to="/" style={ghostLinkStyle}>
                                        Continuar comprando →
                                    </Link>
                                </div>
                            </div>
                        </div>
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

const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 18, alignItems: "start" };

const emptyCardStyle: React.CSSProperties = { background: "#141824", border: "1px solid #252a3a", borderRadius: 14, padding: 16 };

const itemCardStyle: React.CSSProperties = { background: "#141824", border: "1px solid #252a3a", borderRadius: 14, padding: 14 };
const thumbStyle: React.CSSProperties = { width: 72, height: 72, borderRadius: 12, overflow: "hidden", border: "1px solid #252a3a", background: "#0e111a", flexShrink: 0 };
const itemNameStyle: React.CSSProperties = { fontWeight: 1000, letterSpacing: 0.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const metaStyle: React.CSSProperties = { marginTop: 4, color: "rgba(255,255,255,.65)", fontSize: 12, fontWeight: 800 };
const miniLinkStyle: React.CSSProperties = { color: "rgba(255,255,255,.85)", fontWeight: 900, textDecoration: "none" };

const itemBottomRowStyle: React.CSSProperties = { marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" };

const rightColStyle: React.CSSProperties = {};
const summaryStickyStyle: React.CSSProperties = { position: "sticky", top: 92 };
const summaryCardStyle: React.CSSProperties = { background: "#141824", border: "1px solid #252a3a", borderRadius: 14, padding: 16 };

const miniTitleStyle: React.CSSProperties = { fontWeight: 1000, letterSpacing: 2, fontSize: 12, color: "rgba(255,255,255,.65)" };
const summaryLineStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 };

const dividerStyle: React.CSSProperties = { height: 1, background: "rgba(255,255,255,.08)", margin: "14px 0" };

const btnStyle: React.CSSProperties = { borderRadius: 12, border: "1px solid rgba(255,255,255,.14)", padding: "12px 14px", fontWeight: 1000, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" };
const btnPrimaryStyle: React.CSSProperties = { background: "#ffffff", color: "#111" };
const btnGhostStyle: React.CSSProperties = { background: "transparent", color: "rgba(255,255,255,.9)" };

const qtyBtnStyle: React.CSSProperties = { width: 34, height: 34, borderRadius: 10, border: "1px solid rgba(255,255,255,.14)", background: "transparent", color: "rgba(255,255,255,.9)", fontWeight: 1000, cursor: "pointer" };
const qtyInputStyle: React.CSSProperties = { width: 54, height: 34, textAlign: "center", borderRadius: 10, border: "1px solid rgba(255,255,255,.14)", background: "#0e111a", color: "#e8eaf0", fontWeight: 900 };