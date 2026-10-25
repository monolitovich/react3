import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const CART_STORAGE_KEY = 'salon_cart_state';

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart = (service) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === service.id);
      if (existing) {
        return prev.map((item) =>
          item.id === service.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...service, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const subtotal = cart.reduce(
    (acc, item) => acc + Number(item.final_price || item.price) * item.quantity,
    0
  );

  const personalDiscountPercent = user?.coupon?.discount_percent || 0;
  const personalDiscountAmount = (subtotal * personalDiscountPercent) / 100;
  const finalTotal = Math.max(0, subtotal - personalDiscountAmount);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItemsCount,
        subtotal: subtotal.toFixed(2),
        personalDiscountPercent,
        personalDiscountAmount: personalDiscountAmount.toFixed(2),
        finalTotal: finalTotal.toFixed(2),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);