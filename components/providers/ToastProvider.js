"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import styles from "./Toast.module.css";

// Top-right toast system. Any client component under <ToastProvider> can call
// useToast() and fire success/error/info messages. Toasts stack vertically and
// auto-dismiss after `duration` ms (default 3200ms). Manually dismissable via
// the ✕ button.

const ToastContext = createContext(null);

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  // Track timeouts so we can clear them if the toast is dismissed manually.
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (payload) => {
      const id = nextId++;
      const toast = {
        id,
        tone: payload.tone || "info",
        title: payload.title || "",
        message: payload.message || "",
        duration: payload.duration ?? 3200,
      };
      setToasts((prev) => [...prev, toast]);
      if (toast.duration > 0) {
        const handle = setTimeout(() => dismiss(id), toast.duration);
        timers.current.set(id, handle);
      }
      return id;
    },
    [dismiss]
  );

  useEffect(() => {
    return () => {
      // Clean up any pending timers on unmount.
      timers.current.forEach((h) => clearTimeout(h));
      timers.current.clear();
    };
  }, []);

  const api = {
    success: (message, opts = {}) =>
      push({ tone: "success", message, title: opts.title || "Success", ...opts }),
    error: (message, opts = {}) =>
      push({ tone: "error", message, title: opts.title || "Something went wrong", ...opts }),
    info: (message, opts = {}) =>
      push({ tone: "info", message, title: opts.title || "", ...opts }),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={styles.stack} role="region" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div key={t.id} className={`${styles.toast} ${styles[`tone_${t.tone}`] || ""}`}>
            <div className={styles.body}>
              {t.title && <strong className={styles.title}>{t.title}</strong>}
              {t.message && <span className={styles.message}>{t.message}</span>}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className={styles.close}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside a ToastProvider");
  return ctx;
}
