import "./Footer.css";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-left">
          <div className="footer-brand">Con Fuoco</div>
          <div className="footer-small">© {new Date().getFullYear()} Con Fuoco</div>
        </div>
        <nav className="footer-nav">
          <Link to="/about">About</Link>
          <a href="mailto:support@con-fuoco.co.uk">Contact</a>
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
        </nav>
        <div className="footer-social">
          <a href="https://instagram.com/yourhandle" aria-label="Instagram" target="_blank" rel="noreferrer">
            {/* Instagram SVG */}
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5A5.5 5.5 0 1 1 6.5 13 5.51 5.51 0 0 1 12 7.5zm0 2A3.5 3.5 0 1 0 15.5 13 3.5 3.5 0 0 0 12 9.5zM17.75 6a1.25 1.25 0 1 1-1.25 1.25A1.25 1.25 0 0 1 17.75 6z"/></svg>
          </a>
          <a href="https://x.com/yourhandle" aria-label="X" target="_blank" rel="noreferrer">
            {/* X/Twitter SVG */}
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h4.6l5.7 7.6 6.1-7.6H21l-7.2 9 7.6 9H16.7l-6-8-6.4 8H3l7.5-9z"/></svg>
          </a>
          <a href="mailto:support@con-fuoco.co.uk" aria-label="Email">
            {/* Mail SVG */}
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16a2 2 0 0 1 2 2v1l-10 6L2 7V6a2 2 0 0 1 2-2zm18 6.2V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7.8l10 6 10-6z"/></svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
