import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cartCount } from "../cart/cartStore";

export default function TopBar() {
    const navigate = useNavigate();

    const [count, setCount] = useState(() => cartCount());

    // 🔐 auth simples (JWT no localStorage)
    const isLogged = useMemo(() => {
        return Boolean(localStorage.getItem("access_token"));
    }, []);

    useEffect(() => {
        const handler = () => setCount(cartCount());
        window.addEventListener("cart:updated", handler);
        return () => window.removeEventListener("cart:updated", handler);
    }, []);

    function logout() {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        navigate("/");
        window.location.reload(); // garante header atualizado
    }

    return (
        <div style={topBarStyle}>
            <div style={topBarInnerStyle}>
                {/* LEFT */}
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <Link to="/" style={{ ...brandStyle, textDecoration: "none" }}>
                        CYBER VOLT
                    </Link>
                    <span style={subtitleStyle}>
                        CAPACETES E ACESSÓRIOS
                    </span>
                </div>

                {/* RIGHT */}
                <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                    <Link to="/" style={navLinkStyle}>
                        Loja
                    </Link>

                    <Link to="/carrinho" style={navLinkStyle}>
                        Carrinho
                        {count > 0 && <span style={badgeStyle}>{count}</span>}
                    </Link>

                    {!isLogged ? (
                        <Link to="/login" style={navLinkStyle}>
                            Entrar
                        </Link>
                    ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <Link to="/conta" style={navLinkStyle}>
                                Minha conta
                            </Link>

                            <button
                                onClick={logout}
                                style={logoutBtnStyle}
                                title="Sair"
                            >
                                Sair
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ---------------- styles ---------------- */

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

const subtitleStyle: React.CSSProperties = {
    color: "#6b6f7b",
    fontSize: 12,
    fontWeight: 800,
};

const navLinkStyle: React.CSSProperties = {
    color: "#111",
    fontWeight: 900,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontSize: 12,
    textDecoration: "none",
};

const badgeStyle: React.CSSProperties = {
    display: "inline-block",
    marginLeft: 8,
    padding: "2px 8px",
    borderRadius: 999,
    background: "#111",
    color: "#fff",
    fontSize: 12,
    fontWeight: 900,
};

const logoutBtnStyle: React.CSSProperties = {
    background: "transparent",
    border: "1px solid rgba(0,0,0,.15)",
    borderRadius: 999,
    padding: "4px 10px",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1,
    textTransform: "uppercase",
    cursor: "pointer",
    color: "#111",
};