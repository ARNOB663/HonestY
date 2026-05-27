"use client";
import { SessionProvider } from "next-auth/react";
import { CartProvider } from "../context/CartContext";
import { WishlistProvider } from "../context/WishlistContext";

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <WishlistProvider>
        <CartProvider>{children}</CartProvider>
      </WishlistProvider>
    </SessionProvider>
  );
}
