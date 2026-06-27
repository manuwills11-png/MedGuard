import { useState, useEffect } from 'react'
import styles from './Loader.module.css'

const MESSAGES = [
  'Reading drug names...',
  'Cross-checking 7,000+ interactions...',
  'Building your safety report...',
]

export default function Loader() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % MESSAGES.length)
    }, 2000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={styles.container} role="status" aria-live="polite">
      <div className={styles.scanner} aria-hidden="true">
        <span className={styles.pill} />
        <span className={styles.pill} />
        <span className={styles.pill} />
        <span className={styles.scanBeam} />
      </div>
      <p className={styles.title}>Analyzing your medicines</p>
      <div className={styles.dots} aria-hidden="true">
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
      <p className={styles.subtitle}>{MESSAGES[index]}</p>
    </div>
  )
}
