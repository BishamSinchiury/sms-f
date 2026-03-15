import styles from './AuthLayout.module.css';

/**
 * AuthLayout — split-panel layout for login / register / forgot-password pages.
 *
 * Desktop: left brand panel + right form card.
 * Mobile:  full-width form card.
 *
 * @param {React.ReactNode} children — the form content
 * @param {string}          [brandTitle='EduCore SMS']
 * @param {string}          [brandTagline='Manage your school, seamlessly.']
 */
export default function AuthLayout({
    children,
    brandTitle = 'EduCore SMS',
    brandTagline = 'Manage your school, seamlessly.',
}) {
    return (
        <div className={styles.wrapper}>
            <div className={styles.brandPanel} aria-hidden="true">
                <div className={styles.brandContent}>
                    <h1 className={styles.brandLogo}>{brandTitle}</h1>
                    <p className={styles.brandTagline}>{brandTagline}</p>
                </div>
            </div>
            <main className={styles.formPanel}>
                <div className={styles.formCard}>
                    {children}
                </div>
            </main>
        </div>
    );
}
