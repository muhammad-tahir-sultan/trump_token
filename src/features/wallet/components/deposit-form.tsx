"use client";

import { useState } from "react";
import { formatCurrency } from "@/features/wallet/services/currency";
import Link from "next/link";

type DepositFormProps = {
  balanceCents: number;
};

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

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-sm text-center max-w-xl mx-auto my-8 animate-in fade-in duration-300">
        <div className="mx-auto w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-black text-slate-950">Deposit Submitted!</h2>
        <p className="mt-4 text-sm leading-6 text-slate-500">
          Your deposit request of <span className="font-bold text-slate-950">${Number(amount).toFixed(2)}</span> has been received and is pending admin validation.
        </p>

        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left">
          <h4 className="text-xs font-black text-amber-800 uppercase tracking-widest">Next Steps</h4>
          <ol className="mt-2 text-xs text-amber-700 space-y-1.5 list-decimal list-inside leading-relaxed">
            <li>Admin will verify the payment screenshot on the blockchain network.</li>
            <li>Your account balance will be credited upon approval.</li>
            <li>You can track the request status in your transaction history.</li>
          </ol>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/history" className="rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-black text-white transition hover:bg-indigo-700">
            View History
          </Link>
          <button onClick={() => { setStep(1); setAmount(""); setSuccess(""); }} className="rounded-2xl border border-slate-200 px-6 py-3.5 text-sm font-black text-slate-600 transition hover:bg-slate-50">
            New Deposit
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm max-w-xl mx-auto my-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-500">
            Wallet
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Deposit Funds
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Add funds to your Rivochain wallet and unlock commission levels.
          </p>
        </div>
        <div className="rounded-3xl bg-slate-950 px-5 py-4 text-white shrink-0 self-start">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Balance
          </p>
          <p className="mt-1 text-2xl font-black">{formatCurrency(balanceCents)}</p>
        </div>
      </div>

      {error ? (
        <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {error}
        </p>
      ) : null}

      {step === 1 ? (
        <form onSubmit={handleContinue} className="mt-6 grid gap-5">
          <div>
            <label className="text-sm font-black text-slate-700" htmlFor="deposit-amount">
              Amount
            </label>
            <div className="mt-2 flex rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100">
              <span className="grid w-12 place-items-center border-r border-slate-200 text-sm font-black text-slate-500">
                $
              </span>
              <input
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400"
                id="deposit-amount"
                min="10"
                name="amount"
                placeholder="10.00"
                step="0.01"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-400">
              Minimum deposit is $10.00.
            </p>
          </div>

          <button
            className="w-full rounded-2xl bg-indigo-600 py-3.5 text-sm font-black text-white transition hover:bg-indigo-700"
            type="submit"
          >
            Continue to Payment
          </button>
        </form>
      ) : (
        <div className="mt-6 space-y-6 animate-in fade-in duration-200">
          <div className="border-t border-slate-100 pt-6 flex flex-col items-center">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">USDT Transfer Details</h3>

            {loadingAddress ? (
              <div className="w-48 h-48 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-slate-400 font-bold animate-pulse text-xs">Generating address...</span>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 flex flex-col items-center mb-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(addrInfo.address)}`}
                  alt="QR Code"
                  className="w-44 h-44 object-contain rounded-xl bg-white shadow-sm border border-slate-100 p-2"
                />
              </div>
            )}

            <div className="w-full text-center space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Network</p>
              <p className="text-sm font-extrabold text-indigo-600">{addrInfo.network}</p>

              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-2">Deposit Wallet Address</p>
              <div className="flex items-center justify-center gap-2 max-w-full px-4">
                <span className="text-xs font-mono font-bold text-slate-800 break-all text-center">{addrInfo.address}</span>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition shrink-0"
                  title="Copy Address"
                >
                  {copied ? (
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 space-y-4">
            <h3 className="text-sm font-black text-slate-700">Upload Transfer Screenshot</h3>
            <p className="text-xs text-slate-400">Please send the exact amount of <span className="font-bold text-slate-900">${Number(amount).toFixed(2)} USDT</span>. Take a screenshot of your transfer completion and upload it below.</p>

            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-indigo-400 transition bg-slate-50 rounded-2xl p-6 min-h-36 relative">
              {screenshotPreview ? (
                <div className="w-full flex flex-col items-center gap-3">
                  <img src={screenshotPreview} alt="Screenshot Preview" className="max-h-32 rounded-lg border shadow-sm" />
                  <label htmlFor="file-input-change" className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer">
                    Change Screenshot
                  </label>
                  <input id="file-input-change" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full text-center">
                  <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-bold text-slate-500">Click to upload transfer receipt screenshot</span>
                  <span className="text-[10px] text-slate-400 mt-1">PNG, JPG up to 5MB</span>
                  <input id="file-input" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="rounded-2xl border border-slate-200 px-5 py-3.5 text-sm font-black text-slate-500 transition hover:bg-slate-50"
              disabled={submitting}
            >
              Back
            </button>
            <button
              onClick={handleSubmitDeposit}
              className="flex-1 rounded-2xl bg-indigo-600 px-5 py-3.5 text-sm font-black text-white transition hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={submitting || !screenshotFile}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Submitting...</span>
                </>
              ) : (
                "I Have Paid — Submit Proof"
              )}
            </button>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 text-slate-500 text-xs leading-relaxed space-y-2 border">
            <p className="font-bold text-slate-700">Tips:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>The deposit address is a one-time address, do not transfer repeatedly.</li>
              <li>Please keep a screenshot of your payment for support reference.</li>
              <li>Deposit approval takes about 1-5 minutes to arrive depending on the blockchain network speed.</li>
              <li>Need assistance? Submit a <Link href="/support" className="text-indigo-600 hover:underline">Support Ticket</Link>.</li>
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
