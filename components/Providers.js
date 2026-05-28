"use client";
import { SessionProvider } from "next-auth/react";
import { CartProvider } from "../context/CartContext";
import { WishlistProvider } from "../context/WishlistContext";
import { ToastProvider } from "../context/ToastContext";

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <WishlistProvider>
          <CartProvider>{children}</CartProvider>
        </WishlistProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
