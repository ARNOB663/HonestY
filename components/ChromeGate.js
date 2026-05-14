"use client";
import { usePathname } from "next/navigation";

export default function ChromeGate({ children }) {
  const pathname = usePathname() || "";
  if (pathname.startsWith("/admin")) return null;
  return children;
}
