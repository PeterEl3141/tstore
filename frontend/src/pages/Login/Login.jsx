import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/Auth/AuthContext.jsx";
import "./Login.css";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      await login(email, password);
      nav("/");
    } catch (e) {
      setErr(e?.response?.data?.message || "Login failed");
    }
  }

  return (
    <section className="login">
      <h1 className="login-title">Login</h1>
      <form className="login-form" onSubmit={onSubmit}>
        <label>Email <input value={email} onChange={e=>setEmail(e.target.value)} /></label>
        <label>Password <input type="password" value={password} onChange={e=>setPassword(e.target.value)} /></label>
        {err && <p className="login-error">{err}</p>}
        <button type="submit">Log in</button>
      </form>
    </section>
  );
}
