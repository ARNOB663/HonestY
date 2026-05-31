import { getServerSession } from "next-auth";
import { unstable_cache } from "next/cache";
import { authOptions } from "../../../lib/auth";
import { dbConnect } from "../../../lib/mongodb";
import User from "../../../models/User";
import StaffManager from "../../../components/admin/StaffManager";

export const dynamic = "force-dynamic";

const cachedStaff = unstable_cache(
  async () => {
    await dbConnect();
    return User.find({ role: "admin" }).sort({ createdAt: 1 }).lean();
  },
  ["admin-staff-list-v1"],
  { revalidate: 60, tags: ["admin-staff"] }
);

export default async function AdminStaff() {
  const session = await getServerSession(authOptions);
  const docs = await cachedStaff();
  const initial = docs.map((u) => ({ _id: String(u._id), email: u.email, name: u.name, createdAt: u.createdAt }));
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Staff</h1>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
        <p className="font-semibold mb-1">How admin access works</p>
        <p className="leading-relaxed">
          Staff added here are stored in the database and can be promoted/demoted live — no redeploy needed.
          They are <strong>separate</strong> from the <code className="bg-blue-100 px-1 rounded">ADMIN_EMAIL</code> environment
          variable (the owner accounts), which is set on Vercel and survives database changes.
        </p>
        <p className="mt-2 text-blue-800/80">
          Best practice: keep your personal email as <code className="bg-blue-100 px-1 rounded">ADMIN_EMAIL</code>,
          add everyone else here so you can revoke access in 2 clicks.
        </p>
      </div>
      <StaffManager initial={initial} currentEmail={session?.user?.email} />
    </div>
  );
}
