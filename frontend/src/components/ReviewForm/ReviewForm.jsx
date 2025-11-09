import { useState } from "react";
import './ReviewForm.css'

export default function ReviewForm({ tshirtId, onAdd }) {
  const [form, setForm] = useState({ rating: 5, title: "", body: "", authorName: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/tshirts/${tshirtId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: Number(form.rating),
          title: form.title.trim(),
          body: form.body.trim(),
          authorName: form.authorName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to submit review");

      onAdd?.(data);              // optimistic add
      setForm({ rating: 5, title: "", body: "", authorName: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="reviewform" onSubmit={onSubmit}>
      <h4>Write a review</h4>

      <label>
        Rating
        <select name="rating" value={form.rating} onChange={onChange} disabled={submitting}>
          {[5,4,3,2,1].map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </label>

      <label>
        Title
        <input
          name="title"
          value={form.title}
          onChange={onChange}
          maxLength={120}
          required
          disabled={submitting}
        />
      </label>

      <label>
        Body
        <textarea
          name="body"
          value={form.body}
          onChange={onChange}
          rows={4}
          maxLength={2000}
          required
          disabled={submitting}
        />
      </label>

      <label>
        Your name (optional)
        <input
          name="authorName"
          value={form.authorName}
          onChange={onChange}
          maxLength={80}
          disabled={submitting}
        />
      </label>

      {error && <div className="reviewform-error">{error}</div>}
      <button type="submit" disabled={submitting}>Post review</button>
    </form>
  );
}
