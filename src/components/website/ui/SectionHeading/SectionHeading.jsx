import styles from './SectionHeading.module.css';

/**
 * SectionHeading
 * Props:
 *   tag      — eyebrow label string
 *   title    — main heading string
 *   subtitle — supporting paragraph string
 *   align    — 'center' | 'left' (default: 'center')
 *   light    — bool, use light text on dark bg
 */
export default function SectionHeading({ tag, title, subtitle, align = 'center', light = false }) {
    return (
        <div className={[styles.wrapper, styles[align], light ? styles.light : ''].filter(Boolean).join(' ')}>
            {tag && (
                <span className={styles.tag}>{tag}</span>
            )}
            {title && (
                <h2 className={styles.title}>{title}</h2>
            )}
            {subtitle && (
                <p className={styles.subtitle}>{subtitle}</p>
            )}
        </div>
    );
}
