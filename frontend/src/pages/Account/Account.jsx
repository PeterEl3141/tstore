import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../contexts/Auth/AuthContext.jsx";
import { fetchMyOrders } from "../../api/orders";
import { useCurrency } from "../../contexts/Currency/CurrencyContext.jsx";
import "./Account.css";

function Badge({ children, tone = "default" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function statusTone(status) {
  switch (status) {
    case "PAID": return "info";
    case "FULFILLED":
    case "SHIPPED": return "success";
    case "CANCELLED": return "danger";
    default: return "default"; // DRAFT, etc.
  }
}

export default function Account() {
  const { user, logout } = useAuth();
  const { format } = useCurrency();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setErr("");
    fetchMyOrders()
      .then(d => setOrders(d.items || []))
      .catch(e => setErr(e?.response?.data?.message || e.message || "Failed to load orders"))
      .finally(() => setLoading(false));
  }, [user]);

  const greeting = useMemo(() => user?.name ? `Hi, ${user.name}` : "My account", [user]);

  if (!user) {
    return (
      <section className="account">
        <h1 className="account-title">My account</h1>
        <p>You need to be logged in to view your orders.</p>
      </section>
    );
  }

  return (
    <section className="account">
      <header className="account-header">
        <div>
          <h1 className="account-title">{greeting}</h1>
          <div className="account-sub">{user.email}</div>
        </div>
        <button className="btn btn-ghost" onClick={logout}>Log out</button>
      </header>

      <div className="account-grid">
        {/* Left: profile box (simple for now) */}
        <aside className="account-card">
          <h2 className="card-title">Profile</h2>
          <div className="kv">
            <span>Name</span>
            <span>{user.name || "—"}</span>
          </div>
          <div className="kv">
            <span>Email</span>
            <span>{user.email}</span>
          </div>
          {/* Stubs for later */}
          <div className="account-actions">
            <button className="btn btn-sm" disabled>Change password (soon)</button>
            <button className="btn btn-sm" disabled>Manage addresses (soon)</button>
          </div>
        </aside>

        {/* Right: orders */}
        <main className="account-card">
          <h2 className="card-title">Order history</h2>

          {loading && <p className="muted">Loading orders…</p>}
          {err && <p className="error">{err}</p>}

          {!loading && !err && orders.length === 0 && (
            <p className="muted">No orders yet.</p>
          )}

          <ul className="order-list">
            {orders.map(o => (
              <li key={o.id} className="order-item">
                <div className="order-top">
                  <div className="order-id">Order <code>{o.id}</code></div>
                  <div className="order-meta">
                    <Badge tone={statusTone(o.status)}>{o.status}</Badge>
                    {o.gelatoStatus && <Badge tone="info">Print: {o.gelatoStatus}</Badge>}
                    <span className="order-date">{new Date(o.createdAt).toLocaleString()}</span>
                    <span className="order-total">{format(o.totalCents || 0)}</span>
                  </div>
                </div>

                <div className="order-lines">
                  {o.items?.map(it => (
                    <div key={it.id} className="order-line">
                      <div className="line-name">{it.name}</div>
                      <div className="line-opts">
                        {it.color && <span>{it.color}</span>}
                        {it.size && <span>· {it.size}</span>}
                        <span>· Qty {it.qty}</span>
                      </div>
                      <div className="line-price">{format((it.priceCents || 0) * (it.qty || 1))}</div>
                    </div>
                  ))}
                </div>

                <div className="order-actions">
                  {o.trackingUrl ? (
                    <a className="btn btn-sm" href={o.trackingUrl} target="_blank" rel="noreferrer">Track shipment</a>
                  ) : (
                    <span className="muted">Tracking not yet available</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </main>
      </div>
    </section>
  );
}
