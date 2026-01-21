import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";

import "../styles/mobile-ux.css";

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

    const [items, setItems] = useState<CartItem[]>(() => getCart());
    const [summaryOpen, setSummaryOpen] = useState(false);
    const summaryRef = useRef<HTMLDivElement | null>(null);

    // ✅ refresh estável (evita warnings/erros no useEffect)
    const refresh = useCallback(() => {
        setItems(getCart());
    }, []);

    // Escuta alterações do carrinho (evento customizado do cartStore)
    useEffect(() => {
        const handler = () => refresh();
        window.addEventListener("cart:updated", handler);
        return () => window.removeEventListener("cart:updated", handler);
    }, [refresh]);

    const subtotal = cartTotal();
    const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);

    function openSummaryAndScroll() {
        setSummaryOpen(true);

        setTimeout(() => {
            if (!summaryRef.current) return;
            const y = summaryRef.current.getBoundingClientRect().top + window.scrollY - 92;
            window.scrollTo({ top: y, behavior: "smooth" });
        }, 50);
    }

    return (
        <div style={pageStyle}>
            <TopBar />

            <div style={wrapStyle} className="mobile-bottom-space">
                <div style={titleRowStyle}>
                    <div>
                        <div style={kickerStyle}>Carrinho</div>
                        <h1 style={h1Style}>SEUS ITENS</h1>
                        <div style={subTitleStyle}>
                            Itens: <strong>{totalItems}</strong> • Subtotal: <strong>R$ {money(subtotal)}</strong>
                        </div>
                    </div>

                    <Link to="/" style={backLinkStyle}>
                        ← Voltar à loja
                    </Link>
                </div>

                {/* MOBILE accordion summary */}
                {items.length > 0 && (
                    <div className="mobile-only" style={{ marginTop: 14 }}>
                        <div ref={summaryRef} className="mobile-accordion">
                            <div
                                className="mobile-accordion-header"
                                onClick={() => setSummaryOpen((v) => !v)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") setSummaryOpen((v) => !v);
                                }}
                                role="button"
                                aria-expanded={summaryOpen}
                                tabIndex={0}
                            >
                                <div className="mobile-accordion-title">Resumo</div>
                                <div className="mobile-accordion-value">
                                    R$ {money(subtotal)} {summaryOpen ? "▴" : "▾"}
                                </div>
                            </div>

                            <div className={`mobile-accordion-anim ${summaryOpen ? "open" : ""}`}>
                                <div className="mobile-accordion-body">
                                    <div style={{ display: "grid", gap: 10 }}>
                                        {items.map((i) => (
                                            <div
                                                key={i.productId}
                                                style={{ display: "flex", justifyContent: "space-between", gap: 10 }}
                                            >
                                                <div
                                                    style={{
                                                        color: "rgba(255,255,255,.85)",
                                                        fontWeight: 800,
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                        minWidth: 0,
                                                    }}
                                                    title={i.name}
                                                >
                                                    {i.name} <span style={{ opacity: 0.65 }}>×{i.qty}</span>
                                                </div>
                                                <div style={{ fontWeight: 1000 }}>
                                                    R$ {money(nMoney(i.price) * i.qty)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ height: 1, background: "rgba(255,255,255,.08)", margin: "14px 0" }} />

                                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 1000 }}>
                                        <span style={{ color: "rgba(255,255,255,.7)" }}>Subtotal</span>
                                        <span>R$ {money(subtotal)}</span>
                                    </div>

                                    <div style={{ marginTop: 10, color: "rgba(255,255,255,.65)", fontSize: 12, fontWeight: 700 }}>
                                        Frete calculado no checkout.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {items.length === 0 ? (
                    <div style={emptyWrapStyle}>
                        <div style={emptyCardStyle}>
                            <div style={{ fontWeight: 1000, fontSize: 22 }}>Seu carrinho está vazio.</div>
                            <div style={{ marginTop: 8, color: "rgba(255,255,255,.75)", lineHeight: 1.5 }}>
                                Volte para a loja e escolha um capacete ou acessório.
                            </div>

                            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                                <Link
                                    to="/"
                                    style={{ ...btnStyle, ...btnPrimaryStyle, textDecoration: "none", display: "inline-block" }}
                                >
                                    Ir para a loja
                                </Link>

                                <Link
                                    to="/"
                                    style={{ ...btnStyle, ...btnGhostStyle, textDecoration: "none", display: "inline-block" }}
                                >
                                    Ver destaques
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={gridStyle}>
                        {/* LEFT: items list */}
                        <div style={{ display: "grid", gap: 12 }}>
                            {items.map((i) => {
                                const lineTotal = nMoney(i.price) * i.qty;

                                return (
                                    <div key={i.productId} style={itemCardStyle}>
                                        <div style={itemTopRowStyle}>
                                            <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
                                                <div style={thumbStyle}>
                                                    {i.image ? (
                                                        <img
                                                            src={i.image}
                                                            alt={i.name}
                                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                        />
                                                    ) : (
                                                        <div style={{ width: "100%", height: "100%", background: "#0e111a" }} />
                                                    )}
                                                </div>

                                                <div style={{ minWidth: 0 }}>
                                                    <div style={itemNameStyle}>{i.name}</div>
                                                    <div style={metaStyle}>
                                                        <span>R$ {i.price}</span>
                                                        <span style={{ opacity: 0.45 }}>•</span>
                                                        <Link to={`/produto/${i.slug}`} style={miniLinkStyle}>
                                                            ver produto
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={lineTotalStyle}>R$ {money(lineTotal)}</div>
                                        </div>

                                        <div style={itemBottomRowStyle}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                                <div style={miniTitleStyle}>Quantidade</div>

                                                <div style={qtyWrapStyle}>
                                                    <button
                                                        onClick={() => setQty(i.productId, i.qty - 1)}
                                                        style={qtyBtnStyle}
                                                        aria-label="Diminuir quantidade"
                                                    >
                                                        −
                                                    </button>

                                                    <input
                                                        value={i.qty}
                                                        onChange={(e) => setQty(i.productId, Number(e.target.value || 1))}
                                                        inputMode="numeric"
                                                        style={qtyInputStyle}
                                                        aria-label="Quantidade"
                                                    />

                                                    <button
                                                        onClick={() => setQty(i.productId, i.qty + 1)}
                                                        style={qtyBtnStyle}
                                                        aria-label="Aumentar quantidade"
                                                    >
                                                        +
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={() => removeFromCart(i.productId)}
                                                    style={{ ...btnStyle, ...btnGhostStyle, padding: "10px 12px" }}
                                                >
                                                    Remover
                                                </button>
                                            </div>

                                            <div style={{ color: "rgba(255,255,255,.65)", fontSize: 12, fontWeight: 800 }}>
                                                Frete calculado no checkout
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* RIGHT: summary (desktop only) */}
                        <div style={rightColStyle} className="desktop-only">
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
                                                    title={i.name}
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

                                    <Line label="Subtotal" value={`R$ ${money(subtotal)}`} />
                                    <Line label="Frete" value="—" muted />
                                    <Line label="Total" value={`R$ ${money(subtotal)}`} strong />

                                    <div style={microcopyStyle}>
                                        O frete e o prazo aparecem no checkout, depois do CEP.
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
                                    <Link to="/" style={linkStyle}>
                                        Continuar comprando →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MOBILE sticky bar */}
            {items.length > 0 && (
                <div className="mobile-sticky-bar">
                    <button type="button" onClick={() => navigate("/checkout")} style={mobileStickyPrimaryBtnStyle}>
                        Ir para o checkout • R$ {money(subtotal)}
                    </button>

                    <button type="button" onClick={openSummaryAndScroll} style={mobileStickyGhostBtnStyle}>
                        Resumo
                    </button>
                </div>
            )}
        </div>
    );
}

function Line({
    label,
    value,
    strong,
    muted,
}: {
    label: string;
    value: string;
    strong?: boolean;
    muted?: boolean;
}) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
            <div style={{ color: muted ? "rgba(255,255,255,.6)" : "rgba(255,255,255,.7)", fontWeight: 900 }}>
                {label}
            </div>
            <div style={{ fontWeight: strong ? 1000 : 900, fontSize: strong ? 18 : 14 }}>
                {value}
            </div>
        </div>
    );
}

/* ------------------ styles ------------------ */

const pageStyle: React.CSSProperties = { background: "#0f1115", minHeight: "100vh", color: "#e8eaf0" };
const wrapStyle: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", padding: "26px 20px 50px" };

const titleRowStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 18 };
const kickerStyle: React.CSSProperties = { color: "rgba(255,255,255,.6)", fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", fontSize: 12 };
const h1Style: React.CSSProperties = { margin: "6px 0 0", fontSize: 52, letterSpacing: 1, lineHeight: 1 };
const subTitleStyle: React.CSSProperties = { marginTop: 10, color: "rgba(255,255,255,.75)", fontWeight: 700 };
const backLinkStyle: React.CSSProperties = { color: "rgba(255,255,255,.85)", fontWeight: 900, textDecoration: "none", marginTop: 10, whiteSpace: "nowrap" };

const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 18, alignItems: "start" };

const itemCardStyle: React.CSSProperties = { background: "#141824", border: "1px solid #252a3a", borderRadius: 14, padding: 14 };
const itemTopRowStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" };

const thumbStyle: React.CSSProperties = { width: 72, height: 72, borderRadius: 12, overflow: "hidden", border: "1px solid #252a3a", background: "#0e111a", flexShrink: 0 };

const itemNameStyle: React.CSSProperties = { fontWeight: 1000, letterSpacing: 0.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 520 };

const metaStyle: React.CSSProperties = { marginTop: 4, color: "rgba(255,255,255,.65)", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", gap: 10 };

const miniLinkStyle: React.CSSProperties = { color: "rgba(255,255,255,.85)", fontWeight: 900, textDecoration: "none" };

const lineTotalStyle: React.CSSProperties = { fontWeight: 1000, fontSize: 16, whiteSpace: "nowrap" };

const itemBottomRowStyle: React.CSSProperties = { marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" };

const qtyWrapStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8 };

const qtyBtnStyle: React.CSSProperties = { width: 34, height: 34, borderRadius: 10, border: "1px solid rgba(255,255,255,.14)", background: "transparent", color: "rgba(255,255,255,.9)", fontWeight: 1000, cursor: "pointer" };

const qtyInputStyle: React.CSSProperties = { width: 54, height: 34, textAlign: "center", borderRadius: 10, border: "1px solid rgba(255,255,255,.14)", background: "#0e111a", color: "#e8eaf0", fontWeight: 900 };

const rightColStyle: React.CSSProperties = {};
const summaryStickyStyle: React.CSSProperties = { position: "sticky", top: 92 };

const summaryCardStyle: React.CSSProperties = { background: "#141824", border: "1px solid #252a3a", borderRadius: 14, padding: 16 };

const miniTitleStyle: React.CSSProperties = { fontWeight: 1000, letterSpacing: 2, fontSize: 12, color: "rgba(255,255,255,.65)", textTransform: "uppercase" };

const summaryLineStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 };

const dividerStyle: React.CSSProperties = { height: 1, background: "rgba(255,255,255,.08)", margin: "14px 0" };

const microcopyStyle: React.CSSProperties = { marginTop: 10, color: "rgba(255,255,255,.65)", fontSize: 12, fontWeight: 700, lineHeight: 1.4 };

const btnStyle: React.CSSProperties = { borderRadius: 12, border: "1px solid rgba(255,255,255,.14)", padding: "12px 14px", fontWeight: 1000, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" };

const btnPrimaryStyle: React.CSSProperties = { background: "#ffffff", color: "#111" };
const btnGhostStyle: React.CSSProperties = { background: "transparent", color: "rgba(255,255,255,.9)" };

const linkStyle: React.CSSProperties = { color: "rgba(255,255,255,.85)", fontWeight: 900, textDecoration: "none" };

const emptyWrapStyle: React.CSSProperties = { display: "grid", placeItems: "start" };
const emptyCardStyle: React.CSSProperties = { background: "#141824", border: "1px solid #252a3a", borderRadius: 14, padding: 18, maxWidth: 720 };

const mobileStickyPrimaryBtnStyle: React.CSSProperties = {
    flex: 1,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,.14)",
    padding: "12px 14px",
    fontWeight: 1000,
    letterSpacing: 1,
    textTransform: "uppercase",
    cursor: "pointer",
    background: "#ffffff",
    color: "#111",
};

const mobileStickyGhostBtnStyle: React.CSSProperties = {
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,.14)",
    padding: "12px 14px",
    fontWeight: 1000,
    letterSpacing: 1,
    textTransform: "uppercase",
    cursor: "pointer",
    background: "transparent",
    color: "rgba(255,255,255,.9)",
};