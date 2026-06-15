"use client";

import { useEffect, useState } from "react";

type ToastProps = {
  message: string;
  onDone?: () => void;
};

export function Toast({ message, onDone }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-xl">
        {message}
      </div>
    </div>
  );
}
