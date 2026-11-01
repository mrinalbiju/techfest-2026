import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { errorMessage } from "../api";
import EventList from "../components/EventList.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const emptyEvent = { name: "", category: "technical", fee: 0, seats: 30, date: "", venue: "", description: "" };

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("date");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(emptyEvent);
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  async function loadEvents() {
    try {
      const res = await api.get("/events");
      setEvents(res.data.data);
      setError("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = events.filter(
      (e) => (category === "all" || e.category === category) && e.name.toLowerCase().includes(q)
    );
    const by = { date: (a, b) => new Date(a.date) - new Date(b.date), fee: (a, b) => a.fee - b.fee, name: (a, b) => a.name.localeCompare(b.name) };
    return [...list].sort(by[sort]);
  }, [events, search, category, sort]);

  async function registerForEvent(event) {
    if (!user) return navigate("/login", { state: { from: "/events" } });
    setBusy(true);
    try {
      const res = await api.post("/registrations", { eventId: event._id });
      setNotice(res.data.message);
      await loadEvents();
    } catch (err) {
      setNotice(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function deleteEvent(event) {
    if (!confirm(`Delete ${event.name}?`)) return;
    try {
      await api.delete(`/events/${event._id}`);
      await loadEvents();
    } catch (err) {
      setNotice(errorMessage(err));
    }
  }

  async function addEvent(e) {
    e.preventDefault();
    try {
      await api.post("/events", { ...form, fee: Number(form.fee), seats: Number(form.seats) });
      setForm(emptyEvent);
      setNotice("Event added");
      await loadEvents();
    } catch (err) {
      setNotice(errorMessage(err));
    }
  }

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <section>
      <h1>Events</h1>
      <div className="toolbar">
        <input type="search" placeholder="Search events…" aria-label="Search events" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All categories</option>
          <option value="technical">Technical</option>
          <option value="non-technical">Non-technical</option>
          <option value="workshop">Workshop</option>
        </select>
        <select aria-label="Sort by" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="date">Sort: date</option>
          <option value="fee">Sort: fee</option>
          <option value="name">Sort: name</option>
        </select>
      </div>

      {notice && <p className="notice" role="status">{notice}</p>}
      {loading && <p className="loading">Loading events…</p>}
      {error && <p className="error">Could not load events: {error}</p>}
      {!loading && !error && (
        <EventList events={shown} onRegister={registerForEvent} onDelete={deleteEvent} isAdmin={isAdmin} busy={busy} />
      )}

      {isAdmin && (
        <form className="card admin-form" onSubmit={addEvent}>
          <h2>Add event (admin)</h2>
          <div className="grid-2">
            <label>Name<input name="name" value={form.name} onChange={change} required /></label>
            <label>Category
              <select name="category" value={form.category} onChange={change}>
                <option value="technical">Technical</option>
                <option value="non-technical">Non-technical</option>
                <option value="workshop">Workshop</option>
              </select>
            </label>
            <label>Fee (₹)<input name="fee" type="number" min="0" value={form.fee} onChange={change} /></label>
            <label>Seats<input name="seats" type="number" min="0" value={form.seats} onChange={change} /></label>
            <label>Date<input name="date" type="datetime-local" value={form.date} onChange={change} required /></label>
            <label>Venue<input name="venue" value={form.venue} onChange={change} /></label>
          </div>
          <label>Description<textarea name="description" rows="2" value={form.description} onChange={change} /></label>
          <button className="btn">Add event</button>
        </form>
      )}
    </section>
  );
}
