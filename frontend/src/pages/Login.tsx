import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import { login } from "../api/auth";
import { claimGuestOrders } from "../api/myOrders";

export default function LoginPage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await login(username, password);
            try {
                await claimGuestOrders();
            } catch {
                // não bloqueia login se falhar
            }
            navigate("/conta");
        } catch {
            setError("Usuário ou senha inválidos.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={pageStyle}>
            <TopBar />

            <div style={wrapStyle}>
                <div style={cardStyle}>
                    <h1 style={h1Style}>Entrar</h1>

                    <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
                        <input
                            placeholder="Usuário"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={inputStyle}
                        />

                        <input
                            type="password"
                            placeholder="Senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={inputStyle}
                        />

                        {error && <div style={errorStyle}>{error}</div>}

                        <button type="submit" disabled={loading} style={btnPrimaryStyle}>
                            {loading ? "Entrando..." : "Entrar"}
                        </button>
                    </form>

                    <div style={footerStyle}>
                        Não tem conta? <Link to="/register">Criar conta</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* styles */
const pageStyle = { background: "#0f1115", minHeight: "100vh", color: "#e8eaf0" };
const wrapStyle = { maxWidth: 420, margin: "0 auto", padding: "60px 20px" };
const cardStyle = { background: "#141824", border: "1px solid #252a3a", borderRadius: 14, padding: 20 };
const h1Style = { marginBottom: 14 };
const inputStyle = { padding: 12, borderRadius: 10, border: "1px solid #252a3a", background: "#0e111a", color: "#e8eaf0" };
const btnPrimaryStyle = { padding: 12, borderRadius: 12, fontWeight: 900, background: "#fff", color: "#111", cursor: "pointer" };
const footerStyle = { marginTop: 14, fontSize: 13, color: "rgba(255,255,255,.7)" };
const errorStyle = { color: "#ff5c77", fontWeight: 800 };