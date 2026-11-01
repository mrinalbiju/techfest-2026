import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";

// Code splitting: every page except Home is downloaded only when it is first visited
const Events = lazy(() => import("./pages/Events.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const MyRegistrations = lazy(() => import("./pages/MyRegistrations.jsx"));
const Gallery = lazy(() => import("./pages/Gallery.jsx"));
const Contact = lazy(() => import("./pages/Contact.jsx"));
const Cart = lazy(() => import("./pages/Cart.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Suspense fallback={<p className="loading">Loading…</p>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<Events />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/my-registrations" element={<MyRegistrations />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
