import { Sidebar } from "@/components/layout/sidebar";

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-7xl overflow-hidden bg-slate-50 shadow-2xl shadow-slate-300/30 lg:my-8 lg:min-h-[calc(100vh-4rem)] lg:rounded-[2rem]">
        <Sidebar />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
