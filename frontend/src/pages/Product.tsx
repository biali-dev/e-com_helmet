import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchProductBySlug } from "../api/catalog";
import type { Product } from "../api/catalog";
import { useNavigate } from "react-router-dom";
import { addToCart } from "../cart/cartStore";

export default function ProductPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate(); // 👈 OBRIGATÓRIO

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!slug) return;

        fetchProductBySlug(slug)
            .then(setProduct)
            .catch(() => setError("Produto não encontrado"))
            .finally(() => setLoading(false));
    }, [slug]);

    if (loading) return <div style={{ padding: 24 }}>Carregando...</div>;
    if (error) return <div style={{ padding: 24 }}>{error}</div>;
    if (!product) return <div style={{ padding: 24 }}>Produto não encontrado.</div>;

    const mainImage = product.images?.[0]?.image;

    return (
        <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
            <Link to="/">← Voltar</Link>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 16 }}>
                <div>
                    {mainImage && (
                        <img
                            src={mainImage}
                            alt={product.images?.[0]?.alt_text || product.name}
                            style={{ width: "100%", height: 420, objectFit: "cover", borderRadius: 8 }}
                        />
                    )}

                    {product.images?.length > 1 && (
                        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                            {product.images.slice(1).map((img) => (
                                <img
                                    key={img.id}
                                    src={img.image}
                                    alt={img.alt_text || product.name}
                                    style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 6 }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <h1 style={{ marginTop: 0 }}>{product.name}</h1>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>R$ {product.price}</div>
                    <div style={{ marginTop: 8, opacity: 0.7 }}>
                        {product.category?.name}{product.brand ? ` • ${product.brand.name}` : ""}
                    </div>

                    {product.description && (
                        <p style={{ marginTop: 16, lineHeight: 1.5 }}>{product.description}</p>
                    )}

                    {/* Próximo passo: carrinho */}
                    <button
                        style={{
                            marginTop: 16,
                            padding: "10px 14px",
                            borderRadius: 8,
                            border: "1px solid #ddd",
                            cursor: "pointer",
                            fontWeight: 700,
                        }}
                        onClick={() => {
                            if (!product) return;
                            addToCart(product, 1);   // 👈 AQUI acontece a mágica
                            navigate("/carrinho");  // 👈 força abrir o carrinho
                        }}
                    >
                        Adicionar ao carrinho
                    </button>
                </div>
            </div>
        </div>
    );
}
