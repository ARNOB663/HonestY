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
      <StaffManager initial={initial} currentEmail={session?.user?.email} />
    </div>
  );
}
