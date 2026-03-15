import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from './Input.module.css';

/**
 * PasswordInput — same API as TextInput but with a built-in show/hide toggle.
 *
 * @param {string}              id
 * @param {string}              label
 * @param {string}              value
 * @param {(e: Event) => void}  onChange
 * @param {string}              [placeholder]
 * @param {string}              [error]
 * @param {boolean}             [disabled]
 * @param {string}              [autoComplete]
 * @param {string}              [className]
 */
export default function PasswordInput({
    id,
    label,
    value,
    onChange,
    placeholder,
    error,
    disabled = false,
    autoComplete,
    className = '',
    ...rest
}) {
    const [visible, setVisible] = useState(false);

    return (
        <div className={`${styles.field} ${className}`}>
            <label htmlFor={id} className={styles.label}>
                {label}
            </label>
            <div className={styles.inputWrapper}>
                <input
                    id={id}
                    name={id}
                    type={visible ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    autoComplete={autoComplete}
                    className={`${styles.input} ${styles.hasToggle} ${error ? styles.inputError : ''}`}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${id}-error` : undefined}
                    {...rest}
                />
                <button
                    type="button"
                    className={styles.toggleBtn}
                    onClick={() => setVisible((v) => !v)}
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                >
                    {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
            {error && (
                <p id={`${id}-error`} className={styles.errorMsg} role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}
