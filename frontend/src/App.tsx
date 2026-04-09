import { useState, useEffect } from 'react'
import './App.css'
import MainLogo from './assets/main_logo.png'
import MainLogoInstructions from './assets/instr main.png'
import ResultInstructions from './assets/instr result.png'
import Pea1 from './assets/pea1.png'
import Pea2 from './assets/pea2.png'
import { Podcast } from './types'
import Chat from './Chat'
import QueryComponent, { type SearchRequest } from './QueryComponent'
import ResultComponent from './ResultComponent'
type ListeningMode = 'solo' | 'collab'
type AppView = 'query' | 'results'

function App(): JSX.Element {
  const [useLlm, setUseLlm] = useState<boolean | null>(null)
  const [listeningMode, setListeningMode] = useState<ListeningMode>('solo')
  const [view, setView] = useState<AppView>('query')
  const [chatSeedTerm, setChatSeedTerm] = useState<string>('')
  // const [episodes, setEpisodes] = useState<Episode[]>([])
  const [podcasts, setPodcasts] = useState<Podcast[]>([])

  useEffect(() => {
    // Right now should be False until implemented
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

    if (request.explicit !== undefined) {
      params.set('explicit', String(request.explicit))
    }

    request.genres?.forEach(genre => params.append('genres', genre))
    request.excludedGenres?.forEach(genre => params.append('excludedGenres', genre))

    if (request.publisher?.trim()) {
      params.set('publisher', request.publisher.trim())
    }

    if (request.releaseYear?.trim()) {
      params.set('releaseYear', request.releaseYear.trim())
    }

    if (request.lengthMetric) {
      params.set('lengthMetric', request.lengthMetric)
    }

    if (request.maxLength !== undefined) {
      params.set('maxLength', String(request.maxLength))
    }

    const response = await fetch(`/api/podcasts?${params.toString()}`)
    const data: Podcast[] = await response.json()
    console.log('Search results:', data)
    setPodcasts(data)
    setView('results')
  }

  /* TODO: Skeleton code for chat search */
  const handleChatSearch = async (value: string): Promise<void> => {
    setListeningMode('solo')
    setChatSeedTerm(value)
    await handleSearch({ query: value })
  }

  const handleBackToQuery = (): void => {
    setView('query')
  }

  if (useLlm === null) return <></>

  return (
    <div className={`full-body-container ${useLlm ? 'llm-mode' : ''}`}>
      <div className="top-text">
        <div className="main-logo">
          <img src={MainLogo} alt="main logo" />
        </div>
        {view == 'query' &&
        (<div className="instructions">
          <img src={MainLogoInstructions} alt="instructions" />
        </div>)
        }
        {view === 'query' && (
          <div className="mode-tabs" role="tablist" aria-label="Listening mode">
            <button
              type="button"
              className={`mode-tab ${listeningMode === 'solo' ? 'active' : ''}`}
              onClick={() => setListeningMode('solo')}
            >
              Just Myself
            </button>
            <button
              type="button"
              className={`mode-tab ${listeningMode === 'collab' ? 'active' : ''}`}
              onClick={() => setListeningMode('collab')}
            >
              Collaborative Listening
            </button>
          </div>
        )}

        {view === 'query' && listeningMode === 'solo' && (
          <div className="query-card-shell">
            <img src={Pea2} alt="" className="query-decor query-decor-left" aria-hidden="true" />
            <QueryComponent
              title="Query Component"
              idPrefix="solo"
              onSearch={handleSearch}
              initialQuery={chatSeedTerm}
            />
          </div>
        )}

        {view === 'query' && listeningMode === 'collab' && (
          <div className="collab-grid">
            <div className="query-card-shell">
              <img src={Pea2} alt="" className="query-decor query-decor-left" aria-hidden="true" />
              <QueryComponent
                title="Query Component - User 1"
                idPrefix="collab-user-1"
                onSearch={handleSearch}
              />
            </div>
            <div className="query-card-shell">
              <img src={Pea1} alt="" className="query-decor query-decor-right" aria-hidden="true" />
              <QueryComponent
                title="Query Component - User 2"
                idPrefix="collab-user-2"
                onSearch={handleSearch}
              />
            </div>
          </div>
        )}
      </div>

      {view === 'results' && (
        <>
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
        </>
      )}

      {useLlm && <Chat onSearchTerm={handleChatSearch} />}
    </div>
  )
}

export default App
