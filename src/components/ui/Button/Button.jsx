import Spinner from '../Spinner/Spinner';
import styles from './Button.module.css';

/**
 * Button — shared app-wide button component.
 *
 * @param {'primary'|'secondary'|'ghost'|'danger'} [variant='primary']
 * @param {'sm'|'md'|'lg'}                         [size='md']
 * @param {boolean}                                 [disabled=false]
 * @param {boolean}                                 [loading=false]  — shows spinner, disables click
 * @param {boolean}                                 [fullWidth=false]
 * @param {'button'|'submit'|'reset'}               [type='button']
 * @param {() => void}                              [onClick]
 * @param {string}                                  [className]
 * @param {React.ReactNode}                         children
 */
export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    fullWidth = false,
    type = 'button',
    onClick,
    className = '',
    ...rest
}) {
    const cls = [
        styles.btn,
        styles[variant],
        styles[size],
        fullWidth ? styles.fullWidth : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <button
            type={type}
            disabled={disabled || loading}
            className={cls}
            onClick={onClick}
            {...rest}
        >
            {loading && <Spinner size="sm" />}
            {children}
        </button>
    );
}
