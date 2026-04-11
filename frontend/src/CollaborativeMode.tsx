import { useState } from 'react';
import { SearchRequest } from './QueryComponent';
import './CollaborativeMode.css';

interface CollaborativeModeProps {
  onCollaborativeSearch: (user1: SearchRequest, user2: SearchRequest) => Promise<void> | void;
}

function CollaborativeMode({ onCollaborativeSearch }: CollaborativeModeProps) {
  const [user1, setUser1] = useState<SearchRequest>({ query: '', genres: [], lengthMetric: 'total_episodes', minLength: 0, maxLength: 500 });
  const [user2, setUser2] = useState<SearchRequest>({ query: '', genres: [], lengthMetric: 'total_episodes', minLength: 0, maxLength: 500 });
  const [submitting, setSubmitting] = useState(false);

  // genre options
  const genreOptions = [
    'Comedy', 'News', 'Technology', 'Education', 'Business', 'Health', 'Sports', 'History', 'Science', 'True Crime', 'Music', 'Society',
  ];

  const handleInput = (user: 1 | 2, field: keyof SearchRequest, value: any) => {
    if (user === 1) setUser1(prev => ({ ...prev, [field]: value }));
    else setUser2(prev => ({ ...prev, [field]: value }));
  };

  const handleGenreChange = (user: 1 | 2, event: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(event.target.selectedOptions, option => option.value);
    handleInput(user, 'genres', values);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user1.query.trim() && user2.query.trim()) {
      setSubmitting(true);
      await onCollaborativeSearch(user1, user2);
      setSubmitting(false);
    }
  };

  return (
    <form className="collab-main-form-box" onSubmit={handleSubmit}>
      <div className="collab-forms-row">
        {/* User 1 Form */}
        <div className="collab-form-side" style={{ background: '#f3fbe7', borderRadius: '1.1rem', padding: '1.2rem', minWidth: 320 }}>
          <div className="collab-form-label">Query</div>
          <input
            type="text"
            className="collab-query-input form-input"
            value={user1.query}
            onChange={e => handleInput(1, 'query', e.target.value)}
            placeholder="Query"
          />
          <div className="form-row">
            <label className="form-label" style={{ marginRight: 8 }}>Explicit?</label>
            <input
              type="checkbox"
              checked={!!user1.explicit}
              onChange={e => handleInput(1, 'explicit', e.target.checked)}
              style={{ marginTop: 2 }}
            />
            <span style={{ flex: 1 }}></span>
            <label className="form-label" style={{ marginRight: 8 }}>Genres</label>
            <select
              multiple
              className="form-select"
              value={user1.genres}
              onChange={e => handleGenreChange(1, e)}
              style={{ minWidth: 120 }}
            >
              {genreOptions.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label className="form-label">Length</label>
            <input
              type="number"
              className="form-input"
              placeholder="Length"
              value={user1.minLength ?? ''}
              onChange={e => handleInput(1, 'minLength', Number(e.target.value))}
              style={{ maxWidth: 80 }}
            />
            <span style={{ margin: '0 4px' }}>-</span>
            <input
              type="number"
              className="form-input"
              placeholder="Max"
              value={user1.maxLength ?? ''}
              onChange={e => handleInput(1, 'maxLength', Number(e.target.value))}
              style={{ maxWidth: 80 }}
            />
          </div>
          <div className="form-row">
            <label className="form-label">Year</label>
            <input
              type="text"
              className="form-input"
              placeholder="Year"
              value={user1.releaseYear || ''}
              onChange={e => handleInput(1, 'releaseYear', e.target.value)}
              style={{ maxWidth: 100 }}
            />
            <span style={{ flex: 1 }}></span>
            <label className="form-label">Publisher</label>
            <input
              type="text"
              className="form-input"
              placeholder="Publisher"
              value={user1.publisher || ''}
              onChange={e => handleInput(1, 'publisher', e.target.value)}
              style={{ maxWidth: 120 }}
            />
          </div>
        </div>
        {/* User 2 Form */}
        <div className="collab-form-side" style={{ background: '#ede1f3', borderRadius: '1.1rem', padding: '1.2rem', minWidth: 320 }}>
          <div className="collab-form-label">Query</div>
          <input
            type="text"
            className="collab-query-input form-input"
            value={user2.query}
            onChange={e => handleInput(2, 'query', e.target.value)}
            placeholder="Query"
          />
          <div className="form-row">
            <label className="form-label" style={{ marginRight: 8 }}>Explicit?</label>
            <input
              type="checkbox"
              checked={!!user2.explicit}
              onChange={e => handleInput(2, 'explicit', e.target.checked)}
              style={{ marginTop: 2 }}
            />
            <span style={{ flex: 1 }}></span>
            <label className="form-label" style={{ marginRight: 8 }}>Genres</label>
            <select
              multiple
              className="form-select"
              value={user2.genres}
              onChange={e => handleGenreChange(2, e)}
              style={{ minWidth: 120 }}
            >
              {genreOptions.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label className="form-label">Length</label>
            <input
              type="number"
              className="form-input"
              placeholder="Length"
              value={user2.minLength ?? ''}
              onChange={e => handleInput(2, 'minLength', Number(e.target.value))}
              style={{ maxWidth: 80 }}
            />
            <span style={{ margin: '0 4px' }}>-</span>
            <input
              type="number"
              className="form-input"
              placeholder="Max"
              value={user2.maxLength ?? ''}
              onChange={e => handleInput(2, 'maxLength', Number(e.target.value))}
              style={{ maxWidth: 80 }}
            />
          </div>
          <div className="form-row">
            <label className="form-label">Year</label>
            <input
              type="text"
              className="form-input"
              placeholder="Year"
              value={user2.releaseYear || ''}
              onChange={e => handleInput(2, 'releaseYear', e.target.value)}
              style={{ maxWidth: 100 }}
            />
            <span style={{ flex: 1 }}></span>
            <label className="form-label">Publisher</label>
            <input
              type="text"
              className="form-input"
              placeholder="Publisher"
              value={user2.publisher || ''}
              onChange={e => handleInput(2, 'publisher', e.target.value)}
              style={{ maxWidth: 120 }}
            />
          </div>
        </div>
      </div>
      <div className="collab-search-row">
        <button type="submit" className="collab-search-btn" disabled={submitting || !user1.query.trim() || !user2.query.trim()}>
          {submitting ? 'SEARCHING...' : 'SEARCH TOGETHER'}
        </button>
      </div>
    </form>
  );
}

export default CollaborativeMode;
