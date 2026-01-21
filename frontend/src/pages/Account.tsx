import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TopBar from "../components/TopBar";
import { fetchMyOrders } from "../api/myOrders";

type Order = {
    id: number;
    status: string;
    total: string;
    created_at: string;
};

export default function AccountPage() {
    const [orders, setOrders] = useState<Order[]>([]);

    useEffect(() => {
        fetchMyOrders().then(setOrders);
    }, []);

    return (
        <div style={pageStyle}>
            <TopBar />

            <div style={wrapStyle}>
                <h1 style={h1Style}>Meus pedidos</h1>

                {orders.length === 0 && <div>Nenhum pedido ainda.</div>}

                <div style={{ display: "grid", gap: 12 }}>
                    {orders.map((o) => (
                        <Link key={o.id} to={`/conta/pedidos/${o.id}`} style={orderCardStyle}>
                            <div>Pedido #{o.id}</div>
                            <div>Status: {o.status}</div>
                            <div>Total: R$ {o.total}</div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

const pageStyle = { background: "#0f1115", minHeight: "100vh", color: "#e8eaf0" };
const wrapStyle = { maxWidth: 900, margin: "0 auto", padding: "30px 20px" };
const h1Style = { marginBottom: 16 };
const orderCardStyle = {
    display: "grid",
    gap: 6,
    background: "#141824",
    border: "1px solid #252a3a",
    borderRadius: 14,
    padding: 14,
    color: "#e8eaf0",
    textDecoration: "none",
};