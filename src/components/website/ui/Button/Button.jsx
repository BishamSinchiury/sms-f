import { Link } from 'react-router-dom';
import styles from './Button.module.css';

/**
 * Button
 * Props:
 *   variant  — 'primary' | 'secondary' | 'ghost'  (default: 'primary')
 *   size     — 'sm' | 'md' | 'lg'                 (default: 'md')
 *   to       — renders as <Link> (react-router)
 *   href     — renders as <a> (external)
 *   onClick  — renders as <button>
 *   clay     — string, clay color variant: 'peach'|'mint'|'lemon'|'rose'|'sky'
 *   disabled — bool
 */
export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    to,
    href,
    onClick,
    clay,
    disabled = false,
    className = '',
    ...rest
}) {
    const cls = [
        styles.btn,
        styles[variant],
        styles[size],
        clay ? styles[`clay_${clay}`] : '',
        disabled ? styles.disabled : '',
        className,
    ].filter(Boolean).join(' ');

    if (to) {
        return (
            <Link to={to} className={cls} {...rest}>
                <span className={styles.inner}>{children}</span>
            </Link>
        );
    }

    if (href) {
        return (
            <a href={href} className={cls} target="_blank" rel="noopener noreferrer" {...rest}>
                <span className={styles.inner}>{children}</span>
            </a>
        );
    }

    return (
        <button onClick={onClick} disabled={disabled} className={cls} {...rest}>
            <span className={styles.inner}>{children}</span>
        </button>
    );
}
