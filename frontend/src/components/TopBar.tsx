import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cartCount } from "../cart/cartStore";
import { me } from "../api/auth";

export default function TopBar() {
    const navigate = useNavigate();

    const [count, setCount] = useState(() => cartCount());

    const [isLogged, setIsLogged] = useState(() => Boolean(localStorage.getItem("access_token")));
    const [username, setUsername] = useState<string>("");

    async function syncAuth() {
        const token = localStorage.getItem("access_token");
        const logged = Boolean(token);
        setIsLogged(logged);

        if (!logged) {
            setUsername("");
            return;
        }

        try {
            const u = await me(); // GET /me/
            setUsername(u?.username || "");
        } catch {
            setUsername("");
        }
    }

    // Atualiza auth no mount e quando houver login/logout
    useEffect(() => {
        syncAuth();

        const handler = () => {
            syncAuth();
        };

        window.addEventListener("auth:updated", handler);
        return () => window.removeEventListener("auth:updated", handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Atualiza badge do carrinho ao vivo
    useEffect(() => {
        const handler = () => setCount(cartCount());
        window.addEventListener("cart:updated", handler);
        return () => window.removeEventListener("cart:updated", handler);
    }, []);

    function logoutNow() {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.dispatchEvent(new Event("auth:updated"));
        navigate("/");
    }

    return (
        <div style={topBarStyle}>
            <div style={topBarInnerStyle}>
                {/* LEFT */}
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <Link to="/" style={{ ...brandStyle, textDecoration: "none" }}>
                        CYBER VOLT
                    </Link>
                    <span style={subtitleStyle}>CAPACETES E ACESSÓRIOS</span>
                </div>

                {/* RIGHT */}
                <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                    <Link to="/" style={navLinkStyle}>Loja</Link>

                    <Link to="/carrinho" style={navLinkStyle}>
                        Carrinho
                        {count > 0 && <span style={badgeStyle}>{count}</span>}
                    </Link>

                    {!isLogged ? (
                        <Link to="/login" style={navLinkStyle}>Entrar</Link>
                    ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={helloStyle}>Olá{username ? `, ${username}` : ""}</span>

                            <Link to="/conta" style={navLinkStyle}>Minha conta</Link>

                            <button onClick={logoutNow} style={logoutBtnStyle} title="Sair">
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
    width: "100%",
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

const helloStyle: React.CSSProperties = {
    color: "#111",
    fontWeight: 900,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    opacity: 0.75,
};