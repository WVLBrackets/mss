import { UsersAdminTab } from "@/components/admin/UsersAdminTab";

export default function AdminHomePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">Admin</h1>
      <p className="mt-1 text-sm text-neutral-600">Manage application users.</p>
      <div className="mt-6">
        <UsersAdminTab />
      </div>
    </div>
  );
}
