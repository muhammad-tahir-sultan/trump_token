import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AdminClient } from "@/features/admin/components/admin-client";

export default function AdminPage() {
  return (
    <DashboardShell>
      <div className="h-full overflow-y-auto px-5 py-6 sm:px-8 space-y-8">
        <AdminClient />
      </div>
    </DashboardShell>
  );
}
