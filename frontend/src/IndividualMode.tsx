import QueryComponent, { SearchRequest } from './QueryComponent';
import './IndividualMode.css';

interface IndividualModeProps {
  onSearch: (request: SearchRequest) => Promise<void> | void;
  initialQuery?: string;
  draft?: SearchRequest;
  onDraftChange?: (request: SearchRequest) => void;
  llmAvailable?: boolean;
}

function IndividualMode({ onSearch, initialQuery = '', draft, onDraftChange, llmAvailable = true }: IndividualModeProps) {
  return (
    <div className="individual-mode-fullscreen">
      <QueryComponent
        onSearch={onSearch}
        initialQuery={initialQuery}
        initialRequest={draft}
        onDraftChange={onDraftChange}
        llmAvailable={llmAvailable}
      />
    </div>
  );
}

export default IndividualMode;
