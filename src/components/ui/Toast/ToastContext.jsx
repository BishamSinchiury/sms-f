import { createContext, useCallback, useContext, useRef, useState } from 'react';
import ToastContainer from './ToastContainer';

const ToastContext = createContext(null);

/**
 * ToastProvider — wrap your app with this to enable toasts.
 *
 * Usage inside any child component:
 *   const { addToast } = useToast();
 *   addToast({ type: 'success', message: 'Done!' });
 *   addToast({ type: 'error',   message: 'Oops' });
 *   addToast({ type: 'info',    message: 'FYI' });
 *   addToast({ type: 'warning', message: 'Careful' });
 */
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const idCounter = useRef(0);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback(({ type = 'info', message, duration = 5000 }) => {
        const id = ++idCounter.current;
        setToasts((prev) => {
            // Keep at most 5 visible toasts
            const next = [...prev, { id, type, message, duration }];
            return next.length > 5 ? next.slice(-5) : next;
        });
        return id;
    }, []);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside ToastProvider');
    return ctx;
}
