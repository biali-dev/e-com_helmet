import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import TopBar from "../components/TopBar";
import { fetchMyOrder } from "../api/myOrders";

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

export default function OrderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        fetchMyOrder(Number(id))
            .then((data) => setOrder(data as OrderDetail))
            .catch(() => setError("Não foi possível carregar o pedido."));
    }, [id]);

    return (
        <div style={pageStyle}>
            <TopBar />

            <div style={wrapStyle}>
                <Link to="/conta" style={backLinkStyle}>← Voltar</Link>

                {!order && !error && <div style={{ marginTop: 12, opacity: 0.8 }}>Carregando...</div>}
                {error && <div style={errorStyle}>{error}</div>}

                {order && (
                    <>
                        <div style={{ marginTop: 12 }}>
                            <div style={kickerStyle}>Pedido</div>
                            <h1 style={h1Style}>#{order.id}</h1>
                            <div style={subTitleStyle}>
                                Status: <strong>{order.status}</strong> • Total: <strong>R$ {order.total}</strong>
                            </div>
                        </div>

                        <div style={gridStyle}>
                            {/* LEFT: itens */}
                            <div style={{ display: "grid", gap: 12 }}>
                                <div style={cardStyle}>
                                    <div style={miniTitleStyle}>ITENS</div>

                                    <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                                        {order.items.map((i) => (
                                            <div key={`${i.product_id}-${i.name}`} style={rowStyle}>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontWeight: 1000, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {i.name}
                                                    </div>
                                                    <div style={{ color: "rgba(255,255,255,.65)", fontSize: 12, fontWeight: 800 }}>
                                                        Qtd: {i.qty} • R$ {i.price}
                                                    </div>
                                                </div>

                                                <div style={{ fontWeight: 1000, whiteSpace: "nowrap" }}>
                                                    R$ {(Number(i.price) * i.qty).toFixed(2)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={dividerStyle} />

                                    <Line label="Subtotal" value={`R$ ${order.subtotal}`} />
                                    <Line label="Frete" value={`R$ ${order.shipping_price}`} />
                                    <Line label="Total" value={`R$ ${order.total}`} strong />
                                </div>
                            </div>

                            {/* RIGHT: entrega */}
                            <div style={{ display: "grid", gap: 12 }}>
                                <div style={cardStyle}>
                                    <div style={miniTitleStyle}>ENTREGA</div>

                                    <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                                        <Line label="Método" value={order.shipping_method} />
                                        <Line label="Prazo" value={`${order.shipping_days} dias`} />
                                        <Line label="CEP" value={order.shipping_zip} />
                                        <Line
                                            label="Endereço"
                                            value={`${order.shipping_street}, ${order.shipping_number}${order.shipping_complement ? `, ${order.shipping_complement}` : ""}`}
                                        />
                                        <Line label="Bairro" value={order.shipping_district} />
                                        <Line label="Cidade/UF" value={`${order.shipping_city} - ${order.shipping_state}`} />
                                    </div>
                                </div>

                                <div style={cardStyle}>
                                    <div style={miniTitleStyle}>DATA</div>
                                    <div style={{ marginTop: 12, color: "rgba(255,255,255,.85)", fontWeight: 800 }}>
                                        {new Date(order.created_at).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
            <div style={{ color: "rgba(255,255,255,.7)", fontWeight: 900 }}>{label}</div>
            <div style={{ fontWeight: strong ? 1000 : 900, fontSize: strong ? 18 : 14, textAlign: "right" }}>{value}</div>
        </div>
    );
}

/* styles */
const pageStyle: React.CSSProperties = { background: "#0f1115", minHeight: "100vh", color: "#e8eaf0" };
const wrapStyle: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", padding: "26px 20px 50px" };
const backLinkStyle: React.CSSProperties = { color: "rgba(255,255,255,.85)", fontWeight: 900, textDecoration: "none" };

const kickerStyle: React.CSSProperties = { marginTop: 12, color: "rgba(255,255,255,.6)", fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", fontSize: 12 };
const h1Style: React.CSSProperties = { margin: "6px 0 0", fontSize: 52, letterSpacing: 1, lineHeight: 1 };
const subTitleStyle: React.CSSProperties = { marginTop: 10, color: "rgba(255,255,255,.75)", fontWeight: 700 };

const gridStyle: React.CSSProperties = { marginTop: 18, display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 18, alignItems: "start" };

const cardStyle: React.CSSProperties = { background: "#141824", border: "1px solid #252a3a", borderRadius: 14, padding: 16 };
const miniTitleStyle: React.CSSProperties = { fontWeight: 1000, letterSpacing: 2, fontSize: 12, color: "rgba(255,255,255,.65)", textTransform: "uppercase" };

const rowStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 };
const dividerStyle: React.CSSProperties = { height: 1, background: "rgba(255,255,255,.08)", margin: "14px 0" };

const errorStyle: React.CSSProperties = {
    marginTop: 12,
    border: "1px solid rgba(255,92,119,.35)",
    background: "rgba(255,92,119,.12)",
    color: "#ff5c77",
    padding: 12,
    borderRadius: 12,
    fontWeight: 800,
};