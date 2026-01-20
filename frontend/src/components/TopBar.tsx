import { Link } from "react-router-dom";
import { cartCount } from "../cart/cartStore";

export default function TopBar() {
    const count = cartCount();

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
                    <Link to="/" style={navLinkStyle}>Loja</Link>
                    <Link to="/carrinho" style={navLinkStyle}>
                        Carrinho {count > 0 ? <span style={badgeStyle}>{count}</span> : null}
                    </Link>
                </div>
            </div>
        </div>
    );
}

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