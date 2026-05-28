"use client";
import { SessionProvider } from "next-auth/react";
import { CartProvider } from "../context/CartContext";
import { WishlistProvider } from "../context/WishlistContext";
import { ToastProvider } from "../context/ToastContext";
import CartDrawer from "./CartDrawer";

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <WishlistProvider>
          <CartProvider>
            {children}
            {/* Drawer renders only when open, so closed state is zero DOM cost. */}
            <CartDrawer />
          </CartProvider>
        </WishlistProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
