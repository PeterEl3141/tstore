import { createContext, useContext, useEffect, useMemo, useReducer } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "cart:v1";

const initialState = { items: [] }; // each: {id, slug, name, priceCents, currency, image, size, color, qty}

function reducer(state, action) {
  switch (action.type) {
    case "ADD": {
      const { item } = action;
      const key = (i) => [i.id, i.size ?? "", i.color ?? ""].join("|");
      const idx = state.items.findIndex((i) => key(i) === key(item));
      if (idx >= 0) {
        const items = state.items.slice();
        items[idx] = { ...items[idx], qty: items[idx].qty + item.qty };
        return { items };
      }
      return { items: [...state.items, item] };
    }
    case "REMOVE": {
      const { id, size, color } = action;
      const items = state.items.filter(
        (i) => !(i.id === id && (i.size ?? "") === (size ?? "") && (i.color ?? "") === (color ?? ""))
      );
      return { items };
    }
    case "SET_QTY": {
      const { id, size, color, qty } = action;
      const items = state.items.map((i) =>
        i.id === id && (i.size ?? "") === (size ?? "") && (i.color ?? "") === (color ?? "")
          ? { ...i, qty }
          : i
      );
      return { items };
    }
    case "CLEAR":
      return { items: [] };
    case "REHYDRATE":
      return action.state ?? initialState;
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // rehydrate
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: "REHYDRATE", state: JSON.parse(raw) });
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const totals = useMemo(() => {
    const count = state.items.reduce((n, i) => n + i.qty, 0);
    const subtotalCents = state.items.reduce((n, i) => n + i.priceCents * i.qty, 0);
    const currency = state.items[0]?.currency ?? "GBP";
    return { count, subtotalCents, currency };
  }, [state.items]);

  const api = useMemo(
    () => ({
      items: state.items,
      totals,
      add: (item) => dispatch({ type: "ADD", item }),
      remove: (id, size, color) => dispatch({ type: "REMOVE", id, size, color }),
      setQty: (id, size, color, qty) => dispatch({ type: "SET_QTY", id, size, color, qty }),
      clear: () => dispatch({ type: "CLEAR" }),
    }),
    [state.items, totals]
  );

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
