import Link from "next/link";
import PageForm from "../../../../components/admin/PageForm";

export default function NewPage() {
  return (
    <div className="space-y-5">
      <Link href="/admin/pages" className="text-sm text-gray-500 hover:underline">← Pages</Link>
      <h1 className="text-2xl font-semibold">New page</h1>
      <PageForm />
    </div>
  );
}
