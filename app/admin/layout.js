import { requireAdminPage } from "../../lib/adminAuth";
import Sidebar from "../../components/admin/Sidebar";

export const metadata = { title: "Admin — Honesty" };

export default async function AdminLayout({ children }) {
  const session = await requireAdminPage();
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar user={session.user} />
      <main className="flex-1 p-8 overflow-x-auto">{children}</main>
    </div>
  );
}
