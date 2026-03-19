import { Podcast } from './types'
import './ResultComponent.css'

interface ResultComponentProps {
  podcasts: Podcast[]
}

function ResultComponent({ podcasts }: ResultComponentProps): JSX.Element {
  return (
    <div className="results-container">
      {podcasts.map((podcast, index) => (
        <div key={index} className="podcast-card">
          {/* Image and main info section */}
          <div className="card-header">
            {podcast.image_url && (
              <img src={podcast.image_url} alt={podcast.title} className="podcast-image" />
            )}
            <div className="podcast-info">
              <h2 className="podcast-title">{podcast.title}</h2>

              {/* Genre tags */}
              {podcast.categories && podcast.categories.length > 0 && (
                <div className="genre-tags">
                  {podcast.categories.split(',').map((genre, i) => (
                    <span key={i} className="tag">{genre.trim()}</span>
                  ))}
                </div>
              )}

              {/* Metadata row */}
              <div className="metadata-row">
                {podcast.author && (
                  <span className="metadata-item">
                    <strong>Publisher:</strong> {podcast.author}
                  </span>
                )}
                {podcast.popularity_score !== undefined && (
                  <span className="metadata-item">
                    <strong>Popularity:</strong> {podcast.popularity_score.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="podcast-description">{podcast.description}</p>
            </div>
          </div>

          {/* Scores section */}
          <div className="scores-section">
            {podcast.score !== undefined && (
              <div className="similarity-score">
                <strong>Similarity Score:</strong> {podcast.score.toFixed(4)}
              </div>
            )}
          </div>

          {/* Personalized textbox */}
          <div className="personalization-box">
            <label className="personalization-label">Why U would ❤️ this</label>
            <textarea
              className="personalization-textarea"
              placeholder="Explaining why this ranking is good for you..."
              disabled
            />
          </div>

          {/* Links */}
          <div className="links-section">
            {podcast.image_url && (
              <a href={podcast.image_url} target="_blank" rel="noopener noreferrer" className="link-item">
                Podcast Image
              </a>
            )}
            {podcast.feed_url && (
              <a href={podcast.feed_url} target="_blank" rel="noopener noreferrer" className="link-item">
                Feed URL
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ResultComponent
