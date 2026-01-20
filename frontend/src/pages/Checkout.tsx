import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getCart, clearCart, cartTotal } from "../cart/cartStore";
import type { CartItem } from "../cart/cartStore";

import { cartItemsToCheckoutItems, checkout } from "../api/orders";
import { createPayment } from "../api/payments";
import type { PaymentMethod, PaymentProvider } from "../api/payments";

import { quoteShipping } from "../api/shipping";
import type { ShippingQuote } from "../api/shipping";

import { fetchAddressByCep } from "../api/cep";
import "../styles/checkout.css";

type ApiErrorLike = {
    response?: { data?: unknown };
    message?: string;
};

function money(v: number): string {
    return v.toFixed(2);
}

function nMoney(s: string): number {
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
}

function maskCep(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 8);
    if (d.length <= 5) return d;
    return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export default function CheckoutPage() {
    const navigate = useNavigate();

    // Cart
    const [items, setItems] = useState<CartItem[]>([]);
    const [subtotal, setSubtotal] = useState(0);

    // Customer
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    // Address
    const [zip, setZip] = useState("");
    const [street, setStreet] = useState("");
    const [number, setNumber] = useState("");
    const [complement, setComplement] = useState("");
    const [district, setDistrict] = useState("");
    const [city, setCity] = useState("");
    const [stateUf, setStateUf] = useState("");

    // CEP lookup UI
    const [cepLoading, setCepLoading] = useState(false);

    // Shipping
    const [quotes, setQuotes] = useState<ShippingQuote[]>([]);
    const [shippingLoading, setShippingLoading] = useState(false);
    const [selectedQuoteId, setSelectedQuoteId] = useState<string>("");

    const selectedQuote = useMemo(
        () => quotes.find((q) => q.id === selectedQuoteId) || null,
        [quotes, selectedQuoteId]
    );

    // Payment
    const [provider, setProvider] = useState<PaymentProvider>("mercado_pago");
    const [method, setMethod] = useState<PaymentMethod>("pix");

    // UI
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load cart
    useEffect(() => {
        const cart = getCart();
        setItems(cart);
        setSubtotal(cartTotal());
    }, []);

    useEffect(() => {
        setSubtotal(cartTotal());
    }, [items]);

    const shippingPrice = selectedQuote ? nMoney(selectedQuote.price) : 0;
    const total = subtotal + shippingPrice;

    const mpCardSelected = useMemo(
        () => provider === "mercado_pago" && method === "card",
        [provider, method]
    );

    // ✅ Auto-preencher endereço ao completar CEP
    useEffect(() => {
        const clean = zip.replace(/\D/g, "");
        if (clean.length !== 8) return;

        let cancelled = false;

        (async () => {
            setCepLoading(true);
            // não apaga erro antigo automaticamente; mas se quiser: setError(null);

            try {
                const data = await fetchAddressByCep(zip);

                if (cancelled) return;

                // Preenche somente se vier valor (não sobrescreve caso usuário já tenha digitado algo diferente)
                if (data.logradouro && !street) setStreet(data.logradouro);
                if (data.bairro && !district) setDistrict(data.bairro);
                if (data.localidade && !city) setCity(data.localidade);
                if (data.uf && !stateUf) setStateUf(data.uf.toUpperCase());
            } catch {
                if (!cancelled) {
                    setError("Não foi possível preencher o endereço pelo CEP. Preencha manualmente.");
                }
            } finally {
                if (!cancelled) setCepLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [zip]);

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

            if (data.length > 0) setSelectedQuoteId(data[0].id);
        } catch {
            setError("Não foi possível calcular o frete. Tente novamente.");
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
            const order = await checkout({
                full_name: fullName,
                email,
                phone,
                items: cartItemsToCheckoutItems(items),

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
                    subtotal: money(subtotal),
                    shipping: selectedQuote.price,
                    total: money(total),
                },
            } as unknown as Parameters<typeof checkout>[0]);

            // MP + Card -> go to Brick page
            if (provider === "mercado_pago" && method === "card") {
                clearCart();
                navigate(`/pagar-cartao/${order.id}`);
                return;
            }

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
            <div style={pageStyle}>
                <TopBar />
                <div className="checkout-wrap" style={wrapStyle}>
                    <h1 style={h1Style}>CHECKOUT</h1>
                    <p style={{ color: "rgba(255,255,255,.75)" }}>Seu carrinho está vazio.</p>
                    <Link to="/carrinho" style={linkStyle}>Voltar ao carrinho →</Link>
                </div>
            </div>
        );
    }

    return (
        <div style={pageStyle}>
            <TopBar />

            <div style={wrapStyle}>
                <div className="checkout-title-row" style={titleRowStyle}>
                    <div>
                        <div style={kickerStyle}>Checkout</div>
                        <h1 className="checkout-h1" style={h1Style}>FINALIZAR COMPRA</h1>
                        <div style={subTitleStyle}>
                            Subtotal: <strong>R$ {money(subtotal)}</strong>
                            {selectedQuote ? (
                                <>
                                    {" "}• Frete: <strong>R$ {money(shippingPrice)}</strong> ({selectedQuote.label}, {selectedQuote.days} dias)
                                    {" "}• Total: <strong>R$ {money(total)}</strong>
                                </>
                            ) : (
                                <>
                                    {" "}• Total: <strong>R$ {money(subtotal)}</strong>
                                </>
                            )}
                        </div>
                    </div>

                    <Link to="/carrinho" style={backLinkStyle}>← Voltar ao carrinho</Link>
                </div>

                <div className="checkout-grid" style={gridStyle}>
                    {/* LEFT */}
                    <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
                        {/* DADOS */}
                        <Section title="DADOS">
                            <Field label="Nome completo">
                                <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                            </Field>

                            <div className="checkout-two-col" style={twoColStyle}>
                                <Field label="E-mail">
                                    <input value={email} onChange={(e) => setEmail(e.target.value)} />
                                </Field>
                                <Field label="Telefone (opcional)">
                                    <input value={phone} onChange={(e) => setPhone(e.target.value)} />
                                </Field>
                            </div>
                        </Section>

                        {/* ENTREGA */}
                        <Section title="ENTREGA">
                            <div className="checkout-cep-row" style={cepRowStyle}>
                                <Field label="CEP">
                                    <input
                                        value={zip}
                                        onChange={(e) => setZip(maskCep(e.target.value))}
                                        placeholder="00000-000"
                                        inputMode="numeric"
                                    />
                                    {cepLoading && (
                                        <div style={{ marginTop: 6, color: "rgba(255,255,255,.65)", fontSize: 12, fontWeight: 800 }}>
                                            Buscando endereço pelo CEP...
                                        </div>
                                    )}
                                </Field>

                                <button
                                    type="button"
                                    onClick={onQuoteShipping}
                                    disabled={shippingLoading}
                                    style={{
                                        ...btnStyle,
                                        ...btnGhostStyle,
                                        height: 44,
                                        marginTop: 22,
                                        minWidth: 160,
                                    }}
                                >
                                    {shippingLoading ? "Calculando..." : "Calcular frete"}
                                </button>
                            </div>

                            <Field label="Rua">
                                <input value={street} onChange={(e) => setStreet(e.target.value)} />
                            </Field>

                            <div style={twoColStyle}>
                                <Field label="Número">
                                    <input value={number} onChange={(e) => setNumber(e.target.value)} />
                                </Field>
                                <Field label="Complemento (opcional)">
                                    <input value={complement} onChange={(e) => setComplement(e.target.value)} />
                                </Field>
                            </div>

                            <Field label="Bairro">
                                <input value={district} onChange={(e) => setDistrict(e.target.value)} />
                            </Field>

                            <div style={twoColStyle}>
                                <Field label="Cidade">
                                    <input value={city} onChange={(e) => setCity(e.target.value)} />
                                </Field>
                                <Field label="UF">
                                    <input
                                        value={stateUf}
                                        onChange={(e) => setStateUf(e.target.value.toUpperCase())}
                                        maxLength={2}
                                        placeholder="UF"
                                    />
                                </Field>
                            </div>

                            {/* Shipping options */}
                            {quotes.length > 0 && (
                                <div style={{ marginTop: 10 }}>
                                    <div style={miniTitleStyle}>OPÇÕES DE FRETE</div>

                                    <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                                        {quotes.map((q) => {
                                            const checked = selectedQuoteId === q.id;
                                            return (
                                                <label
                                                    key={q.id}
                                                    style={{
                                                        ...shipOptionStyle,
                                                        borderColor: checked ? "rgba(255,255,255,.25)" : "var(--border)",
                                                        background: checked ? "rgba(255,255,255,.06)" : "var(--panel)",
                                                    }}
                                                >
                                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                        <input
                                                            type="radio"
                                                            name="shipping"
                                                            value={q.id}
                                                            checked={checked}
                                                            onChange={() => setSelectedQuoteId(q.id)}
                                                        />
                                                        <div>
                                                            <div style={{ fontWeight: 900, letterSpacing: 0.3 }}>
                                                                {q.label.toUpperCase()}
                                                            </div>
                                                            <div style={{ color: "var(--muted)", fontSize: 12 }}>
                                                                {q.days} dias
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div style={{ fontWeight: 1000, fontSize: 16 }}>
                                                        R$ {money(nMoney(q.price))}
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </Section>

                        {/* PAGAMENTO */}
                        <Section title="PAGAMENTO">
                            <div style={twoColStyle}>
                                <Field label="Gateway">
                                    <select value={provider} onChange={(e) => setProvider(e.target.value as PaymentProvider)}>
                                        <option value="mercado_pago">Mercado Pago</option>
                                        <option value="dummy">Dummy (teste)</option>
                                    </select>
                                </Field>

                                <Field label="Método">
                                    <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                                        <option value="pix">Pix</option>
                                        <option value="card">Cartão</option>
                                    </select>
                                </Field>
                            </div>

                            {mpCardSelected && (
                                <div style={warnStyle}>
                                    Você será redirecionado para a tela do cartão (tokenização Mercado Pago).
                                </div>
                            )}
                        </Section>

                        {error && <div style={errorStyle}>{error}</div>}

                        <button type="submit" disabled={loading} style={{ ...btnStyle, ...btnPrimaryStyle }}>
                            {loading ? "Processando..." : "Finalizar e ir para pagamento"}
                        </button>

                        <div style={{ color: "var(--muted)", fontSize: 12, marginTop: -6 }}>
                            Ao finalizar, você concorda com termos e política de privacidade.
                        </div>
                    </form>

                    {/* RIGHT */}
                    <div style={rightColStyle}>
                        <div className="checkout-sticky" style={summaryStickyStyle}>
                            <div style={summaryCardStyle}>
                                <div style={miniTitleStyle}>RESUMO</div>

                                <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                                    {items.map((i) => (
                                        <div key={i.productId} style={summaryItemStyle}>
                                            <div style={{ display: "flex", gap: 10 }}>
                                                <div style={thumbBoxStyle}>
                                                    {i.image ? (
                                                        <img
                                                            src={i.image}
                                                            alt={i.name}
                                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                        />
                                                    ) : null}
                                                </div>

                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                        {i.name}
                                                    </div>
                                                    <div style={{ color: "var(--muted)", fontSize: 12 }}>
                                                        Qtd: {i.qty} • R$ {i.price}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ fontWeight: 900 }}>
                                                R$ {money(nMoney(i.price) * i.qty)}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div style={dividerStyle} />

                                <Line label="Subtotal" value={`R$ ${money(subtotal)}`} />
                                <Line label="Frete" value={selectedQuote ? `R$ ${money(shippingPrice)}` : "—"} muted={!selectedQuote} />
                                <Line label="Total" value={`R$ ${money(selectedQuote ? total : subtotal)}`} strong />

                                <div style={{ marginTop: 14, color: "var(--muted)", fontSize: 12 }}>
                                    Pagamentos via Pix e Cartão (Mercado Pago).
                                </div>
                            </div>

                            <div style={{ marginTop: 12 }}>
                                <Link to="/" style={linkStyle}>Continuar comprando →</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ------------------ UI pieces ------------------ */

function TopBar() {
    return (
        <div style={topBarStyle}>
            <div style={topBarInnerStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <Link to="/" style={{ ...brandStyle, textDecoration: "none" }}>
                        CYBER VOLT
                    </Link>
                    <span style={{ color: "#6b6f7b", fontSize: 12, fontWeight: 800 }}>
                        CAPACETES E ACESSÓRIOS
                    </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <Link to="/" style={navLinkStyle}>LOJA</Link>
                    <Link to="/carrinho" style={navLinkStyle}>CARRINHO</Link>
                </div>
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={sectionCardStyle}>
            <div style={sectionTitleStyle}>{title}</div>
            <div style={{ display: "grid", gap: 12 }}>{children}</div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label style={{ display: "grid", gap: 6 }}>
            <span style={fieldLabelStyle}>{label}</span>
            {children}
        </label>
    );
}

function Line({
    label,
    value,
    strong,
    muted,
}: {
    label: string;
    value: string;
    strong?: boolean;
    muted?: boolean;
}) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ color: muted ? "var(--muted)" : "var(--text)", fontWeight: 800 }}>{label}</div>
            <div style={{ fontWeight: strong ? 1000 : 900, fontSize: strong ? 18 : 14 }}>{value}</div>
        </div>
    );
}

/* ------------------ styles ------------------ */

const pageStyle: React.CSSProperties = {
    background: "#0f1115",
    minHeight: "100vh",
    color: "#e8eaf0",
};

const topBarStyle: React.CSSProperties = {
    background: "#ffffff",
    color: "#111",
    borderBottom: "1px solid rgba(0,0,0,.08)",
    position: "sticky",
    top: 0,
    zIndex: 10,
};

const topBarInnerStyle: React.CSSProperties = {
    maxWidth: 1180,
    margin: "0 auto",
    padding: "18px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
};

const brandStyle: React.CSSProperties = {
    fontWeight: 1000,
    letterSpacing: 2,
    fontSize: 18,
    color: "#111",
};

const navLinkStyle: React.CSSProperties = {
    color: "#111",
    fontWeight: 900,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontSize: 12,
    textDecoration: "none",
};

const wrapStyle: React.CSSProperties = {
    maxWidth: 1180,
    margin: "0 auto",
    padding: "26px 20px 50px",
};

const titleRowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 18,
};

const kickerStyle: React.CSSProperties = {
    color: "rgba(255,255,255,.6)",
    fontWeight: 900,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontSize: 12,
};

const h1Style: React.CSSProperties = {
    margin: "6px 0 0",
    fontSize: 52,
    letterSpacing: 1,
    lineHeight: 1,
};

const subTitleStyle: React.CSSProperties = {
    marginTop: 10,
    color: "rgba(255,255,255,.75)",
    fontWeight: 700,
};

const backLinkStyle: React.CSSProperties = {
    color: "rgba(255,255,255,.85)",
    fontWeight: 900,
    textDecoration: "none",
    marginTop: 10,
    whiteSpace: "nowrap",
};

const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: 18,
    alignItems: "start",
};

const rightColStyle: React.CSSProperties = {
    display: "block",
};

const summaryStickyStyle: React.CSSProperties = {
    position: "sticky",
    top: 92,
};

const sectionCardStyle: React.CSSProperties = {
    background: "#141824",
    border: "1px solid #252a3a",
    borderRadius: 14,
    padding: 16,
};

const sectionTitleStyle: React.CSSProperties = {
    fontWeight: 1000,
    letterSpacing: 2,
    fontSize: 12,
    color: "rgba(255,255,255,.65)",
    marginBottom: 12,
};

const fieldLabelStyle: React.CSSProperties = {
    color: "rgba(255,255,255,.65)",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 1,
    textTransform: "uppercase",
};

const twoColStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
};

const cepRowStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 10,
    alignItems: "end",
};

const shipOptionStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid #252a3a",
    borderRadius: 14,
    padding: 12,
};

const summaryCardStyle: React.CSSProperties = {
    background: "#141824",
    border: "1px solid #252a3a",
    borderRadius: 14,
    padding: 16,
};

const miniTitleStyle: React.CSSProperties = {
    fontWeight: 1000,
    letterSpacing: 2,
    fontSize: 12,
    color: "rgba(255,255,255,.65)",
};

const summaryItemStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
};

const thumbBoxStyle: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 10,
    overflow: "hidden",
    background: "#0e111a",
    border: "1px solid #252a3a",
    flexShrink: 0,
};

