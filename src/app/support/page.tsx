import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SupportClient } from "@/features/support/components/support-client";

export default function SupportPage() {
  return (
    <DashboardShell>
      <div className="h-full overflow-y-auto px-5 py-6 sm:px-8 space-y-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-500">Support</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Customer Service</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Submit an official support request or upload transaction screenshots to update your status.
          </p>
        </div>

        <SupportClient />
      </div>
    </DashboardShell>
  );
}
