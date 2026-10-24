import { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
  Loader2,
} from "lucide-react";

let toastId = 0;
const listeners = new Set();

/**
 * Afficher un toast
 * @param {string} message - Le message
 * @param {string} type - "success" | "error" | "warn" | "info" | "loading"
 * @param {object} options - { duree, action }
 */
export function toast(message, type = "success", options = {}) {
  const id = ++toastId;
  const duree = options.duree || (type === "loading" ? 0 : 4000);
  listeners.forEach((fn) => fn({ id, message, type, duree, action: options.action }));
  return id;
}

/**
 * Fermer un toast par ID
 */
export function fermerToast(id) {
  listeners.forEach((fn) => fn({ fermer: id }));
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (t) => {
      if (t.fermer) {
        setToasts((prev) => prev.filter((x) => x.id !== t.fermer));
        return;
      }
      setToasts((prev) => [...prev, t]);
      if (t.duree > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((x) => x.id !== t.id));
        }, t.duree);
      }
    };
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  const fermer = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const config = {
    success: {
      icon: CheckCircle2,
      bg: "bg-success/10",
      border: "border-success/30",
      text: "text-success",
      barre: "bg-success",
    },
    error: {
      icon: XCircle,
      bg: "bg-danger/10",
      border: "border-danger/30",
      text: "text-danger",
      barre: "bg-danger",
    },
    warn: {
      icon: AlertTriangle,
      bg: "bg-warn/10",
      border: "border-warn/30",
      text: "text-warn",
      barre: "bg-warn",
    },
    info: {
      icon: Info,
      bg: "bg-cyan/10",
      border: "border-cyan/30",
      text: "text-cyan",
      barre: "bg-cyan",
    },
    loading: {
      icon: Loader2,
      bg: "bg-accent/10",
      border: "border-accent/30",
      text: "text-accent",
      barre: "bg-accent",
    },
  };

  return (
    <div className="fixed top-20 right-4 z-[400] space-y-2 max-w-sm pointer-events-none">
      {toasts.map((t) => {
        const c = config[t.type] || config.info;
        const Icon = c.icon;
        const spin = t.type === "loading" ? "animate-spin" : "";

        return (
          <div
            key={t.id}
            className={`${c.bg} ${c.border} ${c.text} border rounded-xl shadow-2xl overflow-hidden animate-slide-in-right pointer-events-auto`}
          >
            <div className="p-3 flex items-start gap-3">
              <Icon size={18} className={`flex-shrink-0 mt-0.5 ${spin}`} />
              <p className="text-sm flex-1 break-words font-medium">
                {t.message}
              </p>
              {t.action && (
                <button
                  onClick={t.action.onClick}
                  className="text-xs font-semibold underline flex-shrink-0"
                >
                  {t.action.label}
                </button>
              )}
              <button
                onClick={() => fermer(t.id)}
                className="opacity-60 hover:opacity-100 flex-shrink-0 transition"
              >
                <X size={14} />
              </button>
            </div>
            {t.duree > 0 && (
              <div className="h-1 bg-black/20">
                <div
                  className={`h-full ${c.barre} animate-progress`}
                  style={{
                    animationDuration: `${t.duree}ms`,
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}