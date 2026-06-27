import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Shield, Upload, Camera, Image as ImageIcon, ChevronLeft, Plus, X } from 'lucide-react'
import Loader from '../components/Loader.jsx'
import ManualSearch from '../components/ManualSearch.jsx'
import styles from './UploadPage.module.css'

const MAX_IMAGES = 4

export default function UploadPage() {
  const [mode, setMode] = useState('scan')
  const [images, setImages] = useState([])
  const [scanning, setScanning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)
  const imagesRef = useRef([])
  const navigate = useNavigate()

  imagesRef.current = images

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => URL.revokeObjectURL(img.url))
    }
  }, [])

  function addFiles(fileList) {
    const incoming = Array.from(fileList || [])
    if (incoming.length === 0) return
    setImages((prev) => {
      const room = MAX_IMAGES - prev.length
      if (room <= 0) return prev
      const toAdd = incoming
        .slice(0, room)
        .map((file) => ({ file, url: URL.createObjectURL(file) }))
      return [...prev, ...toAdd]
    })
    setError(null)
  }

  function handleFileChange(event) {
    addFiles(event.target.files)
    event.target.value = ''
  }

  function removeImage(index) {
    setImages((prev) => {
      const next = [...prev]
      const [removed] = next.splice(index, 1)
      if (removed) URL.revokeObjectURL(removed.url)
      return next
    })
  }

  async function handleAnalyze() {
    if (images.length === 0) return
    setError(null)
    setScanning(true)

    // Let the signature scan line sweep for a beat before showing the loader.
    const loaderTimer = setTimeout(() => {
      setScanning(false)
      setLoading(true)
    }, 2100)

    try {
      const formData = new FormData()
      images.forEach((img) => formData.append('images', img.file))

      const minScan = new Promise((resolve) => setTimeout(resolve, 2000))
      const [response] = await Promise.all([
        axios.post('http://localhost:3001/api/analyze', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }),
        minScan,
      ])

      clearTimeout(loaderTimer)
      navigate('/results', { state: response.data })
    } catch (err) {
      clearTimeout(loaderTimer)
      console.error(err)
      setScanning(false)
      setLoading(false)
      setError('Could not analyze the images. Please try again.')
    }
  }

  if (loading) {
    return <Loader />
  }

  const hasImages = images.length > 0
  const canAddMore = images.length < MAX_IMAGES

  return (
    <div className={styles.page}>
      <div className={styles.bgShapes} aria-hidden="true" />

      <nav className={styles.navbar}>
        <div className={styles.navInner}>
          <div className={styles.brand}>
            <Shield size={22} strokeWidth={2.25} aria-hidden="true" className={styles.brandIcon} />
            <span className={styles.brandName}>MedGuard</span>
          </div>
          <button type="button" className={styles.howLink} aria-label="Learn how MedGuard works">
            How it works
          </button>
        </div>
      </nav>

      <main className={styles.content}>
        {mode === 'scan' ? (
          <>
            <div className={styles.hero}>
              <h1 className={styles.heroTitle}>
                <span className={styles.heroLight}>Are your </span>
                medicines safe together?
              </h1>
              <p className={styles.heroSubtitle}>
                Upload pill strip photos and get instant safety warnings.
              </p>
              <span className={styles.trustBadge}>
                <span className={styles.trustDot} aria-hidden="true" />
                Trusted by families across India
              </span>
            </div>

            <div className={styles.zone}>
              {hasImages ? (
                <div className={styles.previewWrap}>
                  <img
                    src={images[0].url}
                    alt="First selected pill strip"
                    className={styles.previewImage}
                  />
                  {!scanning && (
                    <button
                      type="button"
                      className={styles.changeBtn}
                      onClick={() => galleryInputRef.current?.click()}
                      aria-label="Change photo"
                    >
                      Change
                    </button>
                  )}
                  {scanning && <span className={styles.scanBeam} aria-hidden="true" />}
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.zoneInner}
                  onClick={() => galleryInputRef.current?.click()}
                  aria-label="Upload pill strip photos. Drop here or tap to browse"
                >
                  <Upload size={36} strokeWidth={1.75} aria-hidden="true" className={styles.zoneIcon} />
                  <p className={styles.zoneTitle}>Drop your pill strips here</p>
                  <p className={styles.zoneHint}>JPG, PNG up to 10MB · Up to 4 strips</p>
                </button>
              )}
            </div>

            {hasImages && (
              <div className={styles.thumbRow}>
                {images.map((img, index) => (
                  <div key={img.url} className={styles.thumb}>
                    <img src={img.url} alt={`Pill strip ${index + 1}`} className={styles.thumbImage} />
                    <button
                      type="button"
                      className={styles.thumbRemove}
                      onClick={() => removeImage(index)}
                      aria-label={`Remove pill strip ${index + 1}`}
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {hasImages && canAddMore && (
              <button
                type="button"
                className={styles.addLink}
                onClick={() => galleryInputRef.current?.click()}
                aria-label="Add another strip"
              >
                <Plus size={16} aria-hidden="true" />
                Add another strip
              </button>
            )}

            <div className={styles.buttonRow}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => galleryInputRef.current?.click()}
                disabled={!canAddMore}
                aria-label="Upload a photo from your files"
              >
                <ImageIcon size={20} aria-hidden="true" />
                Upload Photo
              </button>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => cameraInputRef.current?.click()}
                disabled={!canAddMore}
                aria-label="Take a photo with your camera"
              >
                <Camera size={20} aria-hidden="true" />
                Take Photo
              </button>
            </div>

            {hasImages && (
              <button
                type="button"
                className={styles.cta}
                onClick={handleAnalyze}
                disabled={scanning}
                aria-label="Check selected pill strips for interactions"
              >
                Check for Interactions
              </button>
            )}

            {error && (
              <p className={styles.errorText} role="alert">
                {error}
              </p>
            )}

            <button
              type="button"
              className={styles.manualLink}
              onClick={() => setMode('manual')}
            >
              Or search medicines manually
            </button>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              aria-hidden="true"
              tabIndex={-1}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              style={{ display: 'none' }}
              aria-hidden="true"
              tabIndex={-1}
            />
          </>
        ) : (
          <>
            <button
              type="button"
              className={styles.backLink}
              onClick={() => setMode('scan')}
              aria-label="Back to scan a pill strip"
            >
              <ChevronLeft size={18} aria-hidden="true" />
              Back to scan
            </button>
            <ManualSearch setLoading={setLoading} />
          </>
        )}
      </main>
    </div>
  )
}
