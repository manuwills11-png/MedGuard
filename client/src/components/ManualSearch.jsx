import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Search, Plus, X } from 'lucide-react'
import drugsData from '../data/drugs.json'
import styles from './ManualSearch.module.css'

const ALL_MEDICINES = Object.entries(drugsData).map(([brand, generic]) => ({
  brand,
  generic,
}))

export default function ManualSearch({ setLoading }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState([])
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return ALL_MEDICINES.filter((med) => {
      if (selected.some((s) => s.brand === med.brand)) return false
      return med.brand.toLowerCase().includes(q) || med.generic.toLowerCase().includes(q)
    }).slice(0, 5)
  }, [query, selected])

  function addMedicine(med) {
    setSelected((prev) => [...prev, med])
    setQuery('')
    setError(null)
  }

  function removeMedicine(brand) {
    setSelected((prev) => prev.filter((s) => s.brand !== brand))
  }

  async function handleCheck() {
    if (selected.length === 0) return
    setLoading(true)
    setError(null)
    try {
      const generics = selected.map((s) => s.generic)
      const response = await axios.post(
        'http://localhost:3001/api/check-interactions',
        { generics },
      )
      navigate('/results', {
        state: { drugs: selected, conflicts: response.data.conflicts || [] },
      })
    } catch (err) {
      console.error(err)
      setError('Could not check interactions. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.searchBox}>
        <Search size={20} aria-hidden="true" className={styles.searchIcon} />
        <input
          type="text"
          className={styles.input}
          placeholder="Search medicine name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search for a medicine by brand or generic name"
        />
      </div>

      {query.trim() && (
        <div className={styles.results}>
          {matches.length > 0 ? (
            matches.map((med) => (
              <button
                key={med.brand}
                type="button"
                className={styles.resultItem}
                onClick={() => addMedicine(med)}
                aria-label={`Add ${med.brand}, ${med.generic}`}
              >
                <span className={styles.resultBrand}>{med.brand}</span>
                <span className={styles.resultGeneric}>{med.generic}</span>
                <Plus size={18} aria-hidden="true" className={styles.plusIcon} />
              </button>
            ))
          ) : (
            <p className={styles.noResults}>No medicines found for “{query}”.</p>
          )}
        </div>
      )}

      <p className={styles.label}>Selected Medicines</p>
      {selected.length > 0 ? (
        <div className={styles.selectedRow}>
          {selected.map((med) => (
            <div key={med.brand} className={styles.pill}>
              <span className={styles.pillName}>{med.brand}</span>
              <button
                type="button"
                className={styles.pillRemove}
                onClick={() => removeMedicine(med.brand)}
                aria-label={`Remove ${med.brand}`}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.emptyHint}>Search above and tap a medicine to add it.</p>
      )}

      <button
        type="button"
        className={styles.cta}
        onClick={handleCheck}
        disabled={selected.length === 0}
        aria-label="Check these medicines for interactions"
      >
        Check These Medicines
      </button>

      {error && (
        <p className={styles.errorText} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
