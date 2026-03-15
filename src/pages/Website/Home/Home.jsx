import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import styles from './Home.module.css';

export default function Home() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <span className={styles.badge}>
          School Management System
        </span>

        <h1 className={styles.title}>
          Manage your school,
          <br />
          seamlessly.
        </h1>

        <p className={styles.subtitle}>
          EduCore SMS brings students, teachers, and administrators
          together in one unified platform. Streamline operations,
          track performance, and stay connected.
        </p>

        <div className={styles.actions}>
          <Button
            variant="primary"
            size="lg"
            onClick={() => { }}
          >
            <Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>
              Login to your account
            </Link>
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => { }}
          >
            <Link to="/register" style={{ color: 'inherit', textDecoration: 'none' }}>
              Create an account
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}