import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

const EXPLORE = [
    { label: 'About Us', href: '#about' },
    { label: 'Programs', href: '#programs' },
    { label: 'Admissions', href: '#admissions' },
    { label: 'Faculty', href: '#faculty' },
    { label: 'Campus Life', href: '#gallery' },
    { label: 'Testimonials', href: '#testimonials' },
];

const ACADEMICS = [
    { label: 'Undergraduate', href: '#programs' },
    { label: 'Graduate School', href: '#programs' },
    { label: 'Online Programs', href: '#programs' },
    { label: 'Research', href: '#about' },
    { label: 'Library', href: '#about' },
    { label: 'Academic Calendar', href: '#admissions' },
];

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.blobA} aria-hidden="true" />
            <div className={styles.blobB} aria-hidden="true" />

            <div className={styles.inner}>
                <div className={styles.grid}>

                    {/* Brand */}
                    <div className={styles.brand}>
                        <Link to="/" className={styles.logo}>
                            <span className={styles.logoBadge}>M</span>
                            <span className={styles.logoText}>
                                Meridian<em>University</em>
                            </span>
                        </Link>
                        <p className={styles.tagline}>
                            Shaping tomorrow's leaders through world-class education, groundbreaking research, and a vibrant campus community since 1892.
                        </p>
                        <div className={styles.socials}>
                            {['𝕏', 'in', 'f', '▶'].map((icon, i) => (
                                <a key={i} href="#" className={styles.socialIcon} aria-label={`Social ${i}`}>{icon}</a>
                            ))}
                        </div>
                    </div>

                    {/* Explore */}
                    <div className={styles.col}>
                        <h4 className={styles.colTitle}>Explore</h4>
                        <ul className={styles.colLinks}>
                            {EXPLORE.map(({ label, href }) => (
                                <li key={href}><a href={href} className={styles.colLink}>{label}</a></li>
                            ))}
                        </ul>
                    </div>

                    {/* Academics */}
                    <div className={styles.col}>
                        <h4 className={styles.colTitle}>Academics</h4>
                        <ul className={styles.colLinks}>
                            {ACADEMICS.map(({ label, href }) => (
                                <li key={label}><a href={href} className={styles.colLink}>{label}</a></li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className={styles.col}>
                        <h4 className={styles.colTitle}>Contact</h4>
                        <div className={styles.contactBlock}>
                            <div className={styles.contactItem}>
                                <span className={styles.contactIcon}>📍</span>
                                <span>1 University Drive,<br />Meridian Heights, CA 90210</span>
                            </div>
                            <div className={styles.contactItem}>
                                <span className={styles.contactIcon}>📞</span>
                                <span>+1 (800) 555-MERI</span>
                            </div>
                            <div className={styles.contactItem}>
                                <span className={styles.contactIcon}>✉️</span>
                                <span>admissions@meridian.edu</span>
                            </div>
                        </div>
                    </div>

                </div>

                <div className={styles.bottom}>
                    <p className={styles.copy}>© {new Date().getFullYear()} Meridian University. All rights reserved.</p>
                    <div className={styles.bottomLinks}>
                        <a href="#" className={styles.bottomLink}>Privacy Policy</a>
                        <a href="#" className={styles.bottomLink}>Terms of Use</a>
                        <a href="#" className={styles.bottomLink}>Accessibility</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