const dividerStyle: React.CSSProperties = {
    height: 1,
    background: "rgba(255,255,255,.08)",
    margin: "14px 0",
};

const btnStyle: React.CSSProperties = {
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,.14)",
    padding: "12px 14px",
    fontWeight: 1000,
    letterSpacing: 1,
    textTransform: "uppercase",
    cursor: "pointer",
};

const btnPrimaryStyle: React.CSSProperties = {
    background: "#ffffff",
    color: "#111",
};

const btnGhostStyle: React.CSSProperties = {
    background: "transparent",
    color: "rgba(255,255,255,.9)",
};

const warnStyle: React.CSSProperties = {
    border: "1px solid rgba(255,255,255,.16)",
    background: "rgba(255,255,255,.06)",
    padding: 12,
    borderRadius: 12,
    color: "rgba(255,255,255,.85)",
    fontWeight: 700,
};

const errorStyle: React.CSSProperties = {
    border: "1px solid rgba(255,92,119,.35)",
    background: "rgba(255,92,119,.12)",
    color: "#ff5c77",
    padding: 12,
    borderRadius: 12,
    fontWeight: 800,
};

const linkStyle: React.CSSProperties = {
    color: "rgba(255,255,255,.85)",
    fontWeight: 900,
    textDecoration: "none",
};