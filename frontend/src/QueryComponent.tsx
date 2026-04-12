import { useEffect, useMemo, useState } from 'react'
import SearchIcon from './assets/mag.png'
import './QueryComponent.css'

export interface SearchRequest {
  query: string
  explicit?: boolean
  genres?: string[]
  excludedGenres?: string[]
  publisher?: string
  releaseYear?: string
  lengthMetric?: 'duration_ms' | 'total_episodes'
  minLength?: number
  maxLength?: number
}

interface QueryComponentProps {
  onSearch: (request: SearchRequest) => Promise<void> | void
  initialQuery?: string
  initialRequest?: SearchRequest
  onDraftChange?: (request: SearchRequest) => void
  showSubmit?: boolean
  radioNamePrefix?: string
}

function QueryComponent({
  onSearch,
  initialQuery = '',
  initialRequest,
  onDraftChange,
  showSubmit = true,
  radioNamePrefix = 'solo',
}: QueryComponentProps): JSX.Element {
  const defaultMinLength = 0
  const defaultMaxLength = 500

  const [query, setQuery] = useState<string>(initialRequest?.query ?? initialQuery)
  const [isExplicit, setIsExplicit] = useState<boolean>(initialRequest?.explicit ?? false)
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialRequest?.genres ?? [])
  const [lengthMetric, setLengthMetric] = useState<'duration_ms' | 'total_episodes'>(initialRequest?.lengthMetric ?? 'total_episodes')
  const [minLength, setMinLength] = useState<number>(initialRequest?.minLength ?? defaultMinLength)
  const [maxLength, setMaxLength] = useState<number>(initialRequest?.maxLength ?? defaultMaxLength)
  const [publisher, setPublisher] = useState<string>(initialRequest?.publisher ?? '')
  const [releaseYear, setReleaseYear] = useState<string>(initialRequest?.releaseYear ?? '')

  // TODO: can change this with more experimentation
  const genreOptions = useMemo(  
    () => [
      'Comedy',
      'News',
      'Technology',
      'Education',
      'Business',
      'Health',
      'Sports',
      'History',
      'Science',
      'True Crime',
      'Music',
      'Society',
    ],
    [],
  )

  useEffect(() => {
    if (initialRequest) {
      setQuery(initialRequest.query ?? '')
      setIsExplicit(initialRequest.explicit ?? false)
      setSelectedGenres(initialRequest.genres ?? [])
      setLengthMetric(initialRequest.lengthMetric ?? 'total_episodes')
      setMinLength(initialRequest.minLength ?? defaultMinLength)
      setMaxLength(initialRequest.maxLength ?? defaultMaxLength)
      setPublisher(initialRequest.publisher ?? '')
      setReleaseYear(initialRequest.releaseYear ?? '')
      return
    }

    setQuery(initialQuery)
  }, [initialQuery, initialRequest])

  useEffect(() => {
    if (!onDraftChange) return

    onDraftChange({
      query,
      explicit: isExplicit,
      genres: selectedGenres,
      publisher,
      releaseYear,
      lengthMetric,
      minLength,
      maxLength,
    })
  }, [
    query,
    isExplicit,
    selectedGenres,
    publisher,
    releaseYear,
    lengthMetric,
    minLength,
    maxLength,
    onDraftChange,
  ])

  const handleGenreToggle = (genre: string): void => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(item => item !== genre) : [...prev, genre],
    )
  }

  const handleGenreRemove = (genre: string): void => {
    setSelectedGenres(prev => prev.filter(item => item !== genre))
  }

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()
    await onSearch({
      query,
      explicit: isExplicit,
      genres: selectedGenres,
      publisher,
      releaseYear,
      lengthMetric,
      minLength,
      maxLength,
    })
  }

  const formFields = (
    <>
      <div className="solo-query-row">
        <label className="solo-label required">Query</label>
        <div className="input-box query-input-box">
          <img src={SearchIcon} alt="search" />
          <input
            className="solo-input"
            value={query}
            placeholder="Health Podcasts"
            onChange={event => setQuery(event.target.value)}
            required
          />
        </div>
      </div>
      <div className="solo-fields-grid">
        <div className="solo-explicit">
          <label className="solo-label required">Explicit?</label>
          <div className="solo-explicit-options">
            <label><input type="radio" name={`${radioNamePrefix}-explicit`} value="no" checked={!isExplicit} onChange={() => setIsExplicit(false)} /> No</label>
            <label><input type="radio" name={`${radioNamePrefix}-explicit`} value="yes" checked={isExplicit} onChange={() => setIsExplicit(true)} /> Yes</label>
          </div>
        </div>
        <div className="solo-genres">
          <label className="solo-label">Genres</label>
          <div className="genre-selected-chips" aria-live="polite">
            {selectedGenres.map(genre => (
              <span key={genre} className="genre-chip">
                <span>{genre}</span>
                <button
                  type="button"
                  className="genre-chip-remove"
                  onClick={() => handleGenreRemove(genre)}
                  aria-label={`Remove ${genre}`}
                >
                  x
                </button>
              </span>
            ))}
          </div>
          <div className="genre-checklist" role="group" aria-label="Genres">
            {genreOptions.map(genre => (
              <label key={genre} className="genre-check-item">
                <input
                  type="checkbox"
                  checked={selectedGenres.includes(genre)}
                  onChange={() => handleGenreToggle(genre)}
                />
                <span>{genre}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="solo-length">
          <label className="solo-label">Length Metric</label>
          <select className="solo-select" value={lengthMetric} onChange={event => setLengthMetric(event.target.value as 'duration_ms' | 'total_episodes')}>
            <option value="duration_ms">Episode Duration (minutes)</option>
            <option value="total_episodes">Total Episodes</option>
          </select>
          <label className="solo-label">Minimum Value</label>
          <input
            className="solo-input"
            type="number"
            min={defaultMinLength}
            max={defaultMaxLength}
            value={minLength}
            onChange={event => {
              const nextMin = Math.max(defaultMinLength, Number(event.target.value) || defaultMinLength)
              setMinLength(Math.min(nextMin, maxLength))
            }}
          />
          <label className="solo-label">Maximum Value</label>
          <input
            className="solo-input"
            type="number"
            min={defaultMinLength}
            max={defaultMaxLength}
            value={maxLength}
            onChange={event => {
              const nextMax = Math.min(defaultMaxLength, Number(event.target.value) || defaultMaxLength)
              setMaxLength(Math.max(nextMax, minLength))
            }}
          />
        </div>
        <div className="solo-year">
          <label className="solo-label">Year</label>
          <input className="solo-input" type="number" min={1900} max={2100} placeholder="2024" value={releaseYear} onChange={event => setReleaseYear(event.target.value)} />
        </div>
        <div className="solo-publisher">
          <label className="solo-label">Publisher</label>
          <input className="solo-input" type="text" placeholder="NPR" value={publisher} onChange={event => setPublisher(event.target.value)} />
        </div>
      </div>
      {showSubmit && (
        <div className="solo-search-row">
          <button type="submit" className="solo-search-btn">SEARCH</button>
        </div>
      )}
    </>
  )

  if (!showSubmit) {
    return <div className="solo-form-card">{formFields}</div>
  }

  return (
    <form onSubmit={handleSubmit} className="solo-form-card">
      {formFields}
    </form>
  )
}

export default QueryComponent
