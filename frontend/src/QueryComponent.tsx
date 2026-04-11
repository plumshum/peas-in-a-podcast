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
  mode: 'solo' | 'collab'
  onSearch: (request: SearchRequest) => Promise<void> | void
  initialQuery?: string
  formId?: string
}

function QueryComponent({ mode, onSearch, initialQuery = '', formId }: QueryComponentProps): JSX.Element {
  const defaultMinLength = 0
  const defaultMaxLength = 500

  const [query, setQuery] = useState<string>(initialQuery)
  const [isExplicit, setIsExplicit] = useState<boolean>(false)
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [lengthMetric, setLengthMetric] = useState<'duration_ms' | 'total_episodes'>('total_episodes')
  const [minLength, setMinLength] = useState<number>(defaultMinLength)
  const [maxLength, setMaxLength] = useState<number>(defaultMaxLength)
  const [publisher, setPublisher] = useState<string>('')
  const [releaseYear, setReleaseYear] = useState<string>('')

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
    setQuery(initialQuery)
  }, [initialQuery])

  const handleGenreChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const values = Array.from(event.target.selectedOptions, option => option.value)
    setSelectedGenres(values)
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

  // SOLO MODE LAYOUT (CLEAN REBUILD)
  if (mode === 'solo') {
    return (
      <form onSubmit={handleSubmit} className="solo-form-card" id={formId}>
        <div className="solo-query-row">
          <label className="solo-label">Query</label>
          <input
            className="solo-input"
            value={query}
            onChange={event => setQuery(event.target.value)}
            required
          />
        </div>
        <div className="solo-fields-grid">
          <div className="solo-explicit">
            <label className="solo-label">Explicit?</label>
            <div className="solo-explicit-options">
              <label><input type="radio" name={`explicit-${formId || 'default'}`} value="no" checked={!isExplicit} onChange={() => setIsExplicit(false)} /> No</label>
              <label><input type="radio" name={`explicit-${formId || 'default'}`} value="yes" checked={isExplicit} onChange={() => setIsExplicit(true)} /> Yes</label>
            </div>
          </div>
          <div className="solo-genres">
            <label className="solo-label">Genres</label>
            <select multiple className="solo-select" value={selectedGenres} onChange={handleGenreChange}>
              {genreOptions.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>
          <div className="solo-length">
            <label className="solo-label">Length</label>
            <select className="solo-select" value={lengthMetric} onChange={e => setLengthMetric(e.target.value as 'duration_ms' | 'total_episodes')}>
              <option value="duration_ms">Episode Duration (minutes)</option>
              <option value="total_episodes">Total Episodes</option>
            </select>
            <input className="solo-input" type="number" min={defaultMinLength} max={10000} value={maxLength} onChange={e => setMaxLength(Number(e.target.value) || defaultMaxLength)} />
            <input className="solo-input" type="range" min={defaultMinLength} max={maxLength} value={minLength} onChange={e => setMinLength(Number(e.target.value))} />
            <div className="solo-selected-value">Selected Value: {minLength}</div>
          </div>
          <div className="solo-year">
            <label className="solo-label">Year</label>
            <input className="solo-input" type="number" min={1900} max={2100} value={releaseYear} onChange={event => setReleaseYear(event.target.value)} />
          </div>
          <div className="solo-publisher">
            <label className="solo-label">Publisher</label>
            <input className="solo-input" type="text" value={publisher} onChange={event => setPublisher(event.target.value)} />
          </div>
        </div>
        <div className="solo-search-row">
          <button type="submit" className="solo-search-btn">SEARCH</button>
        </div>
      </form>
    )
  }
  // ...existing code for collab mode...
  return (
    <form onSubmit={handleSubmit} className="search-form" id={formId}>
      {/* ...existing code for collab mode... */}
    </form>
  )
}

export default QueryComponent
