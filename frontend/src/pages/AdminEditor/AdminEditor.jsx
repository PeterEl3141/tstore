import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/Auth/AuthContext.jsx";
import { Navigate } from "react-router-dom";
import {
  adminListTShirts,
  adminGetTShirt,
  adminCreateTShirt,
  adminUpdateTShirt,
  adminDeleteTShirt,
} from "../../api/admin.tshirts";
import "./AdminEditor.css";
import UploadImages from "../../components/UploadImages/UploadImages.jsx";
import SpecsPanel from "./SpecsPanel.jsx";

const EMPTY = {
  name: "",
  slug: "",
  description: "",
  price: "", // dollars in the form; converted to cents on submit
  currency: "USD",
  imagesText: "", // textarea → images[]
  colorOptionsText: "", // comma-separated → colorOptions[]
  sizeOptionsText: "S,M,L,XL",
  category: "ARTIST", // or "PIECE"
  status: "DRAFT", // DRAFT | LIVE | RETIRED
};

export default function AdminEditor() {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/login" replace />;

  const [list, setList] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("product"); // "product" | "specs"


  // load list
  async function refreshList() {
    setLoading(true);
    try {
      const d = await adminListTShirts();
      setList(d.items ?? []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshList();
  }, []);

  // when selecting an item to edit
  async function onSelect(id) {
    setSelectedId(id);
    setError("");
    try {
      const t = await adminGetTShirt(id);
      setForm({
        name: t.name ?? "",
        slug: t.slug ?? "",
        description: t.description ?? "",
        price: t.priceCents != null ? (t.priceCents / 100).toString() : "",
        currency: t.currency ?? "USD",
        imagesText: (t.images ?? []).join("\n"),
        colorOptionsText: (t.colorOptions ?? []).join(","),
        sizeOptionsText: (t.sizeOptions ?? []).join(","),
        category: t.category ?? "ARTIST",
        status: t.status ?? "DRAFT",
      });
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load product");
    }
  }

  function onNew() {
    setSelectedId(null);
    setForm(EMPTY);
    setError("");
  }

  function updateField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function toPayload(f) {
    const images = (f.imagesText || "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    const colorOptions = (f.colorOptionsText || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const sizeOptions = (f.sizeOptionsText || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const priceCents = Math.round(Number(f.price || 0) * 100);

    return {
      name: f.name.trim(),
      slug: f.slug.trim(),
      description: f.description.trim(),
      priceCents,
      currency: f.currency.trim() || "USD",
      images,
      colorOptions,
      sizeOptions,
      category: f.category.trim() || "ARTIST",
      status: f.status, // optional on backend, but we send it
    };
  }

  async function onSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = toPayload(form);
      if (!payload.name || !payload.slug)
        throw new Error("Name and slug are required");
      if (selectedId) {
        await adminUpdateTShirt(selectedId, payload);
      } else {
        const created = await adminCreateTShirt(payload);
        setSelectedId(created.id);
      }
      await refreshList();
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id) {
    if (!confirm("Delete this product?")) return;
    setError("");
    try {
      await adminDeleteTShirt(id);
      if (selectedId === id) onNew();
      await refreshList();
    } catch (e) {
      setError(e?.response?.data?.message || "Delete failed");
    }
  }

  const selected = useMemo(
    () => list.find((i) => i.id === selectedId),
    [list, selectedId]
  );

  return (
    <section className="admin-editor">
      <h1 className="admin-editor-title">Admin Editor</h1>

      {error && <div className="admin-editor-error">{error}</div>}

      <div className="admin-editor-layout">
        {/* LEFT: list */}
        <aside className="admin-editor-list">
          <div className="admin-editor-list-header">
            <button onClick={onNew}>+ New Product</button>
            <button onClick={refreshList} disabled={loading}>
              {loading ? "Loading…" : "Reload"}
            </button>
          </div>

          <ul className="admin-editor-items">
            {list.map((p) => (
              <li
                key={p.id}
                className={`admin-editor-item ${
                  selectedId === p.id ? "is-selected" : ""
                }`}
              >
                <button
                  className="admin-editor-item-main"
                  onClick={() => onSelect(p.id)}
                >
                  <div className="admin-editor-item-name">{p.name}</div>
                  <div className="admin-editor-item-sub">
                    <span>{p.slug}</span>
                    <span> · {p.status}</span>
                    <span>
                      {" "}
                      · {(p.priceCents / 100).toFixed(2)} {p.currency}
                    </span>
                  </div>
                </button>
                <button
                  className="admin-editor-item-delete"
                  onClick={() => onDelete(p.id)}
                >
                  ✖
                </button>
              </li>
            ))}
            {!loading && list.length === 0 && (
              <li className="admin-editor-empty">No products yet.</li>
            )}
          </ul>
        </aside>

        {/* RIGHT: form */}
        <div className="admin-editor-formwrap">
        <div className="admin-editor-tabs" style={{display:"flex", gap:8, marginBottom:10}}>
        <button onClick={()=>setTab("product")} disabled={tab==="product"}>Product</button>
        <button onClick={()=>setTab("specs")} disabled={tab==="specs"}>Specs</button>
        </div>
        {tab === "product" ? (
          <form className="admin-editor-form" onSubmit={onSave}>
            <div className="admin-editor-form-row">
              <label>
                Name
                <input
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  required
                />
              </label>
              <label>
                Slug
                <input
                  value={form.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                  required
                />
              </label>
            </div>

            <label className="admin-editor-form-row">
              Description
              <textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={4}
              />
            </label>

            <div className="admin-editor-form-row">
              <label>
                Price (USD)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => updateField("price", e.target.value)}
                />
              </label>
              <label>
                Currency
                <input
                  value={form.currency}
                  onChange={(e) => updateField("currency", e.target.value)}
                />
              </label>
              <label>
                Category
                <select
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                >
                  <option value="ARTIST">ARTIST</option>
                  <option value="PIECE">PIECE</option>
                </select>
              </label>
              <label>
                Status
                <select
                  value={form.status}
                  onChange={(e) => updateField("status", e.target.value)}
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="LIVE">LIVE</option>
                  <option value="RETIRED">RETIRED</option>
                </select>
              </label>
            </div>

            <div className="admin-editor-form-row">
              {/* Images column (spans 2) */}
              <label className="admin-editor-col span-2">
                Images (one URL per line)
                <UploadImages
                  onUploaded={(urls) =>
                    setForm((f) => ({
                      ...f,
                      // append new URLs; keep a newline if needed
                      imagesText:
                        (f.imagesText ? f.imagesText + "\n" : "") +
                        urls.join("\n"),
                    }))
                  }
                />
                <textarea
                  value={form.imagesText}
                  onChange={(e) => updateField("imagesText", e.target.value)}
                  rows={4}
                />
              </label>

              {/* Colors */}
              <label className="admin-editor-col">
                Colors (comma-separated)
                <input
                  value={form.colorOptionsText}
                  onChange={(e) =>
                    updateField("colorOptionsText", e.target.value)
                  }
                  placeholder="Black,White,Navy"
                />
                <small>Shown to customers</small>
              </label>

              {/* Sizes */}
              <label className="admin-editor-col">
                Sizes (comma-separated)
                <input
                  value={form.sizeOptionsText}
                  onChange={(e) =>
                    updateField("sizeOptionsText", e.target.value)
                  }
                  placeholder="S,M,L,XL"
                />
              </label>
            </div>

            <div className="admin-editor-actions">
              <button type="submit" disabled={saving}>
                {saving
                  ? "Saving…"
                  : selected
                  ? "Save Changes"
                  : "Create Product"}
              </button>
              {selected && (
                <span className="admin-editor-hint">
                  Editing: {selected.name}
                </span>
              )}
            </div>
          </form>
        ) : (
         <SpecsPanel tshirtId={selectedId} />
       )}
        </div>
      </div>
    </section>
  );
}
