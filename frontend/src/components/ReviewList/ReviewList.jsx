import "./ReviewList.css";

export default function ReviewList({ reviews }) {
  if (!reviews?.length) return <p className="reviewlist-empty">No reviews yet.</p>;

  return (
    <ul className="reviewlist">
      {reviews.map((r) => (
        <li key={r.id} className="reviewlist-item">
          <div className="reviewlist-header">
            <strong className="reviewlist-title">{r.title}</strong>
            <span className="reviewlist-rating">{r.rating}/5</span>
          </div>
          <div className="reviewlist-body">{r.body}</div>
          {r.authorName && <div className="reviewlist-author">by {r.authorName}</div>}
        </li>
      ))}
    </ul>
  );
}
