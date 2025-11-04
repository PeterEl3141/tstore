import { Link } from "react-router-dom";
import { useCart } from "../../contexts/Cart/CartContext.jsx";
import { useAuth } from "../../contexts/Auth/AuthContext.jsx";
import { useState, useRef, useEffect } from "react";
import "./Navbar.css";
import HomeIcon from "../../assets/icons/home.svg?react";
import CartIcon from "../../assets/icons/cart.svg?react";
import CurrencySelector from "../CurrencySelector/CurrencySelector.jsx";

export default function Navbar() {
  const { totals } = useCart();
  const { user, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setMenuOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
        Con Fuoco
        </Link>
        <div className="navbar-links">
          {isAdmin && (
            <Link to="/admin/editor" className="navbar-link">
              Editor
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin/orders" className="navbar-link">
              Orders
            </Link>
          )}
          <Link to="/about" className="navbar-link">
            About
          </Link>
          <CurrencySelector/>
          <Link to="/cart" className="navbar-link">
          <CartIcon className="nav-icon"/>
          {totals.count ? <span className="nav-badge">{totals.count}</span> : null}
          </Link>

          {user ? (
            <div className="navbar-user" ref={userMenuRef}>
              <button
                className="navbar-link navbar-user-btn"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                Hi, {user.name || user.email}
                <svg
                  className="navbar-caret"
                  width="12"
                  height="12"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    d="M5 8l5 5 5-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

              {menuOpen && (
                <div className="navbar-menu" role="menu">
                  <Link
                    to="/account"
                    className="navbar-menu-item"
                    role="menuitem"
                  >
                    Account
                  </Link>
                  <div className="navbar-menu-sep" />
                  <button
                    className="navbar-menu-item"
                    role="menuitem"
                    onClick={logout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="navbar-link">
                Login
              </Link>
              <Link to="/register" className="navbar-link">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
