import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProducts } from "../api/catalog";
import type { Product } from "../api/catalog";

export default function Catalog() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProducts()
            .then(setProducts)
            .catch(() => setError("Erro ao carregar produtos"))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div style={{ padding: 24 }}>Carregando...</div>;
    if (error) return <div style={{ padding: 24 }}>{error}</div>;

    return (
        <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
            <h1>Catálogo</h1>
            <div style={{ marginBottom: 12 }}>
                <Link to="/carrinho">Ver carrinho</Link>
            </div>
            {products.length === 0 ? (
                <p>Nenhum produto cadastrado.</p>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
                    {products.map((p) => {
                        const img = p.images?.[0]?.image;

                        return (
                            <Link
                                key={p.id}
                                to={`/produto/${p.slug}`}
                                style={{ textDecoration: "none", color: "inherit" }}
                            >
                                <div style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 12, background: "#fff" }}>
                                    {img && (
                                        <img
                                            src={img}
                                            alt={p.images?.[0]?.alt_text || p.name}
                                            style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 6 }}
                                        />
                                    )}
                                    <div style={{ marginTop: 8 }}>
                                        <strong>{p.name}</strong>
                                        <div style={{ marginTop: 4, fontWeight: 700 }}>R$ {p.price}</div>
                                        <div style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>
                                            {p.category?.name}{p.brand ? ` • ${p.brand.name}` : ""}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
