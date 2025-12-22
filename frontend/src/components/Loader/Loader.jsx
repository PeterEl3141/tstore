import './Loader.css'



export default function Loader({ label = "Loading" }) {
  return (
    <div className="loader-wrap" role="status" aria-live="polite" aria-label={label}>
      <div className="loader-ring" />
    </div>
  );
}