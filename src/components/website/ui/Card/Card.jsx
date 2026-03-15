import styles from './Card.module.css';

/**
 * Card
 * Props:
 *   variant — 'default' | 'outlined' | 'dark' | 'peach' | 'mint' | 'lemon' | 'rose' | 'sky'
 *   noPad   — bool, remove internal padding
 */
export default function Card({ children, variant = 'default', noPad = false, className = '', ...rest }) {
    return (
        <div
            className={[
                styles.card,
                styles[variant],
                noPad ? styles.noPad : '',
                className,
            ].filter(Boolean).join(' ')}
            {...rest}
        >
            {children}
        </div>
    );
}
