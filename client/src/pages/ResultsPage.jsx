import { useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import { ChevronLeft, ChevronDown, Volume2 } from 'lucide-react'
import DrugBadge from '../components/DrugBadge.jsx'
import ConflictCard from '../components/ConflictCard.jsx'
import { SafeCard, AlertBanner } from '../components/SafetyStatus.jsx'
import styles from './ResultsPage.module.css'

const LANGUAGES = [
  { code: 'en-IN', label: 'English' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'ml-IN', label: 'Malayalam' },
  { code: 'ta-IN', label: 'Tamil' },
]

export default function ResultsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [language, setLanguage] = useState(LANGUAGES[0].code)

  if (!location.state) {
    return <Navigate to="/" replace />
  }

  const { drugs = [], conflicts = [] } = location.state
  const hasConflicts = conflicts.length > 0

  const conflictedGenerics = new Set()
  conflicts.forEach((c) => {
    conflictedGenerics.add(c.drug1)
    conflictedGenerics.add(c.drug2)
  })

  function handleReadAloud() {
    if (!('speechSynthesis' in window)) return

    let text
    if (hasConflicts) {
      text = conflicts
        .map(
          (c) =>
            `Warning. ${c.drug1} and ${c.drug2} interaction. ${c.message}. Severity ${c.severity}.`,
        )
        .join(' ')
    } else {
      text = 'All your medicines are safe to take together.'
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = language
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className={styles.page}>
      <div className={styles.bgShapes} aria-hidden="true" />
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => navigate('/')}
            aria-label="Go back to scan page"
          >
            <ChevronLeft size={20} aria-hidden="true" />
            Back
          </button>
          <div className={styles.headerCenter}>
            <h1 className={styles.headerTitle}>Safety Report</h1>
            <p className={styles.timestamp}>Just now</p>
          </div>
          <span />
        </div>
      </header>

      <main className={styles.content}>
        <section>
          <p className={styles.eyebrow}>Medicines Detected</p>
          <div className={styles.drugCard}>
            {drugs.map((drug, index) => (
              <DrugBadge
                key={`${drug.brand}-${index}`}
                brand={drug.brand}
                generic={drug.generic}
                conflicted={conflictedGenerics.has(drug.generic)}
              />
            ))}
          </div>
        </section>

        <section>
          {hasConflicts ? (
            <>
              <AlertBanner count={conflicts.length} />
              {conflicts.map((conflict, index) => (
                <ConflictCard
                  key={`${conflict.drug1}-${conflict.drug2}-${index}`}
                  drug1={conflict.drug1}
                  drug2={conflict.drug2}
                  severity={conflict.severity}
                  message={conflict.message}
                />
              ))}
            </>
          ) : (
            <SafeCard />
          )}
        </section>

        <section>
          <div className={styles.audioCard}>
            <p className={styles.audioLabel}>Audio Warning</p>
            <div className={styles.selectWrap}>
              <select
                className={styles.select}
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                aria-label="Choose language for audio playback"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} aria-hidden="true" className={styles.selectChevron} />
            </div>
            <button
              type="button"
              className={styles.readButton}
              onClick={handleReadAloud}
              aria-label="Read warnings aloud"
            >
              <Volume2 size={20} aria-hidden="true" />
              Read Aloud
            </button>
          </div>
        </section>

        <button
          type="button"
          className={styles.scanAgain}
          onClick={() => navigate('/')}
          aria-label="Scan again"
        >
          Scan Again
        </button>
      </main>
    </div>
  )
}
