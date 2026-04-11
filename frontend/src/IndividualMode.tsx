import QueryComponent, { SearchRequest } from './QueryComponent';
import './IndividualMode.css';

interface IndividualModeProps {
  onSearch: (request: SearchRequest) => Promise<void> | void;
}

function IndividualMode({ onSearch }: IndividualModeProps) {
  return (
    <div className="solo-layout">
      <div className="solo-form-card">
        <QueryComponent mode="solo" onSearch={onSearch} />
      </div>
      <div className="instructions-panel">
        <h3>Instructions</h3>
        <div className="instructions-box">
          <ul>
            <li>Enter a search query and select your desired filters.</li>
            <li>Genres can be multi-selected using Ctrl (Windows) or Cmd (Mac).</li>
            <li>Adjust the length metric and range as needed.</li>
            <li>Click <b>SEARCH</b> to find matching podcasts.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default IndividualMode;
