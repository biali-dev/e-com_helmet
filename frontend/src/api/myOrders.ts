import { api } from "./client";

export async function fetchMyOrders() {
    const { data } = await api.get("/my/orders/");
    return data;
}

export async function fetchMyOrder(id: number) {
    const { data } = await api.get(`/my/orders/${id}/`);
    return data;
}

export async function claimGuestOrders(): Promise<{ claimed: number }> {
    const { data } = await api.post("/my/orders/claim/");
    return data;
}