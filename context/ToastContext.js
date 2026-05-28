"use client";
import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((arr) => arr.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((opts) => {
    const id = Math.random().toString(36).slice(2);
    const t = {
      id,
      message: typeof opts === "string" ? opts : opts.message,
      type: typeof opts === "string" ? "success" : opts.type || "success",
      action: typeof opts === "string" ? null : opts.action || null,
      duration: typeof opts === "string" ? 2500 : opts.duration ?? 2500,
    };
    setToasts((arr) => [...arr, t]);
    if (t.duration > 0) setTimeout(() => remove(id), t.duration);
    return id;
  }, [remove]);

  return (
    <ToastContext.Provider value={{ toast, remove }}>
      {children}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-[100] flex flex-col gap-2 max-w-[90vw] pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 rounded-lg shadow-lg border px-4 py-2.5 text-sm animate-toast-in ${
              t.type === "success"
                ? "bg-white border-[#e8e4d8] text-[#1a2b4a]"
                : t.type === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-[#1a2b4a] border-[#1a2b4a] text-white"
            }`}
          >
            {t.type === "success" && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            <span className="flex-1">{t.message}</span>
            {t.action && (
              <button
                onClick={() => { t.action.onClick?.(); remove(t.id); }}
                className="text-xs font-semibold underline hover:no-underline whitespace-nowrap"
              >
                {t.action.label}
              </button>
            )}
            <button onClick={() => remove(t.id)} className="text-gray-400 hover:text-gray-700 text-sm" aria-label="Dismiss">×</button>
          </div>
        ))}
      </div>
      <style jsx global>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-toast-in { animation: toast-in 0.18s ease-out; }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  // Safe fallback so components don't crash if a provider is missing in tests.
  if (!ctx) return { toast: () => {}, remove: () => {} };
  return ctx;
}
