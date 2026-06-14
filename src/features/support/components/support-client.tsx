"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type CSRequest = {
  id: string;
  type: string;
  message: string;
  screenshotUrl?: string;
  depositAmount?: number;
  status: string;
  adminRemark?: string;
  createdAt: string;
};

export function SupportClient() {
  const [tickets, setTickets] = useState<CSRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states
  const [type, setType] = useState("DEPOSIT_HELP");
  const [message, setMessage] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  const loadTickets = async () => {
    try {
      const res = await fetch("/api/cs/request");
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image file is too large (max 5MB).");
      return;
    }

    setError("");
    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!message.trim()) {
      setError("Please write a detailed message describing your issue.");
      return;
    }

    if (type === "DEPOSIT_HELP" && !screenshotFile) {
      setError("Deposit screenshot proof is required.");
      return;
    }

    setSubmitting(true);
    try {
      let screenshotUrl = "";

      if (screenshotFile) {
        const formData = new FormData();
        formData.append("file", screenshotFile);

        const uploadRes = await fetch("/api/upload/payment-screenshot", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.error || "Failed to upload screenshot");
        }

        const uploadData = await uploadRes.json();
        screenshotUrl = uploadData.secureUrl;
      }

      const ticketRes = await fetch("/api/cs/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          message,
          screenshotUrl,
          depositAmount: depositAmount ? Number(depositAmount) : undefined,
        }),
      });

      const ticketData = await ticketRes.json();
      if (!ticketRes.ok) {
        throw new Error(ticketData.error || "Failed to submit support request");
      }

      setSuccess("Your support ticket has been submitted successfully! An admin will review it shortly.");
      setMessage("");
      setDepositAmount("");
      setScreenshotFile(null);
      setScreenshotPreview(null);
      loadTickets();
    } catch (err: any) {
      setError(err.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-sky-50 text-sky-700 border border-sky-100";
      case "IN_PROGRESS":
        return "bg-amber-50 text-amber-700 border border-amber-100";
      case "RESOLVED":
        return "bg-emerald-50 text-emerald-700 border border-emerald-100";
      case "REJECTED":
        return "bg-rose-50 text-rose-700 border border-rose-100";
      default:
        return "bg-slate-50 text-slate-500 border border-slate-100";
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "DEPOSIT_HELP":
        return "Deposit Issue";
      case "WITHDRAWAL_HELP":
        return "Withdrawal Issue";
      case "COMBO_UNLOCK":
        return "Unlock Level Rewards";
      default:
        return "General Query / Other";
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_3fr] items-start">
      {/* Support Form */}
      <form onSubmit={handleSubmit} className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
        <h3 className="text-lg font-black text-slate-950">Create Support Ticket</h3>

        {error ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>
        ) : null}
        {success ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{success}</p>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-black text-slate-700" htmlFor="ticket-type">Issue Category</label>
          <div className="flex rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100">
            <select
              id="ticket-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-transparent px-4 py-3 text-sm font-bold text-slate-950 outline-none cursor-pointer"
            >
              <option value="DEPOSIT_HELP">Deposit Query / Blockchain Receipt Upload</option>
              <option value="WITHDRAWAL_HELP">Withdrawal Delay / Audit Issue</option>
              <option value="COMBO_UNLOCK">Unlocking Rewards Tiers</option>
              <option value="OTHER">Other general support</option>
            </select>
          </div>
        </div>

        {type === "DEPOSIT_HELP" && (
          <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
            <label className="text-sm font-black text-slate-700" htmlFor="deposit-amount">USDT Amount Sent</label>
            <div className="flex rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100">
              <span className="grid w-12 place-items-center border-r border-slate-200 text-sm font-black text-slate-500">$</span>
              <input
                id="deposit-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm font-bold text-slate-950 outline-none"
                required
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-black text-slate-700" htmlFor="ticket-message">Message Details</label>
          <div className="flex rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100">
            <textarea
              id="ticket-message"
              rows={4}
              placeholder="Explain your situation. For deposit queries, include transaction hash or blockchain details."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-transparent px-4 py-3 text-sm font-bold text-slate-950 outline-none resize-none"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-black text-slate-700">Attach Screenshot / Receipt</label>
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-indigo-400 transition bg-slate-50 rounded-2xl p-4 min-h-28 relative">
            {screenshotPreview ? (
              <div className="w-full flex flex-col items-center gap-2">
                <img src={screenshotPreview} alt="Preview" className="max-h-20 rounded border" />
                <button type="button" onClick={() => { setScreenshotFile(null); setScreenshotPreview(null); }} className="text-xs text-rose-500 hover:underline font-bold">
                  Remove screenshot
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center cursor-pointer w-full text-center">
                <svg className="w-6 h-6 text-slate-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-[11px] font-bold text-slate-500">Upload screenshot proof (max 5MB)</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-2xl bg-indigo-600 py-3.5 text-sm font-black text-white transition hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit Ticket"}
        </button>
      </form>

      {/* Ticket History */}
      <div className="space-y-6">
        <h3 className="text-xl font-black text-slate-950">Support Ticket History</h3>

        {loading ? (
          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 text-center text-slate-500 text-sm font-bold">
            Loading support history...
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 text-center text-slate-500 text-sm font-bold">
            You have not submitted any support tickets yet.
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">#{ticket.id.substring(0, 8)}</span>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-0.5">
                      {getCategoryLabel(ticket.type)}
                    </span>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${getStatusBadge(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </div>

                <div className="text-slate-800 text-sm whitespace-pre-wrap">{ticket.message}</div>

                {ticket.depositAmount && (
                  <p className="text-xs font-black text-slate-800">
                    Amount claimed: <span className="text-indigo-600">${ticket.depositAmount.toFixed(2)} USDT</span>
                  </p>
                )}

                {ticket.screenshotUrl && (
                  <div>
                    <a href={ticket.screenshotUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline font-bold flex items-center gap-1.5 w-fit">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Screenshot Proof
                    </a>
                  </div>
                )}

                {ticket.adminRemark && (
                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-3 text-xs text-rose-700 leading-normal">
                    <span className="font-extrabold block mb-0.5">Admin Response:</span>
                    {ticket.adminRemark}
                  </div>
                )}

                <div className="text-[10px] text-slate-400 font-medium pt-1">
                  Submitted: {new Date(ticket.createdAt).toLocaleDateString()} at {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
