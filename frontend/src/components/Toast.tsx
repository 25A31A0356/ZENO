import React from 'react';
import { useZeno } from '../context/ZenoContext';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useZeno();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        let icon = <Info className="w-5 h-5 text-blue-400" />;
        let borderColor = 'border-blue-500/30';
        let bgColor = 'bg-[#182030]/95';

        if (toast.type === 'success') {
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
          borderColor = 'border-emerald-500/30';
        } else if (toast.type === 'warning') {
          icon = <AlertTriangle className="w-5 h-5 text-amber-400" />;
          borderColor = 'border-amber-500/30';
        } else if (toast.type === 'error') {
          icon = <XCircle className="w-5 h-5 text-rose-400" />;
          borderColor = 'border-rose-500/30';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl border ${borderColor} ${bgColor} shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200`}
          >
            <div className="flex items-center gap-3">
              {icon}
              <p className="text-sm font-medium text-slate-100">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
