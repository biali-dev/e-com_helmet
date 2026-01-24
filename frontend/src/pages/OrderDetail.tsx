import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import TopBar from "../components/TopBar";
import { fetchMyOrder } from "../api/myOrders";
import { payNowForMyOrder } from "../api/payNow";

type ApiErrorLike = {
    response?: { data?: unknown };
    message?: string;
};

function safeJson(v: unknown) {
    try {
        return JSON.stringify(v);
    } catch {
        return "Erro desconhecido";
    }
}

type OrderItem = {
    product_id: number;
    name: string;
    price: string;
    qty: number;
};

type OrderDetail = {
    id: number;
    status: string;

    subtotal: string;
    shipping_price: string;
    total: string;

    shipping_method: string;
    shipping_days: number;

    shipping_zip: string;
    shipping_street: string;
    shipping_number: string;
    shipping_complement: string;
    shipping_district: string;
    shipping_city: string;
    shipping_state: string;

    created_at: string;

    items: OrderItem[];
};

function money(v: string | number) {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n.toFixed(2) : String(v);
}

function statusLabel(status: string) {
    const s = (status || "").toLowerCase();
    if (s === "paid") return "Pago";
    if (s === "awaiting_payment") return "Aguardando pagamento";
    if (s === "canceled") return "Cancelado";
    return status;
}

function statusPillStyle(status: string): React.CSSProperties {
    const s = (status || "").toLowerCase();
    if (s === "paid") {
        return {
            border: "1px solid rgba(0,255,140,.25)",
            background: "rgba(0,255,140,.08)",
            color: "rgba(220,255,235,.95)",
        };
    }
    if (s === "canceled") {
        return {
            border: "1px solid rgba(255,92,119,.35)",
            background: "rgba(255,92,119,.12)",
            color: "#ff5c77",
        };
    }
    // awaiting_payment / default
    return {
        border: "1px solid rgba(255,255,255,.14)",
        background: "rgba(255,255,255,.06)",
        color: "rgba(255,255,255,.9)",
    };
}

