// frontend/src/api/payments.ts
import { api } from "./client";

export type PaymentMethod = "pix" | "card";
export type PaymentProvider = "dummy" | "mercado_pago";

export type Payment = {
    id: number;
    order: number;
    provider: string;
    method: PaymentMethod;
    status: "created" | "pending" | "paid" | "failed" | "canceled" | "refunded";
    amount: string;

    pix_qr_code: string;
    pix_qr_code_base64: string;
    pix_expires_at: string | null;

    created_at: string;
};

export type CardCreatePayload = {
    token: string;
    payment_method_id: string;
    installments: number;
    issuer_id?: string;
};

export async function createPayment(
    orderId: number,
    method: PaymentMethod,
    provider: PaymentProvider,
    card?: CardCreatePayload
): Promise<Payment> {
    const body: any = {
        order_id: orderId,
        method,
        provider,
    };

    if (card) {
        body.card = {
            token: card.token,
            payment_method_id: card.payment_method_id,
            installments: card.installments,
            issuer_id: card.issuer_id || "",
        };
    }

    const { data } = await api.post<Payment>("/payments/create/", body);
    return data;
}

export async function getPayment(paymentId: number): Promise<Payment> {
    const { data } = await api.get<Payment>(`/payments/${paymentId}/`);
    return data;
}

// Dummy helper: simular pagamento via webhook (somente quando provider=dummy)
export async function simulatePaid(paymentId: number): Promise<void> {
    await api.post("/payments/webhook/dummy/", {
        payment_id: paymentId,
        status: "paid",
    });
}
