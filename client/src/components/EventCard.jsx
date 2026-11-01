import { useCart } from "../context/CartContext.jsx";

const fmt = (d) =>
  new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

// One event, received through props
export default function EventCard({ event, onRegister, onDelete, isAdmin, busy }) {
  const { addToCart, cart } = useCart();
  const soldOut = event.seats === 0;
  const inCart = cart.some((e) => e._id === event._id);

  return (
    <article className={soldOut ? "card event-card sold-out" : "card event-card"}>
      <div className="card-top">
        <span className={`tag tag-${event.category}`}>{event.category}</span>
        {soldOut ? <span className="sold">SOLD OUT</span> : <span className="seats">{event.seats} seats left</span>}
      </div>
      <h3>{event.name}</h3>
      <p className="muted">{event.description}</p>
      <p className="meta">
        {fmt(event.date)} · {event.venue}
      </p>
      <div className="card-actions">
        <span className="fee">{event.fee === 0 ? "Free" : `₹${event.fee}`}</span>
        <button className="btn-ghost" onClick={() => addToCart(event)} disabled={inCart}>
          {inCart ? "In cart" : "Add to cart"}
        </button>
        <button className="btn" onClick={() => onRegister(event)} disabled={soldOut || busy}>
          {soldOut ? "Sold out" : "Register"}
        </button>
        {isAdmin && (
          <button className="btn-danger" onClick={() => onDelete(event)}>
            Delete
          </button>
        )}
      </div>
    </article>
  );
}
