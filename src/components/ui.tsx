"use client";

import { useEffect } from "react";

// -------- Status badge -----------------------------------------------------

const BADGE_STYLES: Record<string, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  ON_TRIP: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  IN_SHOP: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  RETIRED: "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  OFF_DUTY: "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  SUSPENDED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  DRAFT: "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  DISPATCHED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  OPEN: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  CLOSED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

export function Badge({ status, label }: { status: string; label?: string }) {
  const cls = BADGE_STYLES[status] ?? "bg-slate-200 text-slate-600";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label ?? status}
    </span>
  );
}

// -------- Modal ------------------------------------------------------------

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// -------- Inline error / empty --------------------------------------------

export function ErrorText({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{message}</p>;
}

export function Empty({ label }: { label: string }) {
  return <p className="px-4 py-10 text-center text-sm text-slate-400">{label}</p>;
}
