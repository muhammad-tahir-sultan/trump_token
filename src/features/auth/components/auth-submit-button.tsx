"use client";

import { useFormStatus } from "react-dom";

type AuthSubmitButtonProps = {
  label: string;
  pendingLabel: string;
};

export function AuthSubmitButton({ label, pendingLabel }: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-busy={pending}
      className="w-full rounded-2xl bg-indigo-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-indigo-400"
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <span
            aria-hidden="true"
            className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
          />
          {pendingLabel}
        </span>
      ) : (
        label
      )}
    </button>
  );
}
