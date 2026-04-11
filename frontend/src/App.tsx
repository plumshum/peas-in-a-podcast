import { useState, useEffect } from 'react'
import './App.css'
import ResultInstructions from './assets/instr result.png'
import { Podcast } from './types'
import Chat from './Chat'
import { type SearchRequest } from './QueryComponent'
import QueryComponent from './QueryComponent'
import ResultComponent from './ResultComponent'
import MainLogo from './assets/main_logo.png'
import CollaborativeMode from './CollaborativeMode'
type ListeningMode = 'solo' | 'collab'
type AppView = 'query' | 'results'

function App(): JSX.Element {
  const [useLlm, setUseLlm] = useState<boolean | null>(null)
  const [listeningMode, setListeningMode] = useState<ListeningMode>('solo')
  const [view, setView] = useState<AppView>('query')
  const [podcasts, setPodcasts] = useState<Podcast[]>([])

  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(data => setUseLlm(data.use_llm))
  }, [])

  const handleSearch = async (request: SearchRequest): Promise<void> => {
    if (request.query.trim() === '') {
      setPodcasts([])
      setView('query')
      return
    }
    const params = new URLSearchParams()
    params.set('query', request.query)
    if (request.explicit !== undefined) params.set('explicit', String(request.explicit))
    request.genres?.forEach(genre => params.append('genres', genre))
    request.excludedGenres?.forEach(genre => params.append('excludedGenres', genre))
    if (request.publisher?.trim()) params.set('publisher', request.publisher.trim())
    if (request.releaseYear?.trim()) params.set('releaseYear', request.releaseYear.trim())
    if (request.lengthMetric) params.set('lengthMetric', request.lengthMetric)
    if (request.minLength !== undefined) params.set('minLength', String(request.minLength))
    if (request.maxLength !== undefined) params.set('maxLength', String(request.maxLength))
    const response = await fetch(`/api/podcasts?${params.toString()}`)
    const data: Podcast[] = await response.json()
    setPodcasts(data)
    setView('results')
  }
  const handleBackToQuery = (): void => {
    setView('query')
  }

  // Real collaborative handler
  const handleCollaborativeSearch = async (user1: SearchRequest, user2: SearchRequest): Promise<void> => {
    // Example: call a real collaborative endpoint, e.g. /api/collab_podcasts
    const params = new URLSearchParams()
    // You may want to send both users' queries as JSON, or as separate params
    params.set('user1', JSON.stringify(user1))
    params.set('user2', JSON.stringify(user2))
    const response = await fetch(`/api/collab_podcasts?${params.toString()}`)
    const data: Podcast[] = await response.json()
    setPodcasts(data)
    setView('results')
  }
  if (useLlm === null) return <></>

  return (
    <div className="page-root">
      <div className="centered-app-shell">
        <header className="main-header">
          <h1 className="main-title">Peas <em>in a Podcast</em></h1>
          <div className="main-logo">
            <img src={MainLogo} alt="Peas in a Podcast logo" className="main-logo-img" />
          </div>
          <div className="main-subtitle">Today, I’m listening...</div>
        </header>
        {/* Only show toggle buttons in form view */}
        {view === 'query' && (
          <div className="mode-toggle-row">
            <button
              className={`mode-toggle left${listeningMode === 'solo' ? ' active' : ''}`}
              onClick={() => setListeningMode('solo')}
              type="button"
            >
              by myself
            </button>
            <button
              className={`mode-toggle right${listeningMode === 'collab' ? ' active' : ''}`}
              onClick={() => setListeningMode('collab')}
              type="button"
            >
              with my bestie
            </button>
          </div>
        )}
        <div className="main-panel">
          {view === 'query' && (
            <>
              {listeningMode === 'solo' ? (
                <div className="solo-layout">
                  <div className="solo-form-card">
                    <QueryComponent
                      mode="solo"
                      onSearch={handleSearch}
                    />
                  </div>
                  <div className="instructions-panel">
                    <span className="instructions-label">Instructions</span>
                    <div className="instructions-box">
                      {/* Add instructions content here */}
                    </div>
                  </div>
                </div>
              ) : (
                <CollaborativeMode onCollaborativeSearch={handleCollaborativeSearch} />
              )}
            </>
          )}
          {view === 'results' && (
            <div className="results-area">
              <img src={ResultInstructions} alt="results instructions" className="results-instructions" />
              <div className="results-toolbar">
                <button type="button" className="back-button" onClick={handleBackToQuery}>
                  Back to Search
                </button>
              </div>
              <div id="answer-box">
                {podcasts.length > 0 ? (
                  <ResultComponent podcasts={podcasts} />
                ) : (
                  <p className="no-results">No podcasts found for this search.</p>
                )}
              </div>
            </div>
          )}
        </div>
        {useLlm && <Chat onSearchTerm={query => handleSearch({ query })} />}
      </div>
    </div>
  )
}

export default App
