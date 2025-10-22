import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";

import Home from "./pages/Home/Home.jsx";
import TShirt from "./pages/TShirt/TShirt.jsx";
import Cart from "./pages/Cart/Cart.jsx";
import Login from "./pages/Login/Login.jsx";
import AdminEditor from "./pages/AdminEditor/AdminEditor.jsx";
import Register from "./pages/Register/Register.jsx";
import Checkout from "./pages/Checkout/Checkout.jsx";
import AdminOrders from "./pages/AdminOrders/AdminOrders.jsx";
import About from "./pages/About/About.jsx";
import CheckoutSuccess from "./pages/CheckoutSuccess/CheckoutSuccess.jsx";
import Account from "./pages/Account/Account.jsx";

import { CartProvider } from "./contexts/Cart/CartContext.jsx";
import { AuthProvider } from "./contexts/Auth/AuthContext.jsx";
import { CurrencyProvider } from "./contexts/Currency/CurrencyContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <CurrencyProvider>
  <AuthProvider>
  <CartProvider>
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<Home />} />
        <Route path="t/:slug" element={<TShirt />} />
        <Route path="cart" element={<Cart />} />
        <Route path="login" element={<Login />} />
        <Route path="admin/editor" element={<AdminEditor />} />
        <Route path="register" element={<Register />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="checkout/success" element={<div>Thanks! Payment received.</div>} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/about" element={<About />} />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
        <Route path="/account" element={<Account />} />

      </Route>
    </Routes>
  </BrowserRouter>
  </CartProvider>
  </AuthProvider>
  </CurrencyProvider>
);
