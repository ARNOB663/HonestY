import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { dbConnect } from "../../../lib/mongodb";
import User from "../../../models/User";
import StaffManager from "../../../components/admin/StaffManager";

export const dynamic = "force-dynamic";

export default async function AdminStaff() {
  const session = await getServerSession(authOptions);
  await dbConnect();
  const docs = await User.find({ role: "admin" }).sort({ createdAt: 1 }).lean();
  const initial = docs.map((u) => ({ _id: String(u._id), email: u.email, name: u.name, createdAt: u.createdAt }));
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Staff</h1>
      <StaffManager initial={initial} currentEmail={session?.user?.email} />
    </div>
  );
}
