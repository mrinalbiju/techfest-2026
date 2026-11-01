import { useEffect, useState } from "react";
import api, { errorMessage } from "../api";

export default function Contact() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  const load = () => api.get("/feedback").then((res) => setItems(res.data.data)).catch(() => {});

  useEffect(() => {
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();
    try {
      await api.post("/feedback", { name, message });
      setName("");
      setMessage("");
      setStatus("Thanks for your feedback!");
      load();
    } catch (err) {
      setStatus(errorMessage(err));
    }
  }

  return (
    <section className="contact">
      <div>
        <h1>Contact</h1>
        <dl className="card">
          <dt>Faculty coordinator</dt><dd>Department of CSE, MBCET</dd>
          <dt>Email</dt><dd><a href="mailto:techfest@mbcet.ac.in">techfest@mbcet.ac.in</a></dd>
          <dt>Venue</dt><dd>Mar Ivanios Vidya Nagar, Nalanchira, Thiruvananthapuram</dd>
        </dl>
        <form className="card form" onSubmit={submit}>
          <h2>Leave feedback</h2>
          <label>Your name<input value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} /></label>
          <label>Message<textarea rows="3" value={message} onChange={(e) => setMessage(e.target.value)} required maxLength={500} /></label>
          <button className="btn">Send</button>
          {status && <p className="notice" role="status">{status}</p>}
        </form>
      </div>
      <div>
        <h2>What people said</h2>
        <ul className="feedback-list" id="feedback-list">
          {items.map((f) => (
            <li key={f._id} className="card">
              <b>{f.name}</b>
              {/* XSS fix: render user text as plain text — React escapes < > & " */}
              <p>{f.message}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
