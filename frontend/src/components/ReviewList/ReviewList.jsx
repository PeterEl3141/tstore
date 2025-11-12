import "./ReviewList.css";

export default function ReviewList({ reviews, currentUser, onDelete }) {
  if (!reviews?.length) return <p className="reviewlist-empty">No reviews yet.</p>;

  const canDelete = (r) => {
    if (!currentUser) return false;
    const isAdmin = currentUser.role === "ADMIN" || currentUser.isAdmin === true;
    const isAuthor =
      r.authorEmail && currentUser.email &&
      r.authorEmail.toLowerCase() === currentUser.email.toLowerCase();
    return isAdmin || isAuthor;
  };

  return (
    <ul className="reviewlist">
      {reviews.map((r) => (
        <li key={r.id} className="reviewlist-item">
          <div className="reviewlist-header">
            <strong className="reviewlist-title">{r.title}</strong>
            <span className="reviewlist-rating">{r.rating}/5</span>
          </div>

          <div className="reviewlist-body">{r.body}</div>

          <div className="reviewlist-footer">
            {r.authorName && <div className="reviewlist-author">by {r.authorName}</div>}

            {canDelete(r) && (
              <button
                type="button"
                className="reviewlist-delete"
                onClick={() => onDelete?.(r)}
                aria-label="Delete review"
                title="Delete review"
              >
                Delete
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
