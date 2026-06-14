"use client";

import { useState } from "react";
import { formatCurrency } from "@/features/wallet/services/currency";
import Link from "next/link";

type DepositFormProps = {
  balanceCents: number;
};

const QUICK_AMOUNTS = [50, 100, 200, 500];

export function DepositForm({ balanceCents }: DepositFormProps) {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const [addrInfo, setAddrInfo] = useState({
    address: "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb",
    network: "TRON (TRC-20)",
  });

  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  const fetchDepositAddress = async () => {
    setLoadingAddress(true);
    try {
      const res = await fetch("/api/deposit/address");
      if (res.ok) {
        const data = await res.json();
        if (data.address) {
          setAddrInfo(data);
        }
      }
    } catch (err) {
      console.error("Failed to load deposit address:", err);
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleContinue = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = Number(amount);
    if (!amount || isNaN(val) || val < 10) {
      setError("Minimum deposit is $10.00.");
      return;
    }
    setError("");
    setStep(2);
    await fetchDepositAddress();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(addrInfo.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (screenshot).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be 5MB or less.");
      return;
    }

    setError("");
    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const handleSubmitDeposit = async () => {
    if (!screenshotFile) {
      setError("Please upload your payment screenshot proof.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      // 1. Upload screenshot
      const uploadFormData = new FormData();
      uploadFormData.append("file", screenshotFile);

      const uploadRes = await fetch("/api/upload/payment-screenshot", {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.error || "Failed to upload screenshot");
      }

      const { secureUrl } = await uploadRes.json();

      // 2. Submit transaction
      const txRes = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "deposit",
          amount: Number(amount),
          depositAddress: addrInfo.address,
          screenshotUrl: secureUrl,
        }),
      });

      if (!txRes.ok) {
        const errData = await txRes.json();
        throw new Error(errData.error || "Failed to submit transaction");
      }

      // 3. Submit Customer Service request for admin notifications
      await fetch("/api/cs/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "DEPOSIT_HELP",
          message: `Deposit request submitted for $${Number(amount).toFixed(2)}. Address: ${addrInfo.address}`,
          screenshotUrl: secureUrl,
          depositAmount: Number(amount),
        }),
      }).catch(err => console.error("CS request log failed, but transaction logged:", err));

      setSuccess("Deposit request submitted successfully! Pending admin approval.");
      setStep(3);
    } catch (err: any) {
      setError(err.message || "Failed to submit deposit request");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 3) {
    return (
      <section className="rounded-[2.5rem] border-0 bg-white p-10 shadow-2xl shadow-indigo-100/50 text-center max-w-xl mx-auto my-8 relative overflow-hidden animate-in zoom-in-95 duration-500">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-400"></div>
        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mb-8 shadow-inner border border-white">
          <svg className="w-12 h-12 text-emerald-500 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Deposit Submitted</h2>
        <p className="mt-4 text-base leading-relaxed text-slate-500">
          Your request of <span className="font-black text-slate-900">${Number(amount).toFixed(2)}</span> is under review.
        </p>

        <div className="mt-8 bg-slate-50 border border-slate-100 rounded-3xl p-6 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 4l7.5 15h-15L12 6z"/></svg>
          </div>
          <h4 className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em] mb-4 relative z-10">Verification Steps</h4>
          <ol className="text-sm text-slate-600 space-y-3 list-decimal list-inside font-medium relative z-10">
            <li>Admin verifies the blockchain receipt.</li>
            <li>Your funds are credited to your account.</li>
            <li>Check status via transaction history.</li>
          </ol>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/history" className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-sm font-black text-white shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all">
            Track Status
          </Link>
          <button onClick={() => { setStep(1); setAmount(""); setSuccess(""); }} className="rounded-full border-2 border-slate-100 px-8 py-4 text-sm font-black text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all">
            New Deposit
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[2.5rem] bg-white p-8 sm:p-10 shadow-xl shadow-indigo-100/40 max-w-xl mx-auto my-6 relative overflow-hidden border border-white">
      {/* Decorative gradients */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-400 via-indigo-500 to-transparent opacity-10 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-cyan-400 via-teal-500 to-transparent opacity-10 blur-3xl pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">Add Funds</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">Top up your Rivochain balance</p>
          </div>
          <div className="bg-slate-900 rounded-[1.5rem] px-5 py-3 text-right shadow-lg">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Balance</p>
            <p className="text-xl font-black text-white">{formatCurrency(balanceCents)}</p>
          </div>
        </div>

        {error ? (
          <p className="mb-8 rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-600 flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        ) : null}

        {step === 1 ? (
          <div className="space-y-10 animate-in fade-in duration-300">
            <div className="text-center space-y-5 bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100">
              <label className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em]">Enter Amount (USDT)</label>
              <div className="flex items-center justify-center">
                <span className="text-5xl font-black text-slate-300 mr-2 select-none">$</span>
                <input 
                  type="number" 
                  min="10"
                  step="0.01"
                  className="text-6xl sm:text-7xl font-black text-slate-900 bg-transparent w-48 text-center outline-none placeholder:text-slate-200 focus:placeholder:text-transparent transition-all"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <p className="text-xs font-bold text-slate-400">Minimum deposit is $10.00.</p>
            </div>
            
            {/* Quick amounts */}
            <div className="grid grid-cols-4 gap-3">
              {QUICK_AMOUNTS.map(amt => (
                <button 
                  key={amt} 
                  onClick={() => setAmount(amt.toString())}
                  type="button"
                  className="py-4 rounded-[1.5rem] border-2 border-slate-100 font-black text-slate-600 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  ${amt}
                </button>
              ))}
            </div>

            <button
              className="w-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 py-4 sm:py-5 text-base font-black text-white shadow-xl shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all"
              onClick={() => handleContinue()}
            >
              Generate Deposit Address
            </button>
          </div>
        ) : (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-slate-50 rounded-[2rem] p-6 sm:p-8 border border-slate-100 text-center flex flex-col items-center relative overflow-hidden">
              <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
              
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Scan QR to Pay</h3>

              {loadingAddress ? (
                <div className="w-48 h-48 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                  <span className="text-slate-300 font-black animate-pulse text-sm">Loading...</span>
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-4 mb-6 shadow-lg shadow-slate-200/50 border border-slate-100 transform transition hover:scale-105 duration-300">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(addrInfo.address)}`}
                    alt="QR Code"
                    className="w-48 h-48 object-contain rounded-xl"
                  />
                </div>
              )}

              <div className="w-full space-y-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Network</p>
                  <p className="text-sm font-black text-indigo-600 bg-indigo-50 inline-block px-3 py-1 rounded-lg border border-indigo-100">{addrInfo.network}</p>
                </div>

                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Wallet Address</p>
                  <div className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-2 pl-4 max-w-full">
                    <span className="text-xs font-mono font-bold text-slate-700 truncate">{addrInfo.address}</span>
                    <button
                      onClick={handleCopy}
                      className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition shrink-0 shadow-md"
                      title="Copy Address"
                    >
                      {copied ? (
                        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1">Copy</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] p-6 sm:p-8 hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors group">
              <h3 className="text-sm font-black text-slate-800 mb-2">Upload Transfer Screenshot</h3>
              <p className="text-xs text-slate-500 mb-6 font-medium leading-relaxed">
                Send exactly <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">${Number(amount).toFixed(2)} USDT</span>. Then upload the transaction completion screen.
              </p>

              <div className="flex flex-col items-center justify-center relative min-h-[140px]">
                {screenshotPreview ? (
                  <div className="w-full flex flex-col items-center gap-4 animate-in zoom-in duration-200">
                    <div className="relative p-2 bg-white rounded-2xl shadow-lg border border-slate-100">
                      <img src={screenshotPreview} alt="Screenshot Preview" className="max-h-40 rounded-xl object-cover" />
                      <button onClick={() => { setScreenshotFile(null); setScreenshotPreview(null); }} className="absolute -top-3 -right-3 bg-rose-500 text-white p-1.5 rounded-full shadow-md hover:bg-rose-600 transition">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full text-center">
                    <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 mb-3 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold text-slate-700">Click to browse files</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2">PNG, JPG up to 5MB</span>
                    <input id="file-input" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="rounded-full border-2 border-slate-100 px-8 py-4 text-sm font-black text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                disabled={submitting}
              >
                Back
              </button>
              <button
                onClick={handleSubmitDeposit}
                className="flex-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4 text-sm font-black text-white transition-all shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-emerald-200 flex items-center justify-center gap-2"
                disabled={submitting || !screenshotFile}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  "Submit Payment Proof"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
