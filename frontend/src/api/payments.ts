import { api } from "./client";

export type PaymentMethod = "pix" | "card";

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

export async function createPayment(orderId: number, method: PaymentMethod): Promise<Payment> {
    const { data } = await api.post<Payment>("/payments/create/", {
        order_id: orderId,
        method,
    });
    return data;
}

export async function getPayment(paymentId: number): Promise<Payment> {
    const { data } = await api.get<Payment>(`/payments/${paymentId}/`);
    return data;
}

// Dummy helper: simular pagamento via webhook
export async function simulatePaid(paymentId: number): Promise<void> {
    await api.post("/payments/webhook/", {
        payment_id: paymentId,
        status: "paid",
    });
}
