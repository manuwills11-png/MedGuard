import { Shield } from 'lucide-react'
import styles from './ShieldPulse.module.css'

export default function ShieldPulse({ size = 56 }) {
  return (
    <div className={styles.wrap} aria-hidden="true">
      <span className={styles.ring} />
      <span className={`${styles.ring} ${styles.ring2}`} />
      <span className={`${styles.ring} ${styles.ring3}`} />
      <Shield size={size} strokeWidth={1.75} className={styles.shield} />
    </div>
  )
}
