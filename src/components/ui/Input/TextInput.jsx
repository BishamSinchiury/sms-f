import styles from './Input.module.css';

/**
 * TextInput — label + input + optional error message.
 *
 * @param {string}              id           — required, links <label> ↔ <input>
 * @param {string}              label        — visible label text
 * @param {string}              value
 * @param {(e: Event) => void}  onChange
 * @param {string}              [placeholder]
 * @param {'text'|'email'|'tel'|'url'} [type='text']
 * @param {string}              [error]      — inline error message below input
 * @param {boolean}             [disabled]
 * @param {string}              [autoComplete]
 * @param {string}              [className]
 */
export default function TextInput({
    id,
    label,
    value,
    onChange,
    placeholder,
    type = 'text',
    error,
    disabled = false,
    autoComplete,
    className = '',
    ...rest
}) {
    return (
        <div className={`${styles.field} ${className}`}>
            <label htmlFor={id} className={styles.label}>
                {label}
            </label>
            <div className={styles.inputWrapper}>
                <input
                    id={id}
                    name={id}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    autoComplete={autoComplete}
                    className={`${styles.input} ${error ? styles.inputError : ''}`}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${id}-error` : undefined}
                    {...rest}
                />
            </div>
            {error && (
                <p id={`${id}-error`} className={styles.errorMsg} role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}
