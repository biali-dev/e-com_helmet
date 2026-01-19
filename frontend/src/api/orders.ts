import { api } from "./client";
import type { CartItem } from "../cart/cartStore";

export type CheckoutPayload = {
    full_name: string;
    email: string;
    phone?: string;
    items: Array<{
        productId: number;
        name: string;
        price: string;
        qty: number;
    }>;
};

export type OrderResponse = {
    id: number;
    status: string;
    subtotal: string;
};

export async function checkoutFromCart(payload: CheckoutPayload): Promise<OrderResponse> {
    const { data } = await api.post<OrderResponse>("/checkout/", payload);
    return data;
}

export function cartItemsToCheckoutItems(items: CartItem[]) {
    return items.map((i) => ({
        productId: i.productId,
        name: i.name,
        price: i.price,
        qty: i.qty,
    }));
}

export async function checkout(payload: CheckoutPayload): Promise<OrderResponse> {
    const { data } = await api.post<OrderResponse>("/checkout/", payload);
    return data;
}