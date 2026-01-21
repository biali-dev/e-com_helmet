import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import { register, login } from "../api/auth";
import { claimGuestOrders } from "../api/myOrders";
type ApiErrorLike = {
    response?: { data?: unknown };
    message?: string;
};

export default function RegisterPage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        try {
            await register(username, email, password);
            await login(username, password);
            try {
                await claimGuestOrders();
            } catch {
                // ignore
            }
            navigate("/conta");
        } catch (err) {
            const e = err as ApiErrorLike;

            const msg =
                (e.response?.data && JSON.stringify(e.response.data)) ||
                e.message ||
                "Erro desconhecido";

            setError(`Erro ao criar conta: ${msg}`);
        }
    }

    return (
        <div style={pageStyle}>
            <TopBar />

            <div style={wrapStyle}>
                <div style={cardStyle}>
                    <h1 style={h1Style}>Criar conta</h1>

                    <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
                        <input placeholder="Usuário" value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} />
                        <input placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
                        <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />

                        {error && <div style={errorStyle}>{error}</div>}

                        <button type="submit" style={btnPrimaryStyle}>Criar conta</button>
                    </form>

                    <div style={footerStyle}>
                        Já tem conta? <Link to="/login">Entrar</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* reuse styles */
const pageStyle = { background: "#0f1115", minHeight: "100vh", color: "#e8eaf0" };
const wrapStyle = { maxWidth: 420, margin: "0 auto", padding: "60px 20px" };
const cardStyle = { background: "#141824", border: "1px solid #252a3a", borderRadius: 14, padding: 20 };
const h1Style = { marginBottom: 14 };
const inputStyle = { padding: 12, borderRadius: 10, border: "1px solid #252a3a", background: "#0e111a", color: "#e8eaf0" };
const btnPrimaryStyle = { padding: 12, borderRadius: 12, fontWeight: 900, background: "#fff", color: "#111", cursor: "pointer" };
const footerStyle = { marginTop: 14, fontSize: 13, color: "rgba(255,255,255,.7)" };
const errorStyle = { color: "#ff5c77", fontWeight: 800 };