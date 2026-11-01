import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../api";
import { useAuth } from "../context/AuthContext.jsx";

export default function MyRegistrations() {
  const { user, ready } = useAuth();
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    api
      .get("/registrations/my")
      .then((res) => setRegs(res.data.data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [user]);

  if (!ready) return <p className="loading">Checking login…</p>;
  if (!user) return <p className="narrow">Please <Link to="/login">log in</Link> to see your registrations.</p>;

  return (
    <section>
      <h1>My registrations</h1>
      {loading && <p className="loading">Loading…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && regs.length === 0 && <p className="empty">You have not registered for any event yet. <Link to="/events">Browse events</Link></p>}
      {regs.length > 0 && (
        <table className="table">
          <thead>
            <tr><th>Event</th><th>Category</th><th>Date</th><th>Fee</th></tr>
          </thead>
          <tbody>
            {regs.map((r) => (
              <tr key={r._id}>
                <td>{r.event?.name || "(removed event)"}</td>
                <td>{r.event?.category}</td>
                <td>{r.event && new Date(r.event.date).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
                <td>{r.event ? `₹${r.event.fee}` : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
