import { useCart } from "../../contexts/Cart/CartContext.jsx";
import "./Cart.css";
import { Link } from "react-router-dom";

function stripPipe(u = "") {
  return String(u).split("|")[0].trim();
}

export default function Cart() {
  const { items, totals, setQty, remove, clear } = useCart();

  if (!items.length) {
    return (
      <section className="cart">
        <h1 className="cart-title">Your Cart</h1>
        <p className="cart-empty">Your cart is empty.</p>
      </section>
    );
  }

  return (
    <section className="cart">
      <h1 className="cart-title">Your Cart</h1>

      <ul className="cart-list">
        {items.map((i) => {
          const imgSrc = i.image ? stripPipe(i.image) : null;

          return (
            <li
              key={`${i.id}|${i.size ?? ""}|${i.color ?? ""}`}
              className="cart-item"
            >
              {imgSrc && (
                <img
                  className="cart-item-image"
                  src={imgSrc}
                  alt={i.name}
                />
              )}

              <div className="cart-item-meta">
                <div className="cart-item-name">{i.name}</div>

                <div className="cart-item-opts">
                  {i.size && <span>Size: {i.size}</span>}
                  {i.color && <span>Color: {i.color}</span>}
                </div>

                <div className="cart-item-price">
                  {(i.priceCents / 100).toFixed(2)} {i.currency}
                </div>

                <div className="cart-item-actions">
                  <input
                    type="number"
                    min="1"
                    value={i.qty}
                    onChange={(e) =>
                      setQty(
                        i.id,
                        i.size,
                        i.color,
                        Math.max(1, Number(e.target.value) || 1)
                      )
                    }
                  />
                  <button onClick={() => remove(i.id, i.size, i.color)}>
                    Remove
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="cart-summary">
        <div className="cart-subtotal">
          Subtotal: {(totals.subtotalCents / 100).toFixed(2)} {totals.currency}
        </div>
        <button className="cart-clear" onClick={clear}>
          Clear cart
        </button>
        <Link to="/checkout">Proceed to checkout</Link>
      </div>
    </section>
  );
}
