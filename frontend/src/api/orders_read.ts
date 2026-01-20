import { api } from "./client";

export type OrderPublic = {
    id: number;
    subtotal: string; // "299.00"
    status: string;
    email: string;
    full_name: string;
};

export async function getOrder(orderId: number): Promise<OrderPublic> {
    const { data } = await api.get<OrderPublic>(`/orders/${orderId}/`);
    return data;
}
