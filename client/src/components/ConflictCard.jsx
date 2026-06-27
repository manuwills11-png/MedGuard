import { ExternalLink } from 'lucide-react'
import styles from './ConflictCard.module.css'

export default function ConflictCard({ drug1, drug2, severity, message }) {
  const isHigh = severity === 'high'

  return (
    <div className={`${styles.card} ${isHigh ? '' : styles.moderate}`}>
      <h2 className={styles.pair}>
        {drug1} + {drug2}
      </h2>
      <span
        className={`${styles.severity} ${isHigh ? styles.severityHigh : styles.severityModerate}`}
      >
        {severity}
      </span>
      <p className={styles.message}>{message}</p>
      <div className={styles.source}>
        <ExternalLink size={12} aria-hidden="true" />
        Source: FDA Drug Interaction Database
      </div>
    </div>
  )
}
