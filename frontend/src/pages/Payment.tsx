import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import TopBar from "../components/TopBar";
import { getPayment, simulatePaid } from "../api/payments";
import type { Payment } from "../api/payments";

type ApiErrorLike = {
    response?: { data?: unknown };
    message?: string;
};

function safeJson(v: unknown): string {
    try {
        return JSON.stringify(v);
    } catch {
        return "Erro desconhecido";
    }
}

export default function PaymentPage() {
    const { paymentId } = useParams<{ paymentId: string }>();
    const id = Number(paymentId);

    const [payment, setPayment] = useState<Payment | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const [copied, setCopied] = useState(false);

    async function refresh() {
        try {
            const data = await getPayment(id);
            setPayment(data);
            setErr(null);
        } catch (e) {
            const ee = e as ApiErrorLike;
            const detail =
                (ee.response?.data && safeJson(ee.response.data)) ||
                ee.message ||
                "Erro desconhecido";
            setErr(`Não foi possível carregar o pagamento: ${detail}`);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!id) {
            setErr("paymentId inválido na URL.");
            setLoading(false);
            return;
        }

        refresh();
        const t = setInterval(refresh, 2500);
        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const isPaid = payment?.status === "paid";
    const isFailed = payment?.status === "failed" || payment?.status === "canceled";
    const isPix = payment?.method === "pix";
    const canSimulate = payment?.provider === "dummy";

    const qrBase64 = payment?.pix_qr_code_base64?.trim() || "";
    const qrText = payment?.pix_qr_code?.trim() || "";

    const headerSubtitle = useMemo(() => {
        if (loading) return "Carregando informações do pagamento…";
        if (err) return "Houve um problema ao buscar o pagamento.";
        if (isPaid) return "Pagamento confirmado. Seu pedido está aprovado.";
        if (isFailed) return "Pagamento não concluído. Você pode tentar novamente.";
        return "Aguardando confirmação do pagamento.";
    }, [loading, err, isPaid, isFailed]);

    return (
        <div style={pageStyle}>
            <TopBar />

            <div style={wrapStyle}>
                <div style={titleRowStyle}>
                    <div>
                        <div style={kickerStyle}>Pagamento</div>
                        <h1 style={h1Style}>CONFIRMAÇÃO</h1>
                        <div style={subTitleStyle}>{headerSubtitle}</div>
                    </div>

                    <Link to="/" style={backLinkStyle}>← Voltar à loja</Link>
                </div>

                {loading && (
                    <div style={cardStyle}>
                        <div style={{ color: "rgba(255,255,255,.75)" }}>Carregando…</div>
                    </div>
                )}

                {err && (
                    <div style={errorStyle}>
                        {err}
                        <div style={{ marginTop: 10 }}>
                            <button onClick={refresh} style={{ ...btnStyle, ...btnPrimaryStyle }}>
                                Tentar novamente
                            </button>
                        </div>
                    </div>
                )}

                {!loading && !err && payment && (
                    <div style={gridStyle}>
                        {/* LEFT: status & details */}
                        <div style={{ display: "grid", gap: 12 }}>
                            {/* Status card */}
                            <div
                                style={{
                                    ...cardStyle,
                                    borderColor: isPaid
                                        ? "rgba(0,255,140,.25)"
                                        : isFailed
                                            ? "rgba(255,92,119,.35)"
                                            : "rgba(255,255,255,.12)",
                                    background: isPaid
                                        ? "rgba(0,255,140,.08)"
                                        : isFailed
                                            ? "rgba(255,92,119,.12)"
                                            : "#141824",
                                }}
                            >
                                <div style={miniTitleStyle}>STATUS</div>

                                {isPaid ? (
                                    <div style={statusTitleOkStyle}>✅ Pagamento confirmado</div>
                                ) : isFailed ? (
                                    <div style={statusTitleBadStyle}>❌ Pagamento não concluído</div>
                                ) : (
                                    <div style={statusTitlePendingStyle}>⏳ Aguardando confirmação</div>
                                )}

                                <div style={statusBodyStyle}>
                                    {isPaid
                                        ? "Seu pedido foi marcado como pago e seguirá para separação/envio."
                                        : isFailed
                                            ? "O pagamento foi recusado/cancelado. Você pode tentar novamente no checkout."
                                            : "Se for Pix, a confirmação pode levar alguns instantes após o pagamento."}
                                </div>

                                <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                                    <button onClick={refresh} style={{ ...btnStyle, ...btnGhostStyle }}>
                                        Atualizar status
                                    </button>

                                    {!isPaid && (
                                        <Link to="/checkout" style={{ ...btnStyle, ...btnPrimaryStyle, textDecoration: "none", display: "inline-block" }}>
                                            Ir para o checkout
                                        </Link>
                                    )}

                                    {canSimulate && !isPaid && (
                                        <button
                                            onClick={async () => {
                                                await simulatePaid(payment.id);
                                                await refresh();
                                            }}
                                            style={{ ...btnStyle, ...btnPrimaryStyle }}
                                            title="Somente para o provider dummy"
                                        >
                                            Simular pago (dummy)
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Details card */}
                            <div style={cardStyle}>
                                <div style={miniTitleStyle}>DETALHES</div>

                                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                                    <Line label="Pedido" value={`#${payment.order}`} />
                                    <Line label="Provider" value={payment.provider} />
                                    <Line label="Método" value={payment.method.toUpperCase()} />
                                    <Line label="Status" value={payment.status} />
                                    <Line label="Valor" value={`R$ ${payment.amount}`} strong />
                                </div>

                                <div style={microcopyStyle}>
                                    Em produção, o status muda automaticamente via webhook do Mercado Pago.
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Pix / Card instructions */}
                        <div style={rightColStyle}>
                            <div style={summaryStickyStyle}>
                                <div style={cardStyle}>
                                    <div style={miniTitleStyle}>PAGAMENTO</div>

                                    {!isPix ? (
                                        <div style={{ marginTop: 12, color: "rgba(255,255,255,.82)", lineHeight: 1.55 }}>
                                            <div style={{ fontWeight: 900, marginBottom: 8 }}>
                                                Cartão de crédito
                                            </div>
                                            <div>
                                                A autorização pode levar alguns instantes. Se o status permanecer pendente,
                                                atualize a página ou aguarde a confirmação.
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ marginTop: 12 }}>
                                            <div style={{ color: "rgba(255,255,255,.82)", lineHeight: 1.55 }}>
                                                <div style={{ fontWeight: 900, marginBottom: 6 }}>
                                                    Pix
                                                </div>
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
                                                            setCopied(true);
                                                            setTimeout(() => setCopied(false), 1200);
                                                        }}
                                                        style={{ ...btnStyle, ...btnPrimaryStyle, width: "100%", marginTop: 10 }}
                                                    >
                                                        {copied ? "Copiado ✓" : "Copiar"}
                                                    </button>
                                                </>
                                            ) : (
                                                <div style={{ marginTop: 10, color: "rgba(255,255,255,.65)", fontSize: 12 }}>
                                                    Código “copia e cola” não disponível.
                                                </div>
                                            )}

                                            {payment.pix_expires_at && (
                                                <div style={{ marginTop: 10, color: "rgba(255,255,255,.65)", fontSize: 12 }}>
                                                    Vencimento: {payment.pix_expires_at}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div style={{ marginTop: 12 }}>
                                    <Link to="/" style={linkStyle}>Continuar comprando →</Link>
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
            <div style={{ color: "rgba(255,255,255,.7)", fontWeight: 900 }}>{label}</div>
            <div style={{ fontWeight: strong ? 1000 : 900, fontSize: strong ? 18 : 14 }}>{value}</div>
        </div>
    );
}

/* styles */
const pageStyle: React.CSSProperties = { background: "#0f1115", minHeight: "100vh", color: "#e8eaf0" };
const wrapStyle: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", padding: "26px 20px 50px" };

const titleRowStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 18 };
const kickerStyle: React.CSSProperties = { color: "rgba(255,255,255,.6)", fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", fontSize: 12 };
const h1Style: React.CSSProperties = { margin: "6px 0 0", fontSize: 52, letterSpacing: 1, lineHeight: 1 };
const subTitleStyle: React.CSSProperties = { marginTop: 10, color: "rgba(255,255,255,.75)", fontWeight: 700 };
const backLinkStyle: React.CSSProperties = { color: "rgba(255,255,255,.85)", fontWeight: 900, textDecoration: "none", marginTop: 10, whiteSpace: "nowrap" };

const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 18, alignItems: "start" };

