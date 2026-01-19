import type { Product } from "../api/catalog";

export type CartItem = {
    productId: number;
    slug: string;
    name: string;
    price: string;      // vem como string do backend
    image?: string;
    qty: number;
};

const STORAGE_KEY = "ecom_cart_v1";

function readCart(): CartItem[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const data = JSON.parse(raw);
        if (!Array.isArray(data)) return [];
        return data;
    } catch {
        return [];
    }
}

function writeCart(items: CartItem[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getCart(): CartItem[] {
    return readCart();
}

export function clearCart() {
    writeCart([]);
}

export function addToCart(product: Product, qty = 1) {
    const items = readCart();
    const existing = items.find((i) => i.productId === product.id);

    const image = product.images?.[0]?.image;

    if (existing) {
        existing.qty += qty;
    } else {
        items.push({
            productId: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            image,
            qty,
        });
    }

    writeCart(items);
}

export function removeFromCart(productId: number) {
    const items = readCart().filter((i) => i.productId !== productId);
    writeCart(items);
}

export function setQty(productId: number, qty: number) {
    const items = readCart();
    const item = items.find((i) => i.productId === productId);
    if (!item) return;

    const newQty = Math.max(1, Math.min(99, qty));
    item.qty = newQty;
    writeCart(items);
}

export function cartCount(): number {
    return readCart().reduce((sum, i) => sum + i.qty, 0);
}

export function cartTotal(): number {
    const items = readCart();
    return items.reduce((sum, i) => sum + Number(i.price) * i.qty, 0);
}
