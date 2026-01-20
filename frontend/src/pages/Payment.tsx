import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import TopBar from "../components/TopBar";
import { getPayment, simulatePaid } from "../api/payments";
import type { Payment } from "../api/payments";

type ApiErrorLike = {
    response?: { data?: unknown };
    message?: string;
};

export default function PaymentPage() {
    const { paymentId } = useParams<{ paymentId: string }>();
    const id = Number(paymentId);

    const [payment, setPayment] = useState<Payment | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    async function refresh() {
        try {
            const data = await getPayment(id);
            setPayment(data);
        } catch (e) {
            const ee = e as ApiErrorLike;
            const detail =
                (ee.response?.data && JSON.stringify(ee.response.data)) ||
                ee.message ||
                "Erro desconhecido";
            setErr(`Não foi possível carregar o pagamento: ${detail}`);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!id) return;
        refresh();
        const t = setInterval(refresh, 2500);
        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const isPaid = payment?.status === "paid";
    const isPix = payment?.method === "pix";
    const canSimulate = payment?.provider === "dummy";

    const qrBase64 = payment?.pix_qr_code_base64?.trim() || "";
    const qrText = payment?.pix_qr_code?.trim() || "";

    return (
        <div style={pageStyle}>
            <TopBar />

            <div style={wrapStyle}>
                <div style={titleRowStyle}>
                    <div>
                        <div style={kickerStyle}>Pagamento</div>
                        <h1 style={h1Style}>CONFIRMAÇÃO</h1>
                        <div style={subTitleStyle}>
                            Acompanhe o status do seu pagamento.
                        </div>
                    </div>

                    <Link to="/" style={ghostLinkStyle}>← Voltar à loja</Link>
                </div>

                {loading && <div style={{ color: "rgba(255,255,255,.75)" }}>Carregando...</div>}
                {err && <div style={errorStyle}>{err}</div>}

                {payment && (
                    <div style={gridStyle}>
                        {/* LEFT */}
                        <div style={{ display: "grid", gap: 12 }}>
                            <div style={cardStyle}>
                                <div style={miniTitleStyle}>DETALHES</div>

                                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                                    <Line label="Pedido" value={`#${payment.order}`} />
                                    <Line label="Provider" value={payment.provider} />
                                    <Line label="Método" value={payment.method.toUpperCase()} />
                                    <Line label="Status" value={payment.status} />
                                    <Line label="Valor" value={`R$ ${payment.amount}`} strong />
                                </div>
                            </div>

                            {isPaid ? (
                                <div style={successStyle}>
                                    ✅ Pagamento confirmado! Seu pedido foi marcado como pago.
                                </div>
                            ) : (
                                <div style={cardStyle}>
                                    <div style={miniTitleStyle}>AÇÕES</div>

                                    <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                                        <button onClick={refresh} style={{ ...btnStyle, ...btnGhostStyle }}>
                                            Atualizar status
                                        </button>

                                        {canSimulate && (
                                            <button
                                                onClick={async () => {
                                                    await simulatePaid(payment.id);
                                                    await refresh();
                                                }}
                                                style={{ ...btnStyle, ...btnPrimaryStyle }}
                                            >
                                                Simular pago (dummy)
                                            </button>
                                        )}
                                    </div>

                                    <div style={{ marginTop: 10, color: "rgba(255,255,255,.65)", fontSize: 12, fontWeight: 700 }}>
                                        Em produção, o status vem automaticamente via webhook.
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT */}
                        <div style={rightColStyle}>
                            <div style={summaryStickyStyle}>
                                <div style={cardStyle}>
                                    <div style={miniTitleStyle}>PAGAMENTO</div>

                                    {!isPix ? (
                                        <div style={{ marginTop: 12, color: "rgba(255,255,255,.8)", lineHeight: 1.5 }}>
                                            Para cartão, a autorização pode levar alguns instantes. Aguarde o status atualizar.
                                        </div>
                                    ) : (
                                        <div style={{ marginTop: 12 }}>
                                            <div style={{ color: "rgba(255,255,255,.8)", lineHeight: 1.5 }}>
                                                Escaneie o QR Code ou use o “copia e cola”.
                                            </div>

                                            {qrBase64 ? (
                                                <img
                                                    alt="QR Code Pix"
                                                    src={`data:image/png;base64,${qrBase64}`}
                                                    style={qrStyle}
                                                />
                                            ) : (
                                                <div style={{ marginTop: 10, color: "rgba(255,255,255,.65)", fontSize: 12 }}>
                                                    QR não disponível. Use o copia e cola abaixo.
                                                </div>
                                            )}

                                            {qrText ? (
                                                <>
                                                    <div style={{ marginTop: 12, ...miniTitleStyle }}>COPIA E COLA</div>
                                                    <textarea readOnly value={qrText} style={textAreaStyle} />

                                                    <button
                                                        onClick={async () => {
                                                            await navigator.clipboard.writeText(qrText);
                                                            alert("Código Pix copiado!");
                                                        }}
                                                        style={{ ...btnStyle, ...btnPrimaryStyle, width: "100%", marginTop: 10 }}
                                                    >
                                                        Copiar
                                                    </button>
                                                </>
                                            ) : null}
                                        </div>
                                    )}
                                </div>

                                <div style={{ marginTop: 12 }}>
                                    <Link to="/" style={ghostLinkStyle}>Continuar comprando →</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
            <div style={{ color: "rgba(255,255,255,.7)", fontWeight: 800 }}>{label}</div>
            <div style={{ fontWeight: strong ? 1000 : 900, fontSize: strong ? 18 : 14 }}>{value}</div>
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

const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 18, alignItems: "start" };

const cardStyle: React.CSSProperties = { background: "#141824", border: "1px solid #252a3a", borderRadius: 14, padding: 16 };
const rightColStyle: React.CSSProperties = {};
const summaryStickyStyle: React.CSSProperties = { position: "sticky", top: 92 };

const miniTitleStyle: React.CSSProperties = { fontWeight: 1000, letterSpacing: 2, fontSize: 12, color: "rgba(255,255,255,.65)" };

const btnStyle: React.CSSProperties = { borderRadius: 12, border: "1px solid rgba(255,255,255,.14)", padding: "12px 14px", fontWeight: 1000, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" };
const btnPrimaryStyle: React.CSSProperties = { background: "#ffffff", color: "#111" };
const btnGhostStyle: React.CSSProperties = { background: "transparent", color: "rgba(255,255,255,.9)" };

const qrStyle: React.CSSProperties = { marginTop: 12, width: 280, height: 280, objectFit: "contain", borderRadius: 12, border: "1px solid #252a3a", background: "#0e111a" };

const textAreaStyle: React.CSSProperties = {
    width: "100%",
    minHeight: 100,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,.14)",
    background: "#0e111a",
    color: "#e8eaf0",
    fontWeight: 700,
};

const successStyle: React.CSSProperties = {
    border: "1px solid rgba(0,255,140,.25)",
    background: "rgba(0,255,140,.08)",
    color: "rgba(220,255,235,.95)",
    padding: 14,
    borderRadius: 14,
    fontWeight: 900,
};

const errorStyle: React.CSSProperties = {
    marginTop: 12,
    border: "1px solid rgba(255,92,119,.35)",
    background: "rgba(255,92,119,.12)",
    color: "#ff5c77",
    padding: 12,
    borderRadius: 12,
    fontWeight: 800,
};