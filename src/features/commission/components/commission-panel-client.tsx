"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  claimDailyCommissionAction,
  claimDailyReferralCommissionAction,
} from "@/features/commission/actions/commission-actions";
import { getTodayKey } from "@/features/commission/services/commission-service";
import type { ReferralCommissionPreview } from "@/features/commission/services/referral-commission-service";
import {
  formatRemainingDuration,
  getCommissionUnlockRemainingMs,
} from "@/features/commission/services/referral-commission-service";
import { formatCurrency } from "@/features/wallet/services/currency";
import type { WalletSummary } from "@/features/wallet/types/wallet";

type CommissionPanelClientProps = {
  claimedCents?: number;
  error?: string;
  preview: {
    amountCents: number;
    baseAmountCents: number;
    eligibleLevel: { name: string } | null;
    rate: number;
  };
  referralClaimedCents?: number;
  referralPreview: ReferralCommissionPreview;
  success?: string;
  wallet: WalletSummary;
};

function useCountUp(target: number, active: boolean, duration = 1500) {
  const [value, setValue] = useState(target);

  useEffect(() => {
    if (!active) {
      setValue(target);
      return;
    }

    const start = performance.now();
    const from = Math.max(0, target - (target > 0 ? target * 0.15 : 0));

    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.floor(from + (target - from) * eased));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, duration, target]);

  return value;
}

function useCommissionLock(unlockAt: string | null) {
  const [remainingMs, setRemainingMs] = useState(() =>
    getCommissionUnlockRemainingMs(unlockAt),
  );

  useEffect(() => {
    setRemainingMs(getCommissionUnlockRemainingMs(unlockAt));

    if (!unlockAt) return;

    const timer = window.setInterval(() => {
      const nextRemaining = getCommissionUnlockRemainingMs(unlockAt);
      setRemainingMs(nextRemaining);

      if (nextRemaining <= 0) {
        window.clearInterval(timer);
      }
    }, 60_000);

    return () => window.clearInterval(timer);
  }, [unlockAt]);

  return remainingMs;
}

function ClaimButton({
  alreadyClaimed,
  canClaim,
  label,
  lockedLabel,
  onClaim,
}: {
  alreadyClaimed: boolean;
  canClaim: boolean;
  label: string;
  lockedLabel?: string;
  onClaim: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      disabled={!canClaim || isPending}
      onClick={() => startTransition(onClaim)}
      type="button"
    >
      {isPending ? (
        <span className="flex items-center gap-2">
          <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          Claiming...
        </span>
      ) : lockedLabel ? (
        lockedLabel
      ) : alreadyClaimed ? (
        "Already Claimed Today"
      ) : (
        label
      )}
    </button>
  );
}

