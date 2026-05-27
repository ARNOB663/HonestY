"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/subscribers", label: "Subscribers" },
  { href: "/admin/discounts", label: "Discounts" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/audit", label: "Audit log" },
  { href: "/admin/pages", label: "Pages" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/staff", label: "Staff" },
];

export default function Sidebar({ user }) {
  const pathname = usePathname();
  return (
    <aside className="w-60 shrink-0 bg-[#1a2b4a] text-white min-h-screen flex flex-col">
      <div className="px-5 py-5 border-b border-white/10">
        <Link href="/admin" className="font-serif text-xl tracking-wide">Honesty Admin</Link>
        <p className="text-[11px] text-white/60 mt-1 truncate">{user?.email}</p>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 text-sm">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded transition-colors ${
                active ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-white/10 space-y-1 text-xs">
        <Link href="/" className="block px-3 py-2 rounded text-white/70 hover:bg-white/10">View store →</Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full text-left px-3 py-2 rounded text-white/70 hover:bg-white/10"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
