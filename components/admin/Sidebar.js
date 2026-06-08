"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

// Small inline icons — keeps bundle light vs. an icon library.
const I = {
  dashboard: <path d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z" />,
  orders: <path d="M9 5H5v14h14V9h-4M9 5v4h4M9 5l4 4M9 13h6M9 17h6" />,
  customers: <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />,
  subscribers: <path d="M4 4h16c1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6 12 13 2 6" />,
  discounts: <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01" />,
  products: <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />,
  media: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />,
  audit: <path d="M9 11H5a2 2 0 0 0-2 2v7h18v-7a2 2 0 0 0-2-2h-4M12 3v8M8 7l4-4 4 4" />,
  pages: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" />,
  settings: <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.62.25 1.18.61 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />,
  staff: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />,
};

function Icon({ name }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      {I[name]}
    </svg>
  );
}

const GROUPS = [
  {
    title: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: "dashboard" }],
  },
  {
    title: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", icon: "orders" },
      { href: "/admin/customers", label: "Customers", icon: "customers" },
      { href: "/admin/subscribers", label: "Subscribers", icon: "subscribers" },
      { href: "/admin/discounts", label: "Discounts", icon: "discounts" },
      { href: "/admin/sales", label: "Sales groups", icon: "discounts" },
    ],
  },
  {
    title: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", icon: "products" },
      { href: "/admin/media", label: "Media", icon: "media" },
      { href: "/admin/pages", label: "Pages", icon: "pages" },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/settings", label: "Settings", icon: "settings" },
      { href: "/admin/staff", label: "Staff", icon: "staff" },
      { href: "/admin/tools", label: "Tools", icon: "settings" },
      { href: "/admin/audit", label: "Audit log", icon: "audit" },
    ],
  },
];

export default function Sidebar({ user }) {
  const pathname = usePathname();
  return (
    // sticky + h-screen so the sidebar stays pinned to the viewport as the
    // main content scrolls. Without this the sidebar grows with the page and
    // the footer (View store / Sign out) ends up below the fold.
    <aside className="w-64 shrink-0 bg-[#0f1a30] text-white sticky top-0 h-screen flex flex-col">
      <div className="px-5 py-5 border-b border-white/5">
        <Link href="/admin" className="font-serif text-xl tracking-wide">Honesty Admin</Link>
        <p className="text-[11px] text-white/50 mt-1 truncate">{user?.email}</p>
      </div>
      <nav className="flex-1 p-3 space-y-5 text-sm overflow-y-auto">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 px-3 mb-1.5">{group.title}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href ||
                  (item.href !== "/admin" && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors ${
                      active
                        ? "bg-white/10 text-white"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon name={item.icon} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-white/5 space-y-0.5 text-xs">
        <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded text-white/60 hover:bg-white/5 hover:text-white">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M10 14 21 3M21 14v7H3V3h7" /></svg>
          View store
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full text-left flex items-center gap-2 px-3 py-2 rounded text-white/60 hover:bg-white/5 hover:text-white"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}
