import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="narrow center">
      <h1>404</h1>
      <p>Page not found.</p>
      <Link to="/" className="btn">Go home</Link>
    </section>
  );
}
