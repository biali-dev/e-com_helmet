import { api } from "./client";

export type ShippingQuote = {
    id: string;
    label: string;
    price: string;
    days: number;
};

export async function quoteShipping(
    zip: string,
    items: { product_id: number; qty: number }[]
): Promise<ShippingQuote[]> {
    const { data } = await api.post("/shipping/quote/", {
        zip,
        items,
    });
    return data.quotes;
}