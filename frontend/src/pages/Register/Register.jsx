import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/Auth/AuthContext.jsx";
import "./Register.css";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await register(email, password, name);
      nav("/"); // go home after register
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || "Registration failed";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="register">
      <h1 className="register-title">Create account</h1>
      <form className="register-form" onSubmit={onSubmit}>
        <label>
          Name
          <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Optional" />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required minLength={8} />
        </label>
        {err && <p className="register-error">{err}</p>}
        <button type="submit" disabled={loading}>{loading ? "Creating…" : "Sign up"}</button>
      </form>
      <p className="register-alt">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </section>
  );
}
