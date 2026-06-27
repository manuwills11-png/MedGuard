import { ArrowRight } from 'lucide-react'
import styles from './DrugBadge.module.css'

export default function DrugBadge({ brand, generic, conflicted = false }) {
  return (
    <div className={styles.row}>
      <span
        className={`${styles.dot} ${conflicted ? styles.dotConflict : styles.dotSafe}`}
        aria-hidden="true"
      />
      <div className={styles.names}>
        <span className={styles.brand}>{brand}</span>
        <ArrowRight size={14} aria-hidden="true" className={styles.arrow} />
        <span className={styles.generic}>{generic}</span>
      </div>
      <span className={`${styles.badge} ${conflicted ? styles.badgeRisk : styles.badgeSafe}`}>
        {conflicted ? 'Risk' : 'Safe'}
      </span>
    </div>
  )
}
