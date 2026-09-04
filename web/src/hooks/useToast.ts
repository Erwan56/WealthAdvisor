import { useCallback, useRef, useState } from 'react';

export interface ToastState {
  message: string;
  warn: boolean;
  show: boolean;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({ message: '', warn: false, show: false });
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const notify = useCallback((message: string, warn = false) => {
    setToast({ message, warn, show: true });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 1800);
  }, []);

  return { toast, notify };
}
