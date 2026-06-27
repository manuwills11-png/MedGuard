import { ShieldCheck, AlertTriangle } from 'lucide-react'
import styles from './SafetyStatus.module.css'

export function SafeCard() {
  return (
    <div className={styles.safeCard} role="status">
      <ShieldCheck size={28} aria-hidden="true" className={styles.safeIcon} />
      <div className={styles.text}>
        <h2 className={styles.safeTitle}>All Clear</h2>
        <p className={styles.subtitle}>
          No dangerous interactions found between your medicines.
        </p>
      </div>
    </div>
  )
}

export function AlertBanner({ count }) {
  return (
    <div className={styles.alertCard} role="alert">
      <AlertTriangle size={28} aria-hidden="true" className={styles.alertIcon} />
      <div className={styles.text}>
        <h2 className={styles.alertTitle}>Interaction Alert</h2>
        <p className={styles.subtitle}>
          {count} {count === 1 ? 'interaction' : 'interactions'} found
        </p>
      </div>
    </div>
  )
}
