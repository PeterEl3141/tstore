import { useEffect, useState } from "react";
import { listAdminOrders, getAdminOrder, refreshFulfillment } from "../../api/adminOrders";
import { useAuth } from "../../contexts/Auth/AuthContext.jsx";
import "./AdminOrders.css";

function fmtMoney(cents, cur) { return `${(cents/100).toFixed(2)} ${cur}`; }
function fmtDate(x) { try { return new Date(x).toLocaleString(); } catch { return ""; } }

export default function AdminOrders() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    listAdminOrders().then(d => {
      if (!mounted) return;
      setItems(d.items || []);
      setCursor(d.nextCursor || null);
    }).catch(e => setError(e?.response?.data?.message || e.message))
      .finally(()=> setLoading(false));
    return () => { mounted = false; };
  }, []);

  async function loadMore() {
    if (!cursor) return;
    const d = await listAdminOrders({ cursor });
    setItems(prev => [...prev, ...(d.items || [])]);
    setCursor(d.nextCursor || null);
  }

  async function openDetail(id) {
    setSelected(id);
    setDetail(null);
    try {
      const d = await getAdminOrder(id);
      setDetail(d);
    } catch (e) {
      setDetail({ __error: e?.response?.data?.message || e.message });
    }
  }

  async function onRefresh(id) {
    try {
      await refreshFulfillment(id);
      // Optimistically update the row view by refetching the header list
      const d = await listAdminOrders();
      setItems(d.items || []);
      setCursor(d.nextCursor || null);
      if (selected === id) openDetail(id);
    } catch (e) {
      alert(e?.response?.data?.message || "Refresh failed");
    }
  }

  if (!isAdmin) return <p>Not authorized.</p>;

  return (
    <section className="admin-orders">
      <h1>Orders</h1>
      {error && <div className="admin-orders-error">{error}</div>}

      <div className="admin-orders-tablewrap">
        <table className="admin-orders-table">
          <thead>
            <tr>
              <th>Created</th>
              <th>Order</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>Gelato</th>
              <th>Tracking</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan="8">Loading…</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan="8">No orders yet.</td></tr>
            )}
            {items.map(o => (
              <tr key={o.id} className={selected === o.id ? "is-selected" : ""}>
                <td>{fmtDate(o.createdAt)}</td>
                <td>
                  <button className="linklike" onClick={()=>openDetail(o.id)}>{o.id}</button>
                  <div className="sub">{o._count?.items ?? 0} items</div>
                </td>
                <td>{o.email}</td>
                <td>{fmtMoney(o.totalCents, o.currency)}</td>
                <td><span className={`badge badge-${(o.status || "").toLowerCase()}`}>{o.status}</span></td>
                <td>{o.gelatoStatus || "-"}</td>
                <td>
                  {o.trackingUrl ? <a href={o.trackingUrl} target="_blank">Track</a> :
                   o.trackingNumber ? o.trackingNumber : "-"}
                </td>
                <td>
                  <button onClick={()=>onRefresh(o.id)}>Refresh</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cursor && <button className="admin-orders-more" onClick={loadMore}>Load more</button>}
      </div>

      {/* Details panel */}
      {detail && (
        <div className="admin-orders-detail">
          {detail.__error ? (
            <div className="error">{detail.__error}</div>
          ) : (
            <>
              <h2>Order {detail.id}</h2>
              <p><b>Status:</b> {detail.status} {detail.gelatoStatus ? ` · Gelato: ${detail.gelatoStatus}` : ""}</p>
              <p><b>Customer:</b> {detail.email}</p>
              <p><b>Ship to:</b> {detail.shippingName}, {detail.shippingLine1}{detail.shippingLine2 ? `, ${detail.shippingLine2}`:""}, {detail.shippingCity} {detail.shippingPostCode}, {detail.shippingCountry}{detail.shippingPhone ? ` · ${detail.shippingPhone}`:""}</p>
              <h3>Items</h3>
              <ul className="admin-orders-items">
                {(detail.items || []).map(it => (
                  <li key={it.id}>{it.qty}× {it.name} — {it.size}/{it.color}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  );
}
