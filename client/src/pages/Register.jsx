import { useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../api";

const initial = { name: "", email: "", password: "", confirm: "" };

// Controlled form: every input's value comes from state
export default function Register() {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  function validate() {
    const errs = {};
    if (!/^[A-Za-z ]{3,40}$/.test(form.name.trim())) errs.name = "Use 3–40 letters";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) errs.email = "Enter a valid email";
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(form.password)) errs.password = "At least 8 characters with a letter and a number";
    if (form.confirm !== form.password) errs.confirm = "Passwords do not match";
    return errs;
  }

  async function submit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      const res = await api.post("/auth/register", { name: form.name.trim(), email: form.email, password: form.password });
      setOk(true);
      setMessage(res.data.message);
      setForm(initial);
    } catch (err) {
      setOk(false);
      setMessage(errorMessage(err));
    }
  }

  return (
    <section className="narrow">
      <h1>Create your account</h1>
      <form className="card form" onSubmit={submit} noValidate>
        {[
          ["name", "Full name", "text", "name"],
          ["email", "Email", "email", "email"],
          ["password", "Password", "password", "new-password"],
          ["confirm", "Confirm password", "password", "new-password"],
        ].map(([name, label, type, ac]) => (
          <label key={name}>
            {label}
            <input name={name} type={type} autoComplete={ac} value={form[name]} onChange={change} aria-invalid={!!errors[name]} />
            {errors[name] && <small className="field-error">{errors[name]}</small>}
          </label>
        ))}
        <button className="btn">Sign up</button>
        {message && <p className={ok ? "notice" : "error"}>{message} {ok && <Link to="/login">Log in →</Link>}</p>}
      </form>
    </section>
  );
}
