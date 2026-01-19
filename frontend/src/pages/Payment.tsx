import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPayment, simulatePaid } from "../api/payments";
import type { Payment } from "../api/payments";

export default function PaymentPage() {
    const { paymentId } = useParams<{ paymentId: string }>();
    const id = Number(paymentId);

    const [payment, setPayment] = useState<Payment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function refresh() {
        try {
            const data = await getPayment(id);
            setPayment(data);
        } catch {
            setError("Não foi possível carregar o pagamento.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!id) return;
        refresh();

        // polling simples para atualização de status
        const t = setInterval(refresh, 2000);
        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    if (loading) return <div style={{ padding: 24 }}>Carregando pagamento...</div>;
    if (error) return <div style={{ padding: 24 }}>{error}</div>;
    if (!payment) return <div style={{ padding: 24 }}>Pagamento não encontrado.</div>;

    const isPaid = payment.status === "paid";
    const isPix = payment.method === "pix";
    const canSimulate = payment.provider === "dummy";

    const qrBase64 = payment.pix_qr_code_base64?.trim();
    const qrText = payment.pix_qr_code?.trim();

    return (
        <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1 style={{ margin: 0 }}>Pagamento</h1>
                <Link to="/">← Voltar ao catálogo</Link>
            </div>

            <div style={{ marginTop: 12, border: "1px solid #e0e0e0", borderRadius: 8, padding: 12, background: "#fff" }}>
                <div><strong>Pedido:</strong> #{payment.order}</div>
                <div><strong>Provider:</strong> {payment.provider}</div>
                <div><strong>Método:</strong> {payment.method.toUpperCase()}</div>
                <div><strong>Status:</strong> {payment.status}</div>
                <div><strong>Valor:</strong> R$ {payment.amount}</div>
            </div>

            {isPaid ? (
                <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: "#e8fff0", border: "1px solid #b9f5d0" }}>
                    ✅ Pagamento confirmado! Seu pedido foi marcado como pago.
                </div>
            ) : (
                <div style={{ marginTop: 16 }}>
                    {isPix ? (
                        <div style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 12, background: "#fff" }}>
                            <h2 style={{ marginTop: 0 }}>Pix</h2>
                            <p>Escaneie o QR Code ou use o “copia e cola”.</p>

                            {qrBase64 ? (
                                <img
                                    alt="QR Code Pix"
                                    src={`data:image/png;base64,${qrBase64}`}
                                    style={{ width: 260, height: 260, objectFit: "contain", border: "1px solid #eee", borderRadius: 8 }}
                                />
                            ) : (
                                <div style={{ opacity: 0.7 }}>
                                    QR base64 não disponível (alguns fluxos podem não retornar). Use o copia e cola abaixo.
                                </div>
                            )}

                            {qrText ? (
                                <>
                                    <p style={{ marginTop: 12, marginBottom: 6 }}><strong>Copia e cola:</strong></p>
                                    <textarea
                                        readOnly
                                        value={qrText}
                                        style={{ width: "100%", minHeight: 90, padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
                                    />
                                    <button
                                        onClick={async () => {
                                            await navigator.clipboard.writeText(qrText);
                                            alert("Copia e cola copiado!");
                                        }}
                                        style={{ marginTop: 8, padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", cursor: "pointer", fontWeight: 700 }}
                                    >
                                        Copiar
                                    </button>
                                </>
                            ) : (
                                <div style={{ marginTop: 10, opacity: 0.7 }}>
                                    Cód. Pix (copia e cola) não disponível.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 12, background: "#fff" }}>
                            <h2 style={{ marginTop: 0 }}>Cartão</h2>
                            <p>
                                Integração real de cartão entra no próximo passo (tokenização + criação de pagamento no provider).
                                Por enquanto o status fica “pending”.
                            </p>
                        </div>
                    )}

                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <button
                            onClick={() => refresh()}
                            style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", cursor: "pointer", fontWeight: 700 }}
                        >
                            Atualizar status
                        </button>

                        {canSimulate && (
                            <button
                                onClick={async () => {
                                    await simulatePaid(payment.id);
                                    await refresh();
                                }}
                                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", cursor: "pointer", fontWeight: 800 }}
                            >
                                Simular pago (dummy)
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