const rightColStyle: React.CSSProperties = {};
const summaryStickyStyle: React.CSSProperties = { position: "sticky", top: 92 };

const cardStyle: React.CSSProperties = { background: "#141824", border: "1px solid rgba(255,255,255,.12)", borderRadius: 14, padding: 16 };

const miniTitleStyle: React.CSSProperties = { fontWeight: 1000, letterSpacing: 2, fontSize: 12, color: "rgba(255,255,255,.65)" };

const statusTitleOkStyle: React.CSSProperties = { marginTop: 12, fontWeight: 1000, fontSize: 22, letterSpacing: 0.2 };
const statusTitlePendingStyle: React.CSSProperties = { marginTop: 12, fontWeight: 1000, fontSize: 22, letterSpacing: 0.2 };
const statusTitleBadStyle: React.CSSProperties = { marginTop: 12, fontWeight: 1000, fontSize: 22, letterSpacing: 0.2 };

const statusBodyStyle: React.CSSProperties = { marginTop: 10, color: "rgba(255,255,255,.82)", lineHeight: 1.5 };

const microcopyStyle: React.CSSProperties = { marginTop: 12, color: "rgba(255,255,255,.65)", fontSize: 12, fontWeight: 700, lineHeight: 1.4 };

const btnStyle: React.CSSProperties = { borderRadius: 12, border: "1px solid rgba(255,255,255,.14)", padding: "12px 14px", fontWeight: 1000, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" };
const btnPrimaryStyle: React.CSSProperties = { background: "#ffffff", color: "#111" };
const btnGhostStyle: React.CSSProperties = { background: "transparent", color: "rgba(255,255,255,.9)" };

const qrStyle: React.CSSProperties = { marginTop: 12, width: 280, height: 280, objectFit: "contain", borderRadius: 12, border: "1px solid rgba(255,255,255,.12)", background: "#0e111a" };

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

const errorStyle: React.CSSProperties = {
    border: "1px solid rgba(255,92,119,.35)",
    background: "rgba(255,92,119,.12)",
    color: "#ff5c77",
    padding: 12,
    borderRadius: 12,
    fontWeight: 800,
};

const linkStyle: React.CSSProperties = { color: "rgba(255,255,255,.85)", fontWeight: 900, textDecoration: "none" };