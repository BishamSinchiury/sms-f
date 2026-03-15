import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import styles from './Toast.module.css';

const ICONS = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
};

function ToastItem({ toast, onRemove }) {
    const [exiting, setExiting] = useState(false);
    const Icon = ICONS[toast.type] || Info;

    useEffect(() => {
        const timer = setTimeout(() => {
            setExiting(true);
        }, toast.duration ?? 5000);

        return () => clearTimeout(timer);
    }, [toast.duration]);

    useEffect(() => {
        if (!exiting) return;
        const timer = setTimeout(() => onRemove(toast.id), 200);
        return () => clearTimeout(timer);
    }, [exiting, toast.id, onRemove]);

    return (
        <div
            className={`${styles.toast} ${styles[toast.type]} ${exiting ? styles.exiting : ''}`}
            role="alert"
        >
            <span className={styles.icon}>
                <Icon size={18} />
            </span>
            <span className={styles.message}>{toast.message}</span>
            <button
                className={styles.closeBtn}
                onClick={() => setExiting(true)}
                aria-label="Dismiss"
            >
                <X size={14} />
            </button>
        </div>
    );
}

export default function ToastContainer({ toasts, removeToast }) {
    return createPortal(
        <div className={styles.container} aria-live="polite">
            {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} onRemove={removeToast} />
            ))}
        </div>,
        document.body
    );
}
