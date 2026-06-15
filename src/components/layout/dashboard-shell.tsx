import { Sidebar } from "@/components/layout/sidebar";
import { MobileNavbar } from "@/components/layout/mobile-navbar";
import { WhatsappSupportButton } from "@/components/layout/whatsapp-support-button";
import { getCurrentUser } from "@/features/auth/services/session-service";

type DashboardShellProps = {
  children: React.ReactNode;
};

export async function DashboardShell({ children }: DashboardShellProps) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-7xl overflow-hidden bg-slate-50 shadow-2xl shadow-slate-300/30 lg:my-8 lg:min-h-[calc(100vh-4rem)] lg:rounded-[2rem]">
        <Sidebar user={user} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <MobileNavbar user={user} />
          <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">{children}</main>
          {user ? <WhatsappSupportButton /> : null}
        </div>
      </div>
    </div>
  );
}
