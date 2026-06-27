import {
  createContext,
  useCallback,
  useContext,
  useState,
  type PropsWithChildren,
} from 'react';
import { uuid } from '../lib/id';

interface Toast {
  id: string;
  message: string;
  variant: 'default' | 'achievement' | 'success' | 'danger';
}

interface ToastApi {
  push: (message: string, variant?: Toast['variant']) => void;
}

const ToastContext = createContext<ToastApi>({ push: () => {} });

export function useToast(): ToastApi {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback<ToastApi['push']>((message, variant = 'default') => {
    const id = uuid();
    setToasts((t) => [...t, { id, message, variant }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4200);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="toast-wrap" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.variant === 'achievement' ? 'achievement' : ''}`}>
            {t.variant === 'achievement' && '🏆 '}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
