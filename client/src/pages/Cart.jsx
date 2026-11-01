import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

export default function Cart() {
  const { cart, removeFromCart, total } = useCart();
  return (
    <section className="narrow">
      <h1>Your cart</h1>
      {cart.length === 0 ? (
        <p className="empty">Cart is empty. <Link to="/events">Add events</Link></p>
      ) : (
        <>
          <ul className="cart-list">
            {cart.map((e) => (
              <li key={e._id} className="card">
                <span>{e.name}</span>
                <span>₹{e.fee}</span>
                <button className="btn-ghost" onClick={() => removeFromCart(e._id)}>Remove</button>
              </li>
            ))}
          </ul>
          <p className="total">Total: <b>₹{total}</b></p>
        </>
      )}
    </section>
  );
}