export function CommissionPanelClient({
  claimedCents = 0,
  error,
  preview,
  referralClaimedCents = 0,
  referralPreview,
  success,
  wallet,
}: CommissionPanelClientProps) {
  const router = useRouter();
  const [celebrate, setCelebrate] = useState(Boolean(success));
  const todayKey = getTodayKey();
  const alreadyClaimed = wallet.lastCommissionClaimedDate === todayKey;
  const referralAlreadyClaimed =
    wallet.lastReferralCommissionClaimedDate === todayKey;
  const commissionLockRemainingMs = useCommissionLock(wallet.commissionUnlockAt);
  const isCommissionLocked = commissionLockRemainingMs > 0;
  const canClaim =
    preview.amountCents > 0 && !alreadyClaimed && !isCommissionLocked;
  const canClaimReferral =
    referralPreview.amountCents > 0 && !referralAlreadyClaimed;
  const displayBalance = useCountUp(wallet.balanceCents, celebrate);
  const celebratedAmount =
    referralClaimedCents > 0
      ? referralClaimedCents
      : claimedCents || preview.amountCents;

  useEffect(() => {
    if (!success) return;

    setCelebrate(true);
    const timer = setTimeout(() => {
      setCelebrate(false);
      router.replace("/commission");
    }, 3200);

    return () => clearTimeout(timer);
  }, [router, success]);

  return (
    <div className="relative space-y-4 sm:space-y-6">
      {celebrate ? (
        <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
          <div className="absolute inset-0 bg-emerald-500/10 animate-pulse" />
          {Array.from({ length: 24 }).map((_, index) => (
            <span
              className="absolute size-2 rounded-full bg-indigo-500 opacity-80 animate-bounce"
              key={index}
              style={{
                animationDelay: `${index * 0.08}s`,
                left: `${(index * 17) % 100}%`,
                top: `${(index * 13) % 40}%`,
              }}
            />
          ))}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="scale-100 rounded-[2rem] bg-white px-8 py-6 text-center shadow-2xl animate-in zoom-in duration-500">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">
                Commission Claimed
              </p>
              <p className="mt-2 text-4xl font-black text-slate-950">
                +{formatCurrency(celebratedAmount)}
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Added to your wallet balance
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-500 sm:text-sm">
              Daily Commission
            </p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 sm:mt-2 sm:text-3xl">
              Claim Deposit Commission
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500 sm:mt-2 sm:text-sm sm:leading-6">
              Daily commission is fixed at 5% of your total approved deposit
              amount. Wallet balance growth from previous commissions is not
              included. Claim once per day after the deposit lock ends.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-950 px-4 py-3 text-white sm:rounded-3xl sm:px-5 sm:py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 sm:text-xs">
              Wallet Balance
            </p>
            <p
              className={`mt-1 text-xl font-black transition-all sm:text-2xl ${
                celebrate ? "text-emerald-300 scale-105" : ""
              }`}
            >
              {formatCurrency(displayBalance)}
            </p>
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700 sm:mt-6 sm:text-sm">
            {error}
          </p>
        ) : null}
        {success && !celebrate ? (
          <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700 sm:mt-6 sm:text-sm">
            {success}
          </p>
        ) : null}
        {isCommissionLocked ? (
          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700 sm:mt-6 sm:text-sm">
            Commission locked for {formatRemainingDuration(commissionLockRemainingMs)} after
            your latest approved deposit.
          </p>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-3 sm:rounded-3xl sm:p-5">
            <p className="text-xs font-bold text-slate-400 sm:text-sm">Total Deposit</p>
            <p className="mt-1 text-lg font-black text-slate-950 sm:mt-2 sm:text-2xl">
              {formatCurrency(preview.baseAmountCents)}
            </p>
          </div>
          <div className="rounded-2xl bg-indigo-50 p-3 sm:rounded-3xl sm:p-5">
            <p className="text-xs font-bold text-indigo-700 sm:text-sm">Daily Rate</p>
            <p className="mt-1 text-lg font-black text-indigo-700 sm:mt-2 sm:text-2xl">
              {preview.rate}%
            </p>
          </div>
          <div className="col-span-2 rounded-2xl bg-emerald-50 p-3 sm:col-span-1 sm:rounded-3xl sm:p-5">
            <p className="text-xs font-bold text-emerald-700 sm:text-sm">Today&apos;s Amount</p>
            <p className="mt-1 text-lg font-black text-emerald-700 sm:mt-2 sm:text-2xl">
              {formatCurrency(preview.amountCents)}
            </p>
          </div>
        </div>

        <div className="mt-4 sm:mt-6">
          <ClaimButton
            alreadyClaimed={alreadyClaimed}
            canClaim={canClaim}
            label="Claim Daily Commission"
            lockedLabel={
              isCommissionLocked
                ? `Unlocks in ${formatRemainingDuration(commissionLockRemainingMs)}`
                : undefined
            }
            onClaim={() => claimDailyCommissionAction()}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 sm:text-sm">
              Referral Commission
            </p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 sm:mt-2 sm:text-3xl">
              Team Referral Earnings
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500 sm:mt-2 sm:text-sm sm:leading-6">
              When your team deposits, you earn the full level commission rate on
              the first day. From the second day onward, claim 1% daily on your
              team&apos;s total approved deposits once per day.
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-950 px-4 py-3 text-white sm:rounded-3xl sm:px-5 sm:py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200 sm:text-xs">
              Team Deposits
            </p>
            <p className="mt-1 text-xl font-black sm:text-2xl">
              {formatCurrency(referralPreview.teamDepositedCents)}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-3 sm:rounded-3xl sm:p-5">
            <p className="text-xs font-bold text-slate-400 sm:text-sm">Team Members</p>
            <p className="mt-1 text-lg font-black text-slate-950 sm:mt-2 sm:text-2xl">
              {referralPreview.teamMemberCount}
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-3 sm:rounded-3xl sm:p-5">
            <p className="text-xs font-bold text-emerald-700 sm:text-sm">Daily Rate</p>
            <p className="mt-1 text-lg font-black text-emerald-700 sm:mt-2 sm:text-2xl">
              {referralPreview.rate}%
            </p>
          </div>
          <div className="col-span-2 rounded-2xl bg-emerald-50 p-3 sm:col-span-1 sm:rounded-3xl sm:p-5">
            <p className="text-xs font-bold text-emerald-700 sm:text-sm">Today&apos;s Amount</p>
            <p className="mt-1 text-lg font-black text-emerald-700 sm:mt-2 sm:text-2xl">
              {formatCurrency(referralPreview.amountCents)}
            </p>
          </div>
        </div>

        <div className="mt-4 sm:mt-6">
          <ClaimButton
            alreadyClaimed={referralAlreadyClaimed}
            canClaim={canClaimReferral}
            label="Claim Referral Commission"
            onClaim={() => claimDailyReferralCommissionAction()}
          />
        </div>
      </section>
    </div>
  );
}
