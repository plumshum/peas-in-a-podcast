import { useState, useEffect } from 'react'
import './App.css'
import MainLogo from './assets/main_logo.png'
import { Episode } from './types'
import Chat from './Chat'
import QueryComponent from './QueryComponent'
type ListeningMode = 'solo' | 'collab'

function App(): JSX.Element {
  const [useLlm, setUseLlm] = useState<boolean | null>(null)
  const [listeningMode, setListeningMode] = useState<ListeningMode>('solo')
  const [chatSeedTerm, setChatSeedTerm] = useState<string>('')
  const [episodes, setEpisodes] = useState<Episode[]>([])

  useEffect(() => {
    // Right now should be False until implemented
    fetch('/api/config').then(r => r.json()).then(data => setUseLlm(data.use_llm))
  }, [])

  const handleSearch = async (value: string): Promise<void> => {
    if (value.trim() === '') { setEpisodes([]); return }
    const response = await fetch(`/api/episodes?title=${encodeURIComponent(value)}`)
    const data: Episode[] = await response.json()
    setEpisodes(data)
  }

  /* TODO: Skeleton code for chat search */
  const handleChatSearch = async (value: string): Promise<void> => {
    setListeningMode('solo')
    setChatSeedTerm(value)
    await handleSearch(value)
  }

  if (useLlm === null) return <></>

  return (
    <div className={`full-body-container ${useLlm ? 'llm-mode' : ''}`}>
      <div className="top-text">
        <div className="main-logo">
          <img src={MainLogo} alt="main logo" />
        </div>

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

        {listeningMode === 'solo' && (
          <QueryComponent
            title="Query Component"
            idPrefix="solo"
            onSearch={handleSearch}
            initialQuery={chatSeedTerm}
          />
        )}

        {listeningMode === 'collab' && (
          <div className="collab-grid">
            <QueryComponent
              title="Query Component - User 1"
              idPrefix="collab-user-1"
              onSearch={handleSearch}
            />
            <QueryComponent
              title="Query Component - User 2"
              idPrefix="collab-user-2"
              onSearch={handleSearch}
            />
          </div>
        )}
      </div>

      <div id="answer-box">
        {episodes.map((episode, index) => (
          <div key={index} className="episode-item">
            <h3 className="episode-title">{episode.title}</h3>
            <p className="episode-desc">{episode.descr}</p>
            <p className="episode-rating">IMDB Rating: {episode.imdb_rating}</p>
          </div>
        ))}
      </div>

      {useLlm && <Chat onSearchTerm={handleChatSearch} />}
    </div>
  )
}

export default App
