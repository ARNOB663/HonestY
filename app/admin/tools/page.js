import ToolsPanel from "../../../components/admin/ToolsPanel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tools — Admin" };

export default function AdminToolsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Tools</h1>
        <p className="text-sm text-gray-500 mt-1">Backups, cache reset, SMTP test, and database stats.</p>
      </div>
      <ToolsPanel />
    </div>
  );
}