export default function OrderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const orderId = Number(id);

    const navigate = useNavigate();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [payLoading, setPayLoading] = useState(false);
    const [payError, setPayError] = useState<string | null>(null);

    useEffect(() => {
        if (!orderId) {
            setErr("ID de pedido inválido.");
            setLoading(false);
            return;
        }

        (async () => {
            try {
                const data = await fetchMyOrder(orderId);
                setOrder(data as OrderDetail);
                setErr(null);
            } catch (e) {
                const ee = e as ApiErrorLike;
                const msg =
                    (ee.response?.data && safeJson(ee.response.data)) ||
                    ee.message ||
                    "Erro desconhecido";
                setErr(`Não foi possível carregar o pedido: ${msg}`);
            } finally {
                setLoading(false);
            }
        })();
    }, [orderId]);

    const itemsCount = useMemo(() => {
        return order?.items?.reduce((s, it) => s + (it.qty || 0), 0) ?? 0;
    }, [order]);

    async function handlePayNow() {
        if (!order) return;

        setPayError(null);
        setPayLoading(true);

        try {
            const payment = await payNowForMyOrder(order.id, "mercado_pago", "pix");
            navigate(`/pagamento/${payment.id}`);
        } catch {
            setPayError("Não foi possível iniciar o pagamento. Tente novamente.");
        } finally {
            setPayLoading(false);
        }
    }

    return (
        <div style={pageStyle}>
            <TopBar />

            <div style={wrapStyle}>
                <div style={titleRowStyle}>
                    <div>
                        <div style={kickerStyle}>Minha conta</div>
                        <h1 style={h1Style}>PEDIDO</h1>
                        <div style={subTitleStyle}>
                            Detalhes do seu pedido e endereço de entrega.
                        </div>
                    </div>

                    <Link to="/conta" style={backLinkStyle}>
                        ← Voltar para meus pedidos
                    </Link>
                </div>

                {loading && (
                    <div style={cardStyle}>
                        <div style={{ color: "rgba(255,255,255,.75)" }}>Carregando…</div>
                    </div>
                )}

                {err && <div style={errorStyle}>{err}</div>}

                {!loading && !err && order && (
                    <div style={gridStyle}>
                        {/* LEFT: detalhes */}
                        <div style={{ display: "grid", gap: 12 }}>
                            {/* Header do pedido */}
                            <div style={cardStyle}>
                                <div style={miniTitleStyle}>INFORMAÇÕES</div>

                                <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                                    <div>
                                        <div style={{ fontWeight: 1000, fontSize: 22 }}>Pedido #{order.id}</div>
                                        <div style={{ marginTop: 6, color: "rgba(255,255,255,.7)", fontSize: 12, fontWeight: 800 }}>
                                            Criado em: {order.created_at}
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <span style={{ ...pillStyle, ...statusPillStyle(order.status) }}>
                                            {statusLabel(order.status)}
                                        </span>
                                        <span style={pillStyle}>Itens: {itemsCount}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Itens */}
                            <div style={cardStyle}>
                                <div style={miniTitleStyle}>ITENS</div>

                                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                                    {order.items.map((it) => (
                                        <div key={`${it.product_id}-${it.name}`} style={itemRowStyle}>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontWeight: 1000, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                    {it.name}
                                                </div>
                                                <div style={{ marginTop: 4, color: "rgba(255,255,255,.65)", fontSize: 12, fontWeight: 800 }}>
                                                    {it.qty} × R$ {it.price}
                                                </div>
                                            </div>

                                            <div style={{ fontWeight: 1000, whiteSpace: "nowrap" }}>
                                                R$ {money(Number(it.price) * it.qty)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Endereço */}
                            <div style={cardStyle}>
                                <div style={miniTitleStyle}>ENTREGA</div>

                                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                                    <Line label="CEP" value={order.shipping_zip || "—"} />
                                    <Line
                                        label="Endereço"
                                        value={`${order.shipping_street || ""}, ${order.shipping_number || ""}${order.shipping_complement ? ` - ${order.shipping_complement}` : ""}`}
                                    />
                                    <Line label="Bairro" value={order.shipping_district || "—"} />
                                    <Line label="Cidade/UF" value={`${order.shipping_city || "—"} - ${order.shipping_state || "--"}`} />
                                    <Line
                                        label="Frete"
                                        value={`${order.shipping_method || "—"} • ${order.shipping_days ?? 0} dias`}
                                    />
                                </div>

                                <div style={microcopyStyle}>
                                    O rastreio e o status de envio aparecerão aqui quando o pedido for despachado.
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: resumo sticky */}
                        <div style={rightColStyle}>
                            <div style={stickyStyle}>
                                <div style={cardStyle}>
                                    <div style={miniTitleStyle}>RESUMO</div>

                                    <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                                        <Line label="Subtotal" value={`R$ ${order.subtotal}`} />
                                        <Line label="Frete" value={`R$ ${order.shipping_price}`} />
                                        <Line label="Total" value={`R$ ${order.total}`} strong />
                                    </div>

                                    <div style={dividerStyle} />

                                    <div style={{ display: "grid", gap: 10 }}>
                                        <Link
                                            to="/"
                                            style={{ ...btnStyle, ...btnPrimaryStyle, textDecoration: "none", textAlign: "center" }}
                                        >
                                            Continuar comprando
                                        </Link>

                                        {String(order.status).toLowerCase() === "awaiting_payment" && (
                                            <>
                                                {payError && <div style={errorMiniStyle}>{payError}</div>}

                                                <button
                                                    onClick={handlePayNow}
                                                    disabled={payLoading}
                                                    style={{ ...btnStyle, ...btnGhostStyle }}
                                                >
                                                    {payLoading ? "Iniciando..." : "Pagar agora (Pix)"}
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    <div style={microcopyStyle}>
                                        Status de pagamento ficará automático quando finalizarmos o webhook.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!loading && !err && !order && (
                    <div style={cardStyle}>
                        <div style={{ color: "rgba(255,255,255,.75)" }}>Pedido não encontrado.</div>
                    </div>
                )}
            </div>
        </div>
    );
}

function Line({
    label,
    value,
    strong,
}: {
    label: string;
    value: string;
    strong?: boolean;
}) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
            <div style={{ color: "rgba(255,255,255,.7)", fontWeight: 900 }}>{label}</div>
            <div style={{ fontWeight: strong ? 1000 : 900, textAlign: "right" }}>{value}</div>
        </div>
    );
}

/* ------------------ styles (mesmo “DNA” do site) ------------------ */

const pageStyle: React.CSSProperties = { background: "#0f1115", minHeight: "100vh", color: "#e8eaf0" };
const wrapStyle: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", padding: "26px 20px 50px" };

const titleRowStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 18 };
const kickerStyle: React.CSSProperties = { color: "rgba(255,255,255,.6)", fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", fontSize: 12 };
const h1Style: React.CSSProperties = { margin: "6px 0 0", fontSize: 52, letterSpacing: 1, lineHeight: 1 };
const subTitleStyle: React.CSSProperties = { marginTop: 10, color: "rgba(255,255,255,.75)", fontWeight: 700 };
const backLinkStyle: React.CSSProperties = { color: "rgba(255,255,255,.85)", fontWeight: 900, textDecoration: "none", marginTop: 10, whiteSpace: "nowrap" };

const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 18, alignItems: "start" };

const rightColStyle: React.CSSProperties = {};
const stickyStyle: React.CSSProperties = { position: "sticky", top: 92 };

const cardStyle: React.CSSProperties = { background: "#141824", border: "1px solid #252a3a", borderRadius: 14, padding: 16 };
const miniTitleStyle: React.CSSProperties = { fontWeight: 1000, letterSpacing: 2, fontSize: 12, color: "rgba(255,255,255,.65)" };

const pillStyle: React.CSSProperties = {
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 1000,
    letterSpacing: 1,
    textTransform: "uppercase",
};

const itemRowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    border: "1px solid rgba(255,255,255,.10)",
    background: "rgba(255,255,255,.04)",
    borderRadius: 12,
    padding: 12,
};

const dividerStyle: React.CSSProperties = { height: 1, background: "rgba(255,255,255,.08)", margin: "14px 0" };

const microcopyStyle: React.CSSProperties = { marginTop: 12, color: "rgba(255,255,255,.65)", fontSize: 12, fontWeight: 700, lineHeight: 1.4 };

const btnStyle: React.CSSProperties = { borderRadius: 12, border: "1px solid rgba(255,255,255,.14)", padding: "12px 14px", fontWeight: 1000, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" };
const btnPrimaryStyle: React.CSSProperties = { background: "#ffffff", color: "#111" };
const btnGhostStyle: React.CSSProperties = { background: "transparent", color: "rgba(255,255,255,.9)" };

const errorStyle: React.CSSProperties = {
    border: "1px solid rgba(255,92,119,.35)",
    background: "rgba(255,92,119,.12)",
    color: "#ff5c77",
    padding: 12,
    borderRadius: 12,
    fontWeight: 800,
};

const errorMiniStyle: React.CSSProperties = {
    border: "1px solid rgba(255,92,119,.35)",
    background: "rgba(255,92,119,.12)",
    color: "#ff5c77",
    padding: 10,
    borderRadius: 12,
    fontWeight: 800,
    fontSize: 12,
};