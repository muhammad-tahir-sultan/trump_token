"use client";

import { useEffect, useState } from "react";
import { AdminStatsPanel } from "@/features/admin/components/admin-stats-panel";
import { AdminUsersPanel } from "@/features/admin/components/admin-users-panel";
import type { AdminPlatformStats } from "@/features/admin/services/admin-stats-store";

type Transaction = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: string;
  amountCents: number;
  status: string;
  depositAddress?: string;
  withdrawAddress?: string;
  withdrawNetwork?: string;
  screenshotUrl?: string;
  adminRemark?: string;
  createdAt: string;
};

type CSRequest = {
  id: string;
  userId: string;
  userName: string;
  type: string;
  message: string;
  screenshotUrl?: string;
  depositAmount?: number;
  status: string;
  adminRemark?: string;
  createdAt: string;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  referralCode: string;
  balanceCents: number;
  totalDepositedCents: number;
  totalWithdrawnCents: number;
  createdAt: string;
};

export function AdminClient() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "config" | "transactions" | "support" | "users"
  >("overview");
  const [isAdmin, setIsAdmin] = useState(false);
  const [verifying, setVerifying] = useState(true);

  // Platform stats state
  const [stats, setStats] = useState<AdminPlatformStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Address config state
  const [configAddress, setConfigAddress] = useState("");
  const [configNetwork, setConfigNetwork] = useState("TRON (TRC-20)");
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState("");
  const [configSuccess, setConfigSuccess] = useState("");

  // WhatsApp support config state
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappToggleLoading, setWhatsappToggleLoading] = useState(false);
  const [whatsappError, setWhatsappError] = useState("");
  const [whatsappSuccess, setWhatsappSuccess] = useState("");

  // Transactions state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [txFilter, setTxFilter] = useState("pending");
  const [txRemark, setTxRemark] = useState<{ [key: string]: string }>({});

  // Support Tickets state
  const [tickets, setTickets] = useState<CSRequest[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketFilter, setTicketFilter] = useState("OPEN");
  const [ticketRemark, setTicketRemark] = useState<{ [key: string]: string }>({});

  // Users state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Load and check user session role
  useEffect(() => {
    const checkRole = async () => {
      try {
        const res = await fetch("/api/deposit/address"); 
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }

        const txRes = await fetch("/api/admin/transactions");
        if (txRes.status === 401 || txRes.status === 403) {
          window.location.href = "/";
          return;
        }
        setIsAdmin(true);
        const data = await txRes.json();
        setTransactions(data);
      } catch (err) {
        console.error("Verification failed:", err);
        window.location.href = "/";
      } finally {
        setVerifying(false);
      }
    };
    checkRole();
  }, []);

  // Fetch active deposit address
  const fetchAddress = async () => {
    try {
      const res = await fetch("/api/deposit/address");
      if (res.ok) {
        const data = await res.json();
        setConfigAddress(data.address || "");
        setConfigNetwork(data.network || "TRON (TRC-20)");
      }
    } catch (err) {
      console.error("Failed to load address config:", err);
    }
  };

  const fetchWhatsappSupport = async () => {
    try {
      const res = await fetch("/api/support/whatsapp");
      if (res.ok) {
        const data = await res.json();
        setWhatsappNumber(data.phoneNumber || "");
        setWhatsappEnabled(Boolean(data.enabled));
      }
    } catch (err) {
      console.error("Failed to load WhatsApp config:", err);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch transactions list
  const fetchTransactions = async () => {
    setTxLoading(true);
    try {
      const res = await fetch("/api/admin/transactions");
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error("Failed to load transactions:", err);
    } finally {
      setTxLoading(false);
    }
  };

  // Fetch support requests
  const fetchTickets = async () => {
    setTicketsLoading(true);
    try {
      const res = await fetch("/api/admin/cs-requests");
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error("Failed to load support requests:", err);
    } finally {
      setTicketsLoading(false);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  // Trigger loading when activeTab changes
  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === "overview") {
      fetchStats();
    } else if (activeTab === "config") {
      fetchAddress();
      fetchWhatsappSupport();
    } else if (activeTab === "transactions") {
      fetchTransactions();
    } else if (activeTab === "support") {
      fetchTickets();
    } else if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab, isAdmin]);

  // Handle deposit address update
  const handleUpdateConfigAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigLoading(true);
    setConfigError("");
    setConfigSuccess("");

    if (!configAddress.trim()) {
      setConfigError("Address is required.");
      setConfigLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/deposit-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: configAddress,
          network: configNetwork,
        }),
      });

      if (res.ok) {
        setConfigSuccess("Deposit address and network updated successfully!");
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to update config");
      }
    } catch (err: any) {
      setConfigError(err.message || "Failed to update configuration.");
    } finally {
      setConfigLoading(false);
    }
  };

  const handleToggleWhatsappSupport = async () => {
    const nextEnabled = !whatsappEnabled;

    if (nextEnabled && !whatsappNumber.trim()) {
      setWhatsappError("Add a WhatsApp number before enabling the button.");
      setWhatsappSuccess("");
      return;
    }

    setWhatsappToggleLoading(true);
    setWhatsappError("");
    setWhatsappSuccess("");

    try {
      const res = await fetch("/api/admin/support-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: nextEnabled }),
      });

      if (res.ok) {
        const data = await res.json();
        setWhatsappEnabled(Boolean(data.enabled));
        setWhatsappSuccess(
          data.enabled
            ? "WhatsApp button is now visible to users."
            : "WhatsApp button is now hidden from users.",
        );
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to update WhatsApp visibility");
      }
    } catch (err: any) {
      setWhatsappError(err.message || "Failed to update WhatsApp visibility.");
    } finally {
      setWhatsappToggleLoading(false);
    }
  };

  const handleUpdateWhatsappSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    setWhatsappLoading(true);
    setWhatsappError("");
    setWhatsappSuccess("");

    if (!whatsappNumber.trim()) {
      setWhatsappError("WhatsApp number is required.");
      setWhatsappLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/support-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: whatsappNumber }),
      });

      if (res.ok) {
        const data = await res.json();
        setWhatsappNumber(data.phoneNumber || whatsappNumber);
        setWhatsappEnabled(Boolean(data.enabled));
        setWhatsappSuccess("WhatsApp customer service number updated successfully!");
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to update WhatsApp number");
      }
    } catch (err: any) {
      setWhatsappError(err.message || "Failed to update WhatsApp number.");
    } finally {
      setWhatsappLoading(false);
    }
  };

  // Handle Transaction audit approval/rejection
  const handleTransactionAudit = async (action: "approve" | "reject", tx: Transaction) => {
    const remark = txRemark[tx.id] || "";
    if (action === "reject" && !remark.trim()) {
      alert("Please enter a rejection reason.");
      return;
    }

    try {
      const res = await fetch("/api/admin/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          userId: tx.userId,
          transactionId: tx.id,
          remark,
        }),
      });

      if (res.ok) {
        fetchTransactions();
        setTxRemark(prev => {
          const next = { ...prev };
          delete next[tx.id];
          return next;
        });
      } else {
        const data = await res.json();
        alert(data.error || "Operation failed");
      }
    } catch (err: any) {
      alert("Error processing transaction request.");
    }
  };

  // Handle support ticket resolution/rejection
  const handleTicketAudit = async (status: "RESOLVED" | "REJECTED", ticket: CSRequest) => {
    const remark = ticketRemark[ticket.id] || "";

    try {
      const res = await fetch("/api/admin/cs-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: ticket.id,
          status,
          remark,
        }),
      });

      if (res.ok) {
        fetchTickets();
        setTicketRemark(prev => {
          const next = { ...prev };
          delete next[ticket.id];
          return next;
        });
      } else {
        const data = await res.json();
        alert(data.error || "Operation failed");
      }
    } catch (err: any) {
      alert("Error resolving support request.");
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-bold text-slate-500">Verifying Admin session...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const filteredTransactions = transactions.filter(t => {
    if (txFilter === "all") return true;
    return t.status === txFilter;
  });

  const filteredTickets = tickets.filter(t => {
    if (ticketFilter === "all") return true;
    return t.status === ticketFilter;
  });

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-500">Admin Control Center</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Administrative Panel</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Manage blockchain deposit settings, audit withdrawals/deposits, and solve support tickets.
          </p>
        </div>
      </div>

      {/* Tab Selection */}
      <div className="flex border-b border-slate-200 gap-6 overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-4 text-sm font-black transition relative ${activeTab === "overview" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-400 hover:text-slate-900"}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("transactions")}
          className={`pb-4 text-sm font-black transition relative ${activeTab === "transactions" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-400 hover:text-slate-900"}`}
        >
          Transactions Audit ({transactions.filter(t => t.status === "pending").length})
        </button>
        <button
          onClick={() => setActiveTab("support")}
          className={`pb-4 text-sm font-black transition relative ${activeTab === "support" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-400 hover:text-slate-900"}`}
        >
          Support Tickets ({tickets.filter(t => t.status === "OPEN").length})
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-4 text-sm font-black transition relative ${activeTab === "users" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-400 hover:text-slate-900"}`}
        >
          Users Management
        </button>
        <button
          onClick={() => setActiveTab("config")}
          className={`pb-4 text-sm font-black transition relative ${activeTab === "config" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-400 hover:text-slate-900"}`}
        >
          QR & Deposit Config
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="animate-in fade-in duration-200">
          {statsLoading && !stats ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 text-center text-sm font-bold text-slate-500 sm:rounded-3xl sm:p-8">
              Loading platform statistics...
            </div>
          ) : stats ? (
            <AdminStatsPanel stats={stats} />
          ) : (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 text-center text-sm font-bold text-slate-500 sm:rounded-3xl sm:p-8">
              Unable to load platform statistics.
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Config */}
      {activeTab === "config" && (
        <div className="space-y-6 max-w-xl animate-in fade-in duration-200">
          <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-950 mb-4">Set Global Deposit Wallet</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Updating this address will immediately change the copyable wallet address shown to all users on the deposit page. The scan QR image is fixed.
            </p>

            {configError ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 mb-6">{configError}</p>
            ) : null}
            {configSuccess ? (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 mb-6">{configSuccess}</p>
            ) : null}

            <form onSubmit={handleUpdateConfigAddress} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700" htmlFor="config-network">Network Label</label>
                <div className="flex rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100">
                  <input
                    id="config-network"
                    type="text"
                    placeholder="TRON (TRC-20)"
                    value={configNetwork}
                    onChange={(e) => setConfigNetwork(e.target.value)}
                    className="w-full bg-transparent px-4 py-3 text-sm font-bold text-slate-950 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700" htmlFor="config-address">USDT Wallet Address</label>
                <div className="flex rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100">
                  <input
                    id="config-address"
                    type="text"
                    placeholder="Enter TRON deposit address"
                    value={configAddress}
                    onChange={(e) => setConfigAddress(e.target.value)}
                    className="w-full bg-transparent px-4 py-3 text-sm font-bold text-slate-950 outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={configLoading}
                className="rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-black text-white hover:bg-indigo-700 transition"
              >
                {configLoading ? "Saving..." : "Update Configuration"}
              </button>
            </form>
          </section>

          <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-950 mb-4">Customer Service WhatsApp</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Control the floating &quot;Contact Customer Service&quot; button for logged-in users. Save a number first, then enable it when you want it visible on the website.
            </p>

            <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div>
                <p className="text-sm font-black text-slate-900">Show WhatsApp button</p>
                <p className="text-xs text-slate-500 mt-1">
                  {whatsappEnabled
                    ? "Visible to all logged-in users"
                    : "Hidden from users (disabled)"}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={whatsappEnabled}
                aria-label="Toggle WhatsApp button visibility"
                disabled={whatsappToggleLoading}
                onClick={handleToggleWhatsappSupport}
                className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition ${
                  whatsappEnabled ? "bg-[#25D366]" : "bg-slate-300"
                } disabled:opacity-60`}
              >
                <span
                  className={`inline-block size-6 transform rounded-full bg-white shadow transition ${
                    whatsappEnabled ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {whatsappError ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 mb-6">{whatsappError}</p>
            ) : null}
            {whatsappSuccess ? (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 mb-6">{whatsappSuccess}</p>
            ) : null}

            <form onSubmit={handleUpdateWhatsappSupport} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700" htmlFor="config-whatsapp">WhatsApp Number</label>
                <div className="flex rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
                  <input
                    id="config-whatsapp"
                    type="tel"
                    placeholder="923001234567"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="w-full bg-transparent px-4 py-3 text-sm font-bold text-slate-950 outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={whatsappLoading}
                className="rounded-2xl bg-[#25D366] px-6 py-3.5 text-sm font-black text-white hover:bg-[#1ebe5d] transition"
              >
                {whatsappLoading ? "Saving..." : "Update WhatsApp Number"}
              </button>
            </form>
          </section>
        </div>
      )}

      {/* Tab Content: Transactions */}
      {activeTab === "transactions" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Filter buttons */}
          <div className="flex gap-2 flex-wrap">
            {["pending", "completed", "rejected", "all"].map((status) => (
              <button
                key={status}
                onClick={() => setTxFilter(status)}
                className={`px-4 py-2 rounded-full text-xs font-bold capitalize transition border ${txFilter === status ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}
              >
                {status}
              </button>
            ))}
          </div>

          {txLoading && transactions.length === 0 ? (
            <div className="rounded-3xl bg-white border border-slate-200/80 p-8 text-center text-slate-500 text-sm font-bold">
              Loading transactions list...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="rounded-3xl bg-white border border-slate-200/80 p-8 text-center text-slate-500 text-sm font-bold">
              No transactions match the selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[2rem] border border-slate-200/80 bg-white shadow-sm">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-[0.16em] text-slate-400 bg-slate-50">
                    <th className="py-4 px-6">User</th>
                    <th className="py-4 px-4">Type</th>
                    <th className="py-4 px-4">Amount</th>
                    <th className="py-4 px-4">Details</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4">Action Audits</th>
                    <th className="py-4 px-6">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => {
                    const isPending = tx.status === "pending";
                    return (
                      <tr key={tx.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                        <td className="py-5 px-6 font-bold text-slate-950">
                          <div>{tx.userName}</div>
                          <div className="text-xs font-normal text-slate-400">{tx.userEmail}</div>
                        </td>
                        <td className="py-5 px-4 font-extrabold">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-black capitalize ${tx.type === "deposit" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-5 px-4 font-black text-slate-950">${(tx.amountCents / 100).toFixed(2)}</td>
                        <td className="py-5 px-4 text-xs text-slate-500 max-w-[200px] break-all leading-normal">
                          {tx.type === "deposit" ? (
                            <>
                              <div>Via TRC-20 Address</div>
                              {tx.screenshotUrl && (
                                <a href={tx.screenshotUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-bold mt-1 inline-block">
                                  View Receipt Proof
                                </a>
                              )}
                            </>
                          ) : (
                            <>
                              <div>To Address: <span className="font-mono">{tx.withdrawAddress}</span></div>
                              <div className="font-semibold text-slate-600">Network: {tx.withdrawNetwork}</div>
                            </>
                          )}
                        </td>
                        <td className="py-5 px-4">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold capitalize ${tx.status === "pending" ? "text-amber-700 bg-amber-50 border border-amber-100" : tx.status === "completed" ? "text-emerald-700 bg-emerald-50 border border-emerald-100" : "text-rose-700 bg-rose-50 border border-rose-100"}`}>
                            {tx.status}
                          </span>
                          {tx.adminRemark && <p className="text-[10px] text-rose-500 font-bold mt-1 max-w-[150px]">{tx.adminRemark}</p>}
                        </td>
                        <td className="py-5 px-4">
                          {isPending ? (
                            <div className="flex flex-col gap-2 min-w-[220px]">
                              <input
                                type="text"
                                placeholder="Reject remark (required if rejecting)"
                                value={txRemark[tx.id] || ""}
                                onChange={(e) => setTxRemark(prev => ({ ...prev, [tx.id]: e.target.value }))}
                                className="border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold w-full outline-none focus:border-indigo-400"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleTransactionAudit("approve", tx)}
                                  className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-1.5 transition"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleTransactionAudit("reject", tx)}
                                  className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-1.5 transition"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Processed</span>
                          )}
                        </td>
                        <td className="py-5 px-6 text-xs text-slate-400">
                          {new Date(tx.createdAt).toLocaleDateString()}<br />
                          {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Support */}
      {activeTab === "support" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Filter buttons */}
          <div className="flex gap-2 flex-wrap">
            {["OPEN", "IN_PROGRESS", "RESOLVED", "REJECTED", "all"].map((status) => (
              <button
                key={status}
                onClick={() => setTicketFilter(status)}
                className={`px-4 py-2 rounded-full text-xs font-bold capitalize transition border ${ticketFilter === status ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}
              >
                {status}
              </button>
            ))}
          </div>

          {ticketsLoading && tickets.length === 0 ? (
            <div className="rounded-3xl bg-white border border-slate-200/80 p-8 text-center text-slate-500 text-sm font-bold">
              Loading support tickets...
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="rounded-3xl bg-white border border-slate-200/80 p-8 text-center text-slate-500 text-sm font-bold">
              No tickets found for this status.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => {
                const isOpen = ticket.status === "OPEN" || ticket.status === "IN_PROGRESS";
                return (
                  <div key={ticket.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <span className="text-xs font-bold text-slate-400 mr-2">#{ticket.id.substring(0, 8)}</span>
                        <span className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">{ticket.userName}</span>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${ticket.status === "OPEN" ? "bg-sky-50 text-sky-700 border border-sky-100" : ticket.status === "IN_PROGRESS" ? "bg-amber-50 text-amber-700 border border-amber-100" : ticket.status === "RESOLVED" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"}`}>
                        {ticket.status}
                      </span>
                    </div>

                    <div className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">{ticket.message}</div>

                    {ticket.depositAmount && (
                      <p className="text-xs font-black text-slate-900 bg-slate-50 px-3 py-1.5 rounded-lg border w-fit">
                        Reported Transfer Amount: <span className="text-indigo-600">${ticket.depositAmount.toFixed(2)} USDT</span>
                      </p>
                    )}

                    {ticket.screenshotUrl && (
                      <div>
                        <a href={ticket.screenshotUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline font-bold flex items-center gap-1.5 w-fit">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View screenshot attachment
                        </a>
                      </div>
                    )}

                    <div className="border-t border-slate-100 pt-4 flex flex-col md:flex-row md:items-end gap-4 justify-between">
                      <div className="flex-1 max-w-xl">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Admin Remarks / Reply note</label>
                        <input
                          type="text"
                          placeholder="Add response detail to user ticket..."
                          value={ticketRemark[ticket.id] || ""}
                          onChange={(e) => setTicketRemark(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                          className="border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold w-full outline-none focus:border-indigo-400 bg-slate-50"
                        />
                      </div>

                      {isOpen ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleTicketAudit("RESOLVED", ticket)}
                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2 transition"
                          >
                            Mark Resolved
                          </button>
                          <button
                            onClick={() => handleTicketAudit("REJECTED", ticket)}
                            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-4 py-2 transition"
                          >
                            Reject Ticket
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 font-bold italic">Closed</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Users Management */}
      {activeTab === "users" && (
        <div className="space-y-4 animate-in fade-in duration-200 sm:space-y-6">
          {usersLoading && users.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 text-center text-xs font-bold text-slate-500 sm:rounded-3xl sm:p-8 sm:text-sm">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 text-center text-xs font-bold text-slate-500 sm:rounded-3xl sm:p-8 sm:text-sm">
              No users found.
            </div>
          ) : (
            <AdminUsersPanel users={users} onRefresh={fetchUsers} />
          )}
        </div>
      )}
    </>
  );
}
