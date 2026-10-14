"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { FormState } from "@/lib/forms";

type Toast = { id: number; tone: "error" | "warning" | "success"; message: string };

const ToastContext = createContext<((state: FormState) => void) | null>(null);

const styles = {
  error: "border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100",
  warning: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100",
  success: "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
};

let nextId = 1;

/**
 * Жагсаалтын мөрөөс хийсэн үйлдлийн үр дүн (жишээ нь буцаалтын торгууль) мөр
 * алга болсон ч харагдах ёстой тул layout түвшинд харуулна.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = (id: number) => setToasts((all) => all.filter((t) => t.id !== id));

  const show = useCallback((state: FormState) => {
    const tone = state.error ? "error" : state.warning ? "warning" : state.success ? "success" : null;
    if (!tone) return;
    const toast = { id: nextId++, tone, message: (state.error ?? state.warning ?? state.success)! } as Toast;
    setToasts((all) => [...all.slice(-3), toast]);
    // Анхааруулга, алдааг удаан харуулна — торгуулийн дүнг уншиж амжих хэрэгтэй
    setTimeout(() => dismiss(toast.id), tone === "success" ? 5000 : 12000);
  }, []);

  return (
    <ToastContext value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:left-auto sm:w-96">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex w-full items-start gap-3 rounded-md border px-4 py-3 text-sm shadow-lg ${styles[t.tone]}`}
          >
            <p className="flex-1">{t.message}</p>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Хаах" className="opacity-60 hover:opacity-100">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext>
  );
}

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast нь ToastProvider дотор байх ёстой");
  return show;
}
