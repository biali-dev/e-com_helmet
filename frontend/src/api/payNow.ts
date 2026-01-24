import { api } from "./client";
import type { PaymentMethod, PaymentProvider, Payment } from "./payments";

export async function payNowForMyOrder(
    orderId: number,
    provider: PaymentProvider = "mercado_pago",
    method: PaymentMethod = "pix"
): Promise<Payment> {
    const { data } = await api.post<Payment>(`/my/orders/${orderId}/pay/`, {
        provider,
        method,
    });
    return data;
}