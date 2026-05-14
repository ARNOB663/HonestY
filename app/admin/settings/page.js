import { dbConnect } from "../../../lib/mongodb";
import Settings from "../../../models/Settings";
import SettingsForm from "../../../components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettings() {
  await dbConnect();
  const doc = await Settings.findOne({ key: "store" }).lean();
  const initial = doc ? { ...doc, _id: String(doc._id) } : null;
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <SettingsForm initial={initial} />
    </div>
  );
}
