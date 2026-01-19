import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { CartItem } from "../cart/cartStore";
import {
    getCart,
    removeFromCart,
    setQty,
    cartTotal,
    clearCart,
} from "../cart/cartStore";

export default function CartPage() {
    const navigate = useNavigate();

    // ✅ Inicializa o state direto do localStorage (sem useEffect)
    const [items, setItems] = useState<CartItem[]>(() => getCart());

    // ✅ Atualiza o state quando o carrinho mudar (evento customizado)
    useEffect(() => {
        const handler = () => setItems(getCart());
        window.addEventListener("cart:updated", handler);
        return () => window.removeEventListener("cart:updated", handler);
    }, []);

    const total = cartTotal();

    return (
        <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1 style={{ margin: 0 }}>Carrinho</h1>
                <Link to="/">← Voltar ao catálogo</Link>
            </div>

            {items.length === 0 ? (
                <p style={{ marginTop: 16 }}>Seu carrinho está vazio.</p>
            ) : (
                <>
                    <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
                        {items.map((i) => (
                            <div
                                key={i.productId}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "90px 1fr 140px 40px",
                                    gap: 12,
                                    alignItems: "center",
                                    border: "1px solid #e0e0e0",
                                    borderRadius: 8,
                                    padding: 12,
                                    background: "#fff",
                                }}
                            >
                                <div>
                                    {i.image ? (
                                        <img
                                            src={i.image}
                                            alt={i.name}
                                            style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 6 }}
                                        />
                                    ) : (
                                        <div style={{ width: 90, height: 90, background: "#f2f2f2", borderRadius: 6 }} />
                                    )}
                                </div>

                                <div>
                                    <strong>{i.name}</strong>
                                    <div style={{ opacity: 0.7, fontSize: 12 }}>R$ {i.price}</div>
                                    <Link to={`/produto/${i.slug}`} style={{ fontSize: 12 }}>
                                        ver produto
                                    </Link>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <button
                                        onClick={() => setQty(i.productId, i.qty - 1)}
                                        style={qtyBtnStyle}
                                    >
                                        -
                                    </button>

                                    <input
                                        value={i.qty}
                                        onChange={(e) => setQty(i.productId, Number(e.target.value || 1))}
                                        inputMode="numeric"
                                        style={qtyInputStyle}
                                    />

                                    <button
                                        onClick={() => setQty(i.productId, i.qty + 1)}
                                        style={qtyBtnStyle}
                                    >
                                        +
                                    </button>
                                </div>

                                <button
                                    onClick={() => removeFromCart(i.productId)}
                                    title="Remover"
                                    style={removeBtnStyle}
                                >
                                    🗑
                                </button>
                            </div>
                        ))}
                    </div>

                    <div
                        style={{
                            marginTop: 16,
                            padding: 12,
                            border: "1px solid #e0e0e0",
                            borderRadius: 8,
                            background: "#fff",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <div>
                            <strong>Total:</strong> R$ {total.toFixed(2)}
                        </div>

                        <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={clearCart} style={secondaryBtnStyle}>
                                Limpar carrinho
                            </button>

                            <button onClick={() => navigate("/checkout")} style={primaryBtnStyle}>
                                Ir para o checkout
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

/* ===== estilos reutilizáveis ===== */

const qtyBtnStyle: React.CSSProperties = {
    width: 34,
    height: 34,
    borderRadius: 8,
    border: "1px solid #ddd",
    cursor: "pointer",
};

const qtyInputStyle: React.CSSProperties = {
    width: 52,
    height: 34,
    textAlign: "center",
    borderRadius: 8,
    border: "1px solid #ddd",
};

const removeBtnStyle: React.CSSProperties = {
    width: 34,
    height: 34,
    borderRadius: 8,
    border: "1px solid #ddd",
    cursor: "pointer",
};

const secondaryBtnStyle: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #ddd",
    cursor: "pointer",
    fontWeight: 700,
};

const primaryBtnStyle: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #ddd",
    cursor: "pointer",
    fontWeight: 800,
};
