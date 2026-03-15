import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';

const NAV_LINKS = [
    { label: 'About', href: '#about' },
    { label: 'Programs', href: '#programs' },
    { label: 'Admissions', href: '#admissions' },
    { label: 'Faculty', href: '#faculty' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'Contact', href: '#contact' },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const closeMenu = () => setMenuOpen(false);

    return (
        <>
            <nav className={[styles.navbar, scrolled ? styles.scrolled : ''].filter(Boolean).join(' ')}>
                <div className={styles.inner}>
                    {/* Logo */}
                    <Link to="/" className={styles.logo} onClick={closeMenu}>
                        <span className={styles.logoBadge}>M</span>
                        <span className={styles.logoText}>
                            Meridian<em>University</em>
                        </span>
                    </Link>

                    {/* Desktop links */}
                    <ul className={styles.navLinks}>
                        {NAV_LINKS.map(({ label, href }) => (
                            <li key={href}>
                                <a href={href} className={styles.navLink}>{label}</a>
                            </li>
                        ))}
                    </ul>

                    {/* CTA buttons */}
                    <div className={styles.actions}>
                        <Link to="/login" className={[styles.actionBtn, styles.ghost].join(' ')}>
                            Login
                        </Link>
                        <Link to="/register" className={[styles.actionBtn, styles.filled].join(' ')}>
                            Sign Up
                        </Link>
                    </div>

                    {/* Hamburger */}
                    <button
                        className={[styles.hamburger, menuOpen ? styles.open : ''].filter(Boolean).join(' ')}
                        onClick={() => setMenuOpen(v => !v)}
                        aria-label="Toggle navigation"
                        aria-expanded={menuOpen}
                    >
                        <span /><span /><span />
                    </button>
                </div>
            </nav>

            {/* Mobile drawer */}
            <div
                className={[styles.drawer, menuOpen ? styles.drawerOpen : ''].filter(Boolean).join(' ')}
                aria-hidden={!menuOpen}
            >
                <ul className={styles.drawerLinks}>
                    {NAV_LINKS.map(({ label, href }) => (
                        <li key={href}>
                            <a href={href} className={styles.drawerLink} onClick={closeMenu}>{label}</a>
                        </li>
                    ))}
                </ul>
                <div className={styles.drawerActions}>
                    <Link to="/login" className={[styles.actionBtn, styles.ghost].join(' ')} onClick={closeMenu}>Login</Link>
                    <Link to="/register" className={[styles.actionBtn, styles.filled].join(' ')} onClick={closeMenu}>Sign Up</Link>
                </div>
            </div>

            {/* Overlay */}
            {menuOpen && <div className={styles.overlay} onClick={closeMenu} aria-hidden="true" />}
        </>
    );
}
