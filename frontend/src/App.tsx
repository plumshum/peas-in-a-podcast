import { useState, useEffect } from 'react'
import './App.css'
import MainLogo from './assets/main_logo.png'
import MainLogoInstructions from './assets/instr main.png'
import ResultInstructions from './assets/instr result.png'
import Pea1 from './assets/pea1.png'
import Pea2 from './assets/pea2.png'
import { Podcast, SearchPayload } from './types'
import Chat from './Chat'
import QueryComponent from './QueryComponent'
import ResultComponent from './ResultComponent'
import MatchResults from './Matchresults'
type ListeningMode = 'solo' | 'collab'
type AppView = 'query' | 'results'

function App(): JSX.Element {
  const [useLlm, setUseLlm] = useState<boolean | null>(null)
  const [listeningMode, setListeningMode] = useState<ListeningMode>('solo')
  const [view, setView] = useState<AppView>('query')
  const [chatSeedTerm, setChatSeedTerm] = useState<string>('')
  // const [episodes, setEpisodes] = useState<Episode[]>([])
  const [podcasts, setPodcasts] = useState<Podcast[]>([])
  const [matchPct, setMatchPct] = useState<number>(0)
  const [collabUser1, setCollabUser1] = useState<SearchPayload | null>(null)
  const [collabUser2, setCollabUser2] = useState<SearchPayload | null>(null)
  const [collabStatus, setCollabStatus] = useState<string>('')

  useEffect(() => {
    // Right now should be False until implemented
    fetch('/api/config').then(r => r.json()).then(data => setUseLlm(data.use_llm))
  }, [])

  const handleSearch = async (payload: SearchPayload): Promise<void> => {
    if (payload.query.trim() === '') {
      setPodcasts([])
      setView('query')
      return
    }

    const params = new URLSearchParams()
    params.set('query', payload.query)
    params.set('explicit', String(payload.explicit))
    payload.genres.forEach(genre => params.append('genres', genre))
    params.set('publisher', payload.publisher)
    params.set('releaseYear', payload.releaseYear)
    params.set('lengthMetric', payload.lengthMetric)
    params.set('maxLength', String(payload.maxLength))

    const response = await fetch(`/api/podcasts?${params.toString()}`)
    const data: Podcast[] = await response.json()
    console.log('Search results:', data)
    setPodcasts(data)
    setView('results')
  }

  const executeCollabSearch = async (userA: SearchPayload, userB: SearchPayload): Promise<void> => {
    if (userA.query.trim() === '' || userB.query.trim() === '') {
      setPodcasts([])
      setView('query')
      return
    }

    setCollabStatus('Finding recommendations for both users...')
    const response = await fetch('/api/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userA, userB }),
    })
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Collaborative search failed with status ${response.status}`)
    }
    const data: { match_pct: number; results: Podcast[] } = await response.json()
    console.log('Collaborative search results:', data)
    setPodcasts(data.results)
    setMatchPct(data.match_pct)
    setCollabStatus('')
    setView('results')
  }

  const handleCollabSearchUser1 = async (payload: SearchPayload): Promise<void> => {
    setCollabUser1(payload)
    if (collabUser2) {
      try {
        await executeCollabSearch(payload, collabUser2)
      } catch (error) {
        console.error(error)
        setCollabStatus('Collaborative search failed. Check backend logs and try again.')
      }
      return
    }
    setCollabStatus('User 1 is ready. Waiting for User 2 to submit.')
  }

  const handleCollabSearchUser2 = async (payload: SearchPayload): Promise<void> => {
    setCollabUser2(payload)
    if (collabUser1) {
      try {
        await executeCollabSearch(collabUser1, payload)
      } catch (error) {
        console.error(error)
        setCollabStatus('Collaborative search failed. Check backend logs and try again.')
      }
      return
    }
    setCollabStatus('User 2 is ready. Waiting for User 1 to submit.')
  }

  /* TODO: Skeleton code for chat search */
  const handleChatSearch = async (value: string): Promise<void> => {
    setListeningMode('solo')
    setChatSeedTerm(value)
    await handleSearch({
      query: value,
      explicit: false,
      genres: [],
      lengthMetric: 'duration_ms',
      maxLength: 50,
      publisher: '',
      releaseYear: '',
    })
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
                onSearch={handleCollabSearchUser1}
              />
            </div>
            <div className="query-card-shell">
              <img src={Pea1} alt="" className="query-decor query-decor-right" aria-hidden="true" />
              <QueryComponent
                title="Query Component - User 2"
                idPrefix="collab-user-2"
                onSearch={handleCollabSearchUser2}
              />
            </div>
            {collabStatus && <p className="collab-status">{collabStatus}</p>}
          </div>
        )}
      </div>

      {view === 'results' &&  listeningMode == 'solo' &&(
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

      
      {view === 'results' && listeningMode === 'collab' && (
        <>
          <img src={ResultInstructions} alt="results instructions" className="results-instructions" />
          <div className="results-toolbar">
            <button type="button" className="back-button" onClick={handleBackToQuery}>
              Back to Search
            </button>
          </div>
          <div id="answer-box">
            {podcasts.length > 0 ? (
              <MatchResults matchPct={matchPct}
               results={podcasts} />
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
