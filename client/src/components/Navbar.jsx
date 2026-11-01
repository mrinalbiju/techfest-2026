import { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { cart } = useCart();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const close = () => setOpen(false);
  const handleLogout = async () => {
    await logout();
    close();
    navigate("/");
  };

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="brand" onClick={close}>
          <span className="brand-mark">TF</span> TechFest <b>2026</b>
        </Link>
        <button className="menu-btn" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen(!open)}>
          ☰
        </button>
        <nav className={open ? "nav-links open" : "nav-links"}>
          <NavLink to="/" end onClick={close}>Home</NavLink>
          <NavLink to="/events" onClick={close}>Events</NavLink>
          <NavLink to="/gallery" onClick={close}>Gallery</NavLink>
          <NavLink to="/contact" onClick={close}>Contact</NavLink>
          {user ? (
            <>
              <NavLink to="/my-registrations" onClick={close}>My Registrations</NavLink>
              <button className="link-btn" onClick={handleLogout}>Logout ({user.name.split(" ")[0]})</button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={close}>Login</NavLink>
              <NavLink to="/register" onClick={close} className="nav-cta">Sign up</NavLink>
            </>
          )}
          <NavLink to="/cart" onClick={close}>
            Cart <span className="badge">{cart.length}</span>
          </NavLink>
          <button className="theme-btn" onClick={toggleTheme} title="Switch light / dark theme">
            {theme === "light" ? "☾ Dark" : "☀ Light"}
          </button>
        </nav>
      </div>
    </header>
  );
}
