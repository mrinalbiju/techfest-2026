import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { errorMessage } from "../api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function submit(e) {
    e.preventDefault();
    try {
      await login(email, password);
      navigate(location.state?.from || "/events");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <section className="narrow">
      <h1>Log in</h1>
      <form className="card form" onSubmit={submit}>
        <label>Email<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        <button className="btn">Log in</button>
        {error && <p className="error">{error}</p>}
        <p className="muted">New here? <Link to="/register">Create an account</Link></p>
      </form>
    </section>
  );
}
