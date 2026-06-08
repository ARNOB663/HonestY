import { prisma } from "../../../lib/db";
import SettingsForm from "../../../components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettings() {
  const doc = await prisma.settings.findUnique({ where: { storeKey: "store" } });
  const initial = doc ? { ...doc, _id: String(doc.id) } : null;
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <SettingsForm initial={initial} />
    </div>
  );
}
