import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/Auth/AuthContext";
import { CurrencyProvider } from "./components/Currency/CurrencyContext";
import { SiteProvider } from "./components/LandingPage/SiteContext";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import LandingPage from "./components/LandingPage/LandingPage";
import ProductsPage from "./components/Products/ProductsPage";
import CheckoutPage from "./components/Checkout/CheckoutPage";
import LoginPage from "./components/Auth/LoginPage";
import AdminDashboard from "./components/Dashboard/AdminDashboard";
import AdminProducts from "./components/Dashboard/AdminProducts";
import AdminOrders from "./components/Dashboard/AdminOrders";
import AdminUsers from "./components/Dashboard/AdminUsers";
import AdminCurrencies from "./components/Dashboard/AdminCurrencies";
import POSApp from "./components/POS/POSApp";

export default function App() {
  const [cart, setCart] = useState([]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i._id === product._id);
      if (existing)
        return prev.map((i) =>
          i._id === product._id ? { ...i, qty: i.qty + 1 } : i,
        );
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const clearCart = () => setCart([]);

  return (
    <AuthProvider>
      <CurrencyProvider>
        <BrowserRouter>
          <Routes>
            {/* ── Public — wrapped in SiteProvider for landing page content ── */}
            <Route
              path="/"
              element={
                <SiteProvider>
                  <LandingPage />
                </SiteProvider>
              }
            />
            <Route
              path="/products"
              element={<ProductsPage cart={cart} onAddToCart={addToCart} />}
            />
            <Route
              path="/checkout"
              element={<CheckoutPage cart={cart} onClearCart={clearCart} />}
            />

            {/* ── Auth ── */}
            <Route path="/admin/login" element={<LoginPage />} />

            {/* ── Admin — SiteProvider only for dashboard (content editor) ── */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <SiteProvider>
                    <AdminDashboard />
                  </SiteProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute>
                  <AdminProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute>
                  <AdminOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/currencies"
              element={
                <ProtectedRoute>
                  <AdminCurrencies />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pos"
              element={
                <ProtectedRoute>
                  <POSApp />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </CurrencyProvider>
    </AuthProvider>
  );
}
