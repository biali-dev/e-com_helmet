import { api } from "./client";

export type ProductImage = {
    id: number;
    image: string;     // já vem URL completa no seu caso
    alt_text: string;
};

export type Product = {
    description: any;
    id: number;
    name: string;
    slug: string;
    price: string;
    category: { id: number; name: string; slug: string };
    brand: { id: number; name: string; slug: string } | null;
    images: ProductImage[];
};

export async function fetchProducts(): Promise<Product[]> {
    const { data } = await api.get<Product[]>("/products/");
    return data;
}

export async function fetchProductBySlug(slug: string): Promise<Product> {
    const { data } = await api.get<Product>(`/products/${slug}/`);
    return data;
}
