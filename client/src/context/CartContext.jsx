import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  const addToCart = (event) =>
    setCart((items) => (items.some((e) => e._id === event._id) ? items : [...items, event]));
  const removeFromCart = (id) => setCart((items) => items.filter((e) => e._id !== id));
  const total = cart.reduce((sum, e) => sum + e.fee, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, total }}>{children}</CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
