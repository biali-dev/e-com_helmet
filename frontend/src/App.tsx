import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Catalog from "./pages/Catalog";
import ProductPage from "./pages/Product";
import CartPage from "./pages/Cart";
import CheckoutPage from "./pages/Checkout";
import PaymentPage from "./pages/Payment";
import CardPaymentPage from "./pages/CardPayment";

import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import AccountPage from "./pages/Account";
import OrderDetailPage from "./pages/OrderDetail";
import ProtectedRoute from "./routes/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Loja */}
        <Route path="/" element={<Catalog />} />
        <Route path="/produto/:slug" element={<ProductPage />} />
        <Route path="/carrinho" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />

        {/* Pagamentos */}
        <Route path="/pagamento/:paymentId" element={<PaymentPage />} />
        <Route path="/pagar-cartao/:orderId" element={<CardPaymentPage />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Área do cliente */}
        <Route
          path="/conta"
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/conta/pedidos/:id"
          element={
            <ProtectedRoute>
              <OrderDetailPage />
            </ProtectedRoute>
          }
        />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}