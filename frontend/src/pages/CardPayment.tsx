import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { api } from "../api/client";
import { createPayment } from "../api/payments";

// ----- Types locais -----

type OrderPublic = {
    id: number;
    subtotal: string; // "299.00"
    status: string;
    email: string;
    full_name: string;
};

type CardCreatePayload = {
    token: string;
    payment_method_id: string;
    installments: number;
    issuer_id?: string;
};

type BrickFormData = {
    token: string;
    payment_method_id: string;
    installments: number;
    issuer_id?: string;
};

type BrickCallbacks = {
    onReady?: () => void;
    onError?: (error: unknown) => void;
    onSubmit?: (formData: BrickFormData) => Promise<void> | void;
};

type CardPaymentBrickOptions = {
    initialization: { amount: number };
    callbacks: BrickCallbacks;
};

type BricksAPI = {
    create: (
        brickType: "cardPayment",
        containerId: string,
        options: CardPaymentBrickOptions
    ) => Promise<{ unmount?: () => void }>;
};

type MercadoPagoSDK = new (
    publicKey: string,
    opts: { locale: string }
) => { bricks: () => BricksAPI };

declare global {
    interface Window {
        MercadoPago?: MercadoPagoSDK;
    }
}

// ----- Helpers -----

function isBrickFormData(v: unknown): v is BrickFormData {
    if (!v || typeof v !== "object") return false;
    const o = v as Record<string, unknown>;
    return (
        typeof o.token === "string" &&
        typeof o.payment_method_id === "string" &&
        typeof o.installments === "number"
    );
}

function unknownToMessage(e: unknown): string {
    if (typeof e === "string") return e;
    if (e instanceof Error) return e.message;
    try {
        return JSON.stringify(e);
    } catch {
        return "Erro desconhecido";
    }
}

async function getOrder(orderId: number): Promise<OrderPublic> {
    const { data } = await api.get<OrderPublic>(`/orders/${orderId}/`);
    return data;
}

// ----- Component -----

export default function CardPaymentPage() {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const oid = Number(orderId);

    const [order, setOrder] = useState<OrderPublic | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const brickController = useRef<{ unmount?: () => void } | null>(null);

    // 1) Carrega o pedido (para pegar subtotal -> amount)
    useEffect(() => {
        if (!oid) {
            setError("orderId inválido na URL.");
            setLoading(false);
            return;
        }

        (async () => {
            try {
                const o = await getOrder(oid);
                setOrder(o);
            } catch (e) {
                setError(`Não foi possível carregar o pedido: ${unknownToMessage(e)}`);
            } finally {
                setLoading(false);
            }
        })();
    }, [oid]);

    // 2) Monta o Brick quando tiver o pedido
    useEffect(() => {
        if (!order) return;

        const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY as string | undefined;
        if (!publicKey) {
            setError("VITE_MP_PUBLIC_KEY não configurada no frontend.");
            return;
        }

        if (!window.MercadoPago) {
            setError("SDK do Mercado Pago não carregou. Confira o script no index.html.");
            return;
        }

        const amount = Number(order.subtotal);
        if (!Number.isFinite(amount) || amount <= 0) {
            setError("Subtotal inválido para pagamento com cartão.");
            return;
        }

        const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" });

        let cancelled = false;

        (async () => {
            try {
                const bricks = mp.bricks();

                brickController.current = await bricks.create(
                    "cardPayment",
                    "cardPaymentBrick_container",
                    {
                        initialization: { amount },
                        callbacks: {
                            onReady: () => { },
                            onError: (e) => {
                                if (!cancelled) setError(unknownToMessage(e));
                            },
                            onSubmit: async (formDataUnknown) => {
                                if (!isBrickFormData(formDataUnknown)) {
                                    setError("Dados do cartão inválidos retornados pelo Brick.");
                                    return;
                                }

                                setError(null);

                                const card: CardCreatePayload = {
                                    token: formDataUnknown.token,
                                    payment_method_id: formDataUnknown.payment_method_id,
                                    installments: formDataUnknown.installments,
                                    issuer_id: formDataUnknown.issuer_id || "",
                                };

                                try {
                                    const payment = await createPayment(
                                        order.id,
                                        "card",
                                        "mercado_pago",
                                        card
                                    );

                                    // vai para a página de status do pagamento
                                    navigate(`/pagamento/${payment.id}`);
                                } catch (e) {
                                    setError(`Falha ao criar pagamento: ${unknownToMessage(e)}`);
                                }
                            },
                        },
                    }
                );
            } catch (e) {
                if (!cancelled) setError(unknownToMessage(e));
            }
        })();

        return () => {
            cancelled = true;
            try {
                brickController.current?.unmount?.();
            } catch {
                // ignore
            }
            brickController.current = null;
        };
    }, [order, navigate]);

    if (loading) return <div style={{ padding: 24 }}>Carregando...</div>;

    if (error) {
        return (
            <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h1 style={{ margin: 0 }}>Pagamento com cartão</h1>
                    <Link to="/">← Voltar</Link>
                </div>

                <div style={{ marginTop: 12, color: "crimson" }}>{error}</div>
            </div>
        );
    }

    if (!order) {
        return (
            <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
                <h1>Pagamento com cartão</h1>
                <div>Pedido não encontrado.</div>
                <div style={{ marginTop: 12 }}>
                    <Link to="/">← Voltar</Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1 style={{ margin: 0 }}>Pagamento com cartão</h1>
                <Link to="/">← Voltar</Link>
            </div>

            <div style={{ marginTop: 8, opacity: 0.85 }}>
                Pedido #{order.id} • Mercado Pago • Total:{" "}
                <strong>R$ {Number(order.subtotal).toFixed(2)}</strong>
            </div>

            <div id="cardPaymentBrick_container" style={{ marginTop: 16 }} />
        </div>
    );
}
