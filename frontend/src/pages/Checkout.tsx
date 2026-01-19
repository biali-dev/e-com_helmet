import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getCart, clearCart, cartTotal } from "../cart/cartStore";
import type { CartItem } from "../cart/cartStore";

import { cartItemsToCheckoutItems, checkout } from "../api/orders";
import { createPayment } from "../api/payments";
import type { PaymentMethod, PaymentProvider } from "../api/payments";

export default function CheckoutPage() {
    const navigate = useNavigate();

    const [items, setItems] = useState<CartItem[]>([]);
    const [total, setTotal] = useState(0);

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    const [provider, setProvider] = useState<PaymentProvider>("dummy");
    const [method, setMethod] = useState<PaymentMethod>("pix");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Carrega carrinho ao entrar no checkout
    useEffect(() => {
        const cart = getCart();
        setItems(cart);
        setTotal(cartTotal());
    }, []);

    // Recalcula total se o carrinho mudar nesta tela (por segurança)
    useEffect(() => {
        setTotal(cartTotal());
    }, [items]);

    const mpCardBlocked = useMemo(() => provider === "mercado_pago" && method === "card", [provider, method]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (items.length === 0) {
            setError("Seu carrinho está vazio.");
            return;
        }

        if (!fullName.trim() || !email.trim()) {
            setError("Preencha nome e e-mail.");
            return;
        }

        if (mpCardBlocked) {
            setError("Cartão no Mercado Pago ainda não está implementado. Use Pix por enquanto.");
            return;
        }

        setLoading(true);

        try {
            // 1) Cria pedido
            const order = await checkout({
                full_name: fullName,
                email,
                phone,
                items: cartItemsToCheckoutItems(items),
            });

            // 2) Cria pagamento com provider + método
            const payment = await createPayment(order.id, method, provider);

            // 3) Limpa carrinho e redireciona para a tela de pagamento
            clearCart();
            navigate(`/pagamento/${payment.id}`);
        } catch (err: any) {
            const msg =
                err?.response?.data?.detail ||
                JSON.stringify(err?.response?.data || {}) ||
                err?.message ||
                "Erro desconhecido";
            setError(`Erro ao finalizar checkout: ${msg}`);
        } finally {

            setLoading(false);
        }
    }

    if (items.length === 0) {
        return (
            <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
                <h1>Checkout</h1>
                <p>Seu carrinho está vazio.</p>
                <Link to="/carrinho">Voltar ao carrinho</Link>
            </div>
        );
    }

    return (
        <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1 style={{ margin: 0 }}>Checkout</h1>
                <Link to="/carrinho">← Voltar ao carrinho</Link>
            </div>

            <div style={{ marginTop: 12, opacity: 0.85 }}>
                Total do carrinho: <strong>R$ {total.toFixed(2)}</strong>
            </div>

            <form onSubmit={onSubmit} style={{ marginTop: 16, display: "grid", gap: 10 }}>
                <label>
                    Nome completo
                    <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        style={{ width: "100%", padding: 10 }}
                    />
                </label>

                <label>
                    E-mail
                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ width: "100%", padding: 10 }}
                    />
                </label>

                <label>
                    Telefone (opcional)
                    <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        style={{ width: "100%", padding: 10 }}
                    />
                </label>

                <label>
                    Gateway (provider)
                    <select
                        value={provider}
                        onChange={(e) => setProvider(e.target.value as PaymentProvider)}
                        style={{ width: "100%", padding: 10 }}
                    >
                        <option value="dummy">Dummy (teste)</option>
                        <option value="mercado_pago">Mercado Pago</option>
                    </select>
                </label>

                <label>
                    Método de pagamento
                    <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                        style={{ width: "100%", padding: 10 }}
                    >
                        <option value="pix">Pix</option>
                        <option value="card">Cartão</option>
                    </select>
                </label>

                {mpCardBlocked && (
                    <div style={{ border: "1px solid #f0d98b", background: "#fff7db", padding: 10, borderRadius: 8 }}>
                        Cartão via Mercado Pago ainda não está implementado (precisa tokenização no frontend).
                        Selecione Pix para continuar.
                    </div>
                )}

                {error && <div style={{ color: "crimson" }}>{error}</div>}

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        padding: 12,
                        borderRadius: 8,
                        border: "1px solid #ddd",
                        cursor: loading ? "not-allowed" : "pointer",
                        fontWeight: 800,
                    }}
                >
                    {loading ? "Processando..." : "Finalizar e ir para pagamento"}
                </button>
            </form>
        </div>
    );
}
