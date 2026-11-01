import { Link } from "react-router-dom";

const highlights = [
  { title: "24h Hackathon", text: "Build overnight with mentors from industry." },
  { title: "RoboWars", text: "Bot-vs-bot combat in the open arena." },
  { title: "Workshops", text: "MERN, TinyML and more — hands-on." },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <img className="hero-img" src="/images/hero.png" />
        <div className="hero-text">
          <p className="eyebrow">MBCET · 10–12 December 2026</p>
          <h1>TechFest 2026</h1>
          <p className="lead">Three days of code, robots and ideas. Register for events, track your seats and meet builders from across Kerala.</p>
          <div className="hero-actions">
            <Link to="/events" className="btn">Browse events</Link>
            <Link to="/register" className="btn-ghost">Create account</Link>
          </div>
        </div>
      </section>

      <section>
        <h2>Highlights</h2>
        <div className="cards">
          {highlights.map((h) => (
            <div className="card" key={h.title}>
              <h3>{h.title}</h3>
              <p className="muted">{h.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="announce">
        <h2>Announcements</h2>
        <ul>
          <li>Early-bird registration closes 30 November.</li>
          <li>Hackathon problem statements release on 5 December.</li>
        </ul>
      </section>
    </>
  );
}
