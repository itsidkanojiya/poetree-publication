import { useEffect } from "react";
import { CheckCircle2, XCircle, AlertCircle, Info, X } from "lucide-react";

const Toast = ({ message, type = "success", onClose, duration = 4000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const styles = {
    success: {
      bg: "bg-gradient-to-r from-emerald-500 to-green-600",
      border: "border-emerald-400",
      icon: "text-white",
    },
    error: {
      bg: "bg-gradient-to-r from-rose-500 to-red-600",
      border: "border-rose-400",
      icon: "text-white",
    },
    warning: {
      bg: "bg-gradient-to-r from-amber-500 to-orange-600",
      border: "border-amber-400",
      icon: "text-white",
    },
    info: {
      bg: "bg-gradient-to-r from-blue-500 to-indigo-600",
      border: "border-blue-400",
      icon: "text-white",
    },
  };

  const Icon = icons[type] || icons.success;
  const style = styles[type] || styles.success;

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-right duration-300">
      <div
        className={`${style.bg} text-white rounded-xl shadow-2xl border-2 ${style.border} p-4 min-w-[320px] max-w-md flex items-start gap-3 backdrop-blur-sm`}
      >
        <div className="flex-shrink-0 mt-0.5">
          <Icon size={24} className={style.icon} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm leading-relaxed">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
          aria-label="Close"
        >
          <X size={18} className="text-white" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
