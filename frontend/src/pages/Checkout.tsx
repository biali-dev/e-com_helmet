import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getCart, clearCart, cartTotal } from "../cart/cartStore";
import type { CartItem } from "../cart/cartStore";

import { cartItemsToCheckoutItems, checkout } from "../api/orders";
import { createPayment } from "../api/payments";
import type { PaymentMethod, PaymentProvider } from "../api/payments";

import { quoteShipping } from "../api/shipping";
import type { ShippingQuote } from "../api/shipping";

type ApiErrorLike = {
    response?: { data?: unknown };
    message?: string;
};

function fmtMoney(v: number): string {
    return v.toFixed(2);
}

function parseMoney(s: string): number {
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
}

export default function CheckoutPage() {
    const navigate = useNavigate();

    // Carrinho
    const [items, setItems] = useState<CartItem[]>([]);
    const [subtotal, setSubtotal] = useState(0);

    // Dados do cliente
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    // Endereço (MVP)
    const [zip, setZip] = useState("");
    const [street, setStreet] = useState("");
    const [number, setNumber] = useState("");
    const [complement, setComplement] = useState("");
    const [district, setDistrict] = useState("");
    const [city, setCity] = useState("");
    const [stateUf, setStateUf] = useState("");

    // Frete
    const [quotes, setQuotes] = useState<ShippingQuote[]>([]);
    const [shippingLoading, setShippingLoading] = useState(false);
    const [selectedQuoteId, setSelectedQuoteId] = useState<string>("");
    const selectedQuote = useMemo(
        () => quotes.find((q) => q.id === selectedQuoteId) || null,
        [quotes, selectedQuoteId]
    );

    // Pagamento
    const [provider, setProvider] = useState<PaymentProvider>("dummy");
    const [method, setMethod] = useState<PaymentMethod>("pix");

    // UI
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Carrega carrinho ao entrar no checkout
    useEffect(() => {
        const cart = getCart();
        setItems(cart);
        setSubtotal(cartTotal());
    }, []);

    // Recalcula subtotal se itens mudarem (segurança)
    useEffect(() => {
        setSubtotal(cartTotal());
    }, [items]);

    // Total final
    const shippingPrice = selectedQuote ? parseMoney(selectedQuote.price) : 0;
    const total = subtotal + shippingPrice;

    // Aviso apenas: MP + card vai para a próxima tela (Brick)
    const mpCardSelected = useMemo(
        () => provider === "mercado_pago" && method === "card",
        [provider, method]
    );

    async function onQuoteShipping() {
        setError(null);

        if (!zip.trim()) {
            setError("Informe o CEP para calcular o frete.");
            return;
        }
        if (items.length === 0) {
            setError("Seu carrinho está vazio.");
            return;
        }

        setShippingLoading(true);
        try {
            const quoteItems = items.map((i) => ({
                product_id: i.productId,
                qty: i.qty,
            }));

            const data = await quoteShipping(zip, quoteItems);
            setQuotes(data);

            // auto-seleciona a primeira opção
            if (data.length > 0) setSelectedQuoteId(data[0].id);
        } catch {
            setError("Não foi possível calcular o frete. Verifique o backend e tente novamente.");
        } finally {
            setShippingLoading(false);
        }
    }

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

        // Endereço mínimo
        if (!zip.trim() || !street.trim() || !number.trim() || !district.trim() || !city.trim() || !stateUf.trim()) {
            setError("Preencha o endereço completo (CEP, rua, número, bairro, cidade e UF).");
            return;
        }

        if (!selectedQuote) {
            setError("Selecione uma opção de frete antes de continuar.");
            return;
        }

        setLoading(true);

        try {
            // 1) Cria pedido com endereço + frete
            const order = await checkout({
                full_name: fullName,
                email,
                phone,
                items: cartItemsToCheckoutItems(items),

                // ✅ novo payload (backend precisa aceitar)
                shipping: {
                    zip,
                    street,
                    number,
                    complement,
                    district,
                    city,
                    state: stateUf,
                    method: selectedQuote.id,
                    price: selectedQuote.price,
                    days: selectedQuote.days,
                },

                totals: {
                    subtotal: fmtMoney(subtotal),
                    shipping: selectedQuote.price,
                    total: fmtMoney(total),
                },
            } as unknown as Parameters<typeof checkout>[0]); // mantém compatível se seu type ainda não inclui shipping/totals

            // 2) MP + cartão: vai para Brick
            if (provider === "mercado_pago" && method === "card") {
                clearCart();
                navigate(`/pagar-cartao/${order.id}`);
                return;
            }

            // 3) Pix ou dummy card/pix: cria payment direto
            const payment = await createPayment(order.id, method, provider);

            clearCart();
            navigate(`/pagamento/${payment.id}`);
        } catch (err) {
            const e2 = err as ApiErrorLike;
            const detail =
                (e2.response?.data && JSON.stringify(e2.response.data)) ||
                e2.message ||
                "Erro desconhecido";

            setError(`Erro ao finalizar checkout: ${detail}`);
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
        <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1 style={{ margin: 0 }}>Checkout</h1>
                <Link to="/carrinho">← Voltar ao carrinho</Link>
            </div>

            <div style={{ marginTop: 10, opacity: 0.85 }}>
                Subtotal: <strong>R$ {subtotal.toFixed(2)}</strong>
                {selectedQuote ? (
                    <>
                        {" "}• Frete: <strong>R$ {parseMoney(selectedQuote.price).toFixed(2)}</strong> ({selectedQuote.label}, {selectedQuote.days} dias)
                        {" "}• Total: <strong>R$ {total.toFixed(2)}</strong>
                    </>
                ) : (
                    <>
                        {" "}• Total: <strong>R$ {subtotal.toFixed(2)}</strong>
                    </>
                )}
            </div>

            <form onSubmit={onSubmit} style={{ marginTop: 16, display: "grid", gap: 12 }}>
                {/* Dados do cliente */}
                <fieldset style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 12, background: "#fff" }}>
                    <legend style={{ padding: "0 6px" }}>Dados</legend>

                    <label>
                        Nome completo
                        <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ width: "100%", padding: 10 }} />
                    </label>

                    <label>
                        E-mail
                        <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: 10 }} />
                    </label>

                    <label>
                        Telefone (opcional)
                        <input value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: "100%", padding: 10 }} />
                    </label>
                </fieldset>

                {/* Endereço */}
                <fieldset style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 12, background: "#fff" }}>
                    <legend style={{ padding: "0 6px" }}>Entrega</legend>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 10 }}>
                        <label>
                            CEP
                            <input value={zip} onChange={(e) => setZip(e.target.value)} style={{ width: "100%", padding: 10 }} />
                        </label>

                        <button
                            type="button"
                            onClick={onQuoteShipping}
                            disabled={shippingLoading}
                            style={{
                                marginTop: 22,
                                padding: "10px 12px",
                                borderRadius: 8,
                                border: "1px solid #ddd",
                                cursor: shippingLoading ? "not-allowed" : "pointer",
                                fontWeight: 800,
                            }}
                        >
                            {shippingLoading ? "Calculando..." : "Calcular frete"}
                        </button>
                    </div>

                    <label>
                        Rua
                        <input value={street} onChange={(e) => setStreet(e.target.value)} style={{ width: "100%", padding: 10 }} />
                    </label>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <label>
                            Número
                            <input value={number} onChange={(e) => setNumber(e.target.value)} style={{ width: "100%", padding: 10 }} />
                        </label>

                        <label>
                            Complemento (opcional)
                            <input value={complement} onChange={(e) => setComplement(e.target.value)} style={{ width: "100%", padding: 10 }} />
                        </label>
                    </div>

                    <label>
                        Bairro
                        <input value={district} onChange={(e) => setDistrict(e.target.value)} style={{ width: "100%", padding: 10 }} />
                    </label>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 10 }}>
                        <label>
                            Cidade
                            <input value={city} onChange={(e) => setCity(e.target.value)} style={{ width: "100%", padding: 10 }} />
                        </label>

                        <label>
                            UF
                            <input value={stateUf} onChange={(e) => setStateUf(e.target.value.toUpperCase())} maxLength={2} style={{ width: "100%", padding: 10 }} />
                        </label>
                    </div>

                    {/* Opções de frete */}
                    {quotes.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                            <div style={{ fontWeight: 800, marginBottom: 6 }}>Opções de frete</div>

                            <div style={{ display: "grid", gap: 8 }}>
                                {quotes.map((q) => (
                                    <label
                                        key={q.id}
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            border: "1px solid #eee",
                                            borderRadius: 8,
                                            padding: 10,
                                            cursor: "pointer",
                                        }}
                                    >
                                        <div>
                                            <input
                                                type="radio"
                                                name="shipping"
                                                value={q.id}
                                                checked={selectedQuoteId === q.id}
                                                onChange={() => setSelectedQuoteId(q.id)}
                                                style={{ marginRight: 8 }}
                                            />
                                            <strong>{q.label}</strong> <span style={{ opacity: 0.7 }}>({q.days} dias)</span>
                                        </div>
                                        <div style={{ fontWeight: 800 }}>R$ {parseMoney(q.price).toFixed(2)}</div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </fieldset>

                {/* Pagamento */}
                <fieldset style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 12, background: "#fff" }}>
                    <legend style={{ padding: "0 6px" }}>Pagamento</legend>

                    <label>
                        Gateway (provider)
                        <select value={provider} onChange={(e) => setProvider(e.target.value as PaymentProvider)} style={{ width: "100%", padding: 10 }}>
                            <option value="dummy">Dummy (teste)</option>
                            <option value="mercado_pago">Mercado Pago</option>
                        </select>
                    </label>

                    <label>
                        Método de pagamento
                        <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} style={{ width: "100%", padding: 10 }}>
                            <option value="pix">Pix</option>
                            <option value="card">Cartão</option>
                        </select>
                    </label>

                    {mpCardSelected && (
                        <div style={{ marginTop: 8, border: "1px solid #f0d98b", background: "#fff7db", padding: 10, borderRadius: 8 }}>
                            Cartão com Mercado Pago abre uma próxima tela para tokenização (Bricks).
                        </div>
                    )}
                </fieldset>

                {error && <div style={{ color: "crimson" }}>{error}</div>}

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        padding: 12,
                        borderRadius: 8,
                        border: "1px solid #ddd",
                        cursor: loading ? "not-allowed" : "pointer",
                        fontWeight: 900,
                    }}
                >
                    {loading ? "Processando..." : "Finalizar e ir para pagamento"}
                </button>
            </form>
        </div>
    );
}