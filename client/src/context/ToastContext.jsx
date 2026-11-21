import React, { createContext, useContext, useState, useCallback } from 'react';
import { Icon } from '@iconify/react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Floating Dynamic Island Pill Toast Container */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4 select-none">
        {toasts.map((toast) => {
          let dotColor = 'bg-[#22c55e]';
          let iconName = 'solar:info-circle-bold';

          if (toast.type === 'error') {
            dotColor = 'bg-[#ef4444]';
            iconName = 'solar:close-circle-bold';
          } else if (toast.type === 'warning') {
            dotColor = 'bg-[#eab308]';
            iconName = 'solar:danger-triangle-bold';
          } else if (toast.type === 'success') {
            dotColor = 'bg-[#22c55e]';
            iconName = 'solar:check-circle-bold';
          }

          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-center justify-between gap-3 px-5 py-3 rounded-full bg-[#1C1A18] text-[#F7F3EE] border border-[#4A4540] shadow-2xl transition-all animate-in slide-in-from-top-3 duration-200"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor} animate-pulse`} />
                <p className="text-xs font-bold leading-snug truncate">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-[#C2B4A3] hover:text-[#F7F3EE] p-1 shrink-0 cursor-pointer"
                aria-label="Dismiss toast"
              >
                <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
export default ToastContext;
