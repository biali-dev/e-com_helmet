import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import { me, logout } from "../api/auth";
import { fetchMyOrders } from "../api/myOrders";

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

type MeUser = {
    id: number;
    username: string;
    email: string;
};

type Order = {
    id: number;
    status: string;
    total: string;
    created_at: string;
};

function formatDateBR(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("pt-BR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
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

    return {
        border: "1px solid rgba(255,255,255,.14)",
        background: "rgba(255,255,255,.06)",
        color: "rgba(255,255,255,.9)",
    };
}

const pillBaseStyle: React.CSSProperties = {
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 1000,
    letterSpacing: 1,
    textTransform: "uppercase",
};

export default function AccountPage() {
    const navigate = useNavigate();

    const [user, setUser] = useState<MeUser | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loadingUser, setLoadingUser] = useState(true);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const ordersCount = useMemo(() => orders.length, [orders]);

    useEffect(() => {
        (async () => {
            try {
                const u = await me();
                setUser(u);
            } catch (err) {
                const e = err as ApiErrorLike;
                const msg =
                    (e.response?.data && safeJson(e.response.data)) ||
                    e.message ||
                    "Erro desconhecido";
                setError(`Falha ao carregar usuário: ${msg}`);
            } finally {
                setLoadingUser(false);
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const list = await fetchMyOrders();
                setOrders(list);
            } catch (err) {
                const e = err as ApiErrorLike;
                const msg =
                    (e.response?.data && safeJson(e.response.data)) ||
                    e.message ||
                    "Erro desconhecido";
                setError(`Falha ao carregar pedidos: ${msg}`);
            } finally {
                setLoadingOrders(false);
            }
        })();
    }, []);

    function handleLogout() {
        logout();
        navigate("/");
        window.dispatchEvent(new Event("auth:updated"));
    }

    return (
        <div style={pageStyle}>
            <TopBar />

            <div style={wrapStyle}>
                <div style={titleRowStyle}>
                    <div>
                        <div style={kickerStyle}>Minha conta</div>
                        <h1 style={h1Style}>PERFIL</h1>
                        <div style={subTitleStyle}>Seus dados e histórico de pedidos.</div>
                    </div>

                    <button onClick={handleLogout} style={{ ...btnStyle, ...btnGhostStyle }}>
                        Sair
                    </button>
                </div>

                {error && <div style={errorStyle}>{error}</div>}

                {/* PERFIL */}
                <div style={cardStyle}>
                    <div style={miniTitleStyle}>DADOS DO USUÁRIO</div>

                    {loadingUser ? (
                        <div style={{ marginTop: 12, color: "rgba(255,255,255,.75)" }}>
                            Carregando…
                        </div>
                    ) : user ? (
                        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                            <Line label="ID" value={String(user.id)} />
                            <Line label="Usuário" value={user.username || "—"} />
                            <Line label="E-mail" value={user.email || "—"} />
                        </div>
                    ) : (
                        <div style={{ marginTop: 12, color: "rgba(255,255,255,.75)" }}>
                            Não foi possível carregar seus dados.
                        </div>
                    )}

                    <div style={microcopyStyle}>
                        Pedidos feitos logado aparecem automaticamente aqui. Pedidos guest podem ser vinculados após login.
                    </div>
                </div>

                {/* PEDIDOS */}
                <div style={{ marginTop: 16 }}>
                    <div style={sectionTitleRowStyle}>
                        <div>
                            <div style={kickerStyle}>Meus pedidos</div>
                            <h2 style={h2Style}>HISTÓRICO</h2>
                        </div>

                        <div style={{ color: "rgba(255,255,255,.7)", fontWeight: 800, fontSize: 12 }}>
                            {loadingOrders ? "…" : `${ordersCount} pedidos`}
                        </div>
                    </div>

                    {loadingOrders ? (
                        <div style={{ color: "rgba(255,255,255,.75)" }}>Carregando pedidos…</div>
                    ) : orders.length === 0 ? (
                        <div style={emptyCardStyle}>
                            <div style={{ fontWeight: 1000, fontSize: 18 }}>Nenhum pedido ainda.</div>
                            <div style={{ marginTop: 8, color: "rgba(255,255,255,.75)" }}>
                                Volte para a loja e finalize sua primeira compra.
                            </div>
                            <div style={{ marginTop: 12 }}>
                                <Link to="/" style={linkStyle}>Ir para a loja →</Link>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gap: 12 }}>
                            {orders.map((o) => (
                                <Link key={o.id} to={`/conta/pedidos/${o.id}`} style={orderCardStyle}>
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                                        <div style={{ fontWeight: 1000 }}>Pedido #{o.id}</div>

                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <span style={{ ...pillBaseStyle, ...statusPillStyle(o.status) }}>
                                                {statusLabel(o.status)}
                                            </span>
                                            <div style={{ fontWeight: 1000 }}>R$ {o.total}</div>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: 6, color: "rgba(255,255,255,.75)", fontSize: 12, fontWeight: 800 }}>
                                        {formatDateBR(o.created_at)}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Line({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
            <div style={{ color: "rgba(255,255,255,.7)", fontWeight: 900 }}>{label}</div>
            <div style={{ fontWeight: 1000, textAlign: "right" }}>{value}</div>
        </div>
    );
}

/* styles (mesmo “DNA” do site) */
const pageStyle: React.CSSProperties = { background: "#0f1115", minHeight: "100vh", color: "#e8eaf0" };
const wrapStyle: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", padding: "26px 20px 50px" };

const titleRowStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 18 };
const kickerStyle: React.CSSProperties = { color: "rgba(255,255,255,.6)", fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", fontSize: 12 };

const h1Style: React.CSSProperties = { margin: "6px 0 0", fontSize: 52, letterSpacing: 1, lineHeight: 1 };
const subTitleStyle: React.CSSProperties = { marginTop: 10, color: "rgba(255,255,255,.75)", fontWeight: 700 };

const cardStyle: React.CSSProperties = { background: "#141824", border: "1px solid #252a3a", borderRadius: 14, padding: 16 };
const miniTitleStyle: React.CSSProperties = { fontWeight: 1000, letterSpacing: 2, fontSize: 12, color: "rgba(255,255,255,.65)" };

const microcopyStyle: React.CSSProperties = { marginTop: 12, color: "rgba(255,255,255,.65)", fontSize: 12, fontWeight: 700, lineHeight: 1.4 };

const sectionTitleRowStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, marginBottom: 12 };
const h2Style: React.CSSProperties = { margin: "6px 0 0", fontSize: 40, letterSpacing: 0.8, lineHeight: 1, fontWeight: 1000 };

const orderCardStyle: React.CSSProperties = {
    background: "#141824",
    border: "1px solid #252a3a",
    borderRadius: 14,
    padding: 14,
    color: "#e8eaf0",
    textDecoration: "none",
};

const emptyCardStyle: React.CSSProperties = { background: "#141824", border: "1px solid #252a3a", borderRadius: 14, padding: 16 };

const btnStyle: React.CSSProperties = { borderRadius: 12, border: "1px solid rgba(255,255,255,.14)", padding: "12px 14px", fontWeight: 1000, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" };
const btnGhostStyle: React.CSSProperties = { background: "transparent", color: "rgba(255,255,255,.9)" };

const linkStyle: React.CSSProperties = { color: "rgba(255,255,255,.85)", fontWeight: 900, textDecoration: "none" };

const errorStyle: React.CSSProperties = {
    border: "1px solid rgba(255,92,119,.35)",
    background: "rgba(255,92,119,.12)",
    color: "#ff5c77",
    padding: 12,
    borderRadius: 12,
    fontWeight: 800,
    marginBottom: 12,
};