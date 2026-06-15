import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentUser } from "@/features/auth/services/session-service";
import { ProfileSummary } from "@/features/wallet/components/profile-summary";
import { getWalletSummary } from "@/features/wallet/services/wallet-store";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const wallet = await getWalletSummary(user.id);

  return (
    <DashboardShell>
      <div className="h-full overflow-y-auto px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        <ProfileSummary user={user} wallet={wallet} />
      </div>
    </DashboardShell>
  );
}
