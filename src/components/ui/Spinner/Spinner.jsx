import styles from './Spinner.module.css';

/**
 * Spinner — pure CSS loading indicator.
 * Inherits color from parent via `currentColor`.
 *
 * @param {'sm'|'md'|'lg'} [size='md']
 * @param {string}         [className]
 */
export default function Spinner({ size = 'md', className = '' }) {
    return (
        <span
            className={`${styles.spinner} ${styles[size]} ${className}`}
            role="status"
            aria-label="Loading"
        />
    );
}
