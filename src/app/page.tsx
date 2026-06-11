import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardContent } from "@/features/dashboard/components/dashboard-content";
import { getCurrentUser } from "@/features/auth/services/session-service";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardShell>
      <DashboardContent user={user} />
    </DashboardShell>
  );
}
