// src/components/ConfigModal.jsx
import { useState } from 'react';

export default function ConfigModal({ current, onSave, onClose }) {
  const [url, setUrl] = useState(current || '');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>⚙ Configure Data Source</h2>
        <p>
          Enter the raw GitHub URL of your <code>nse_participant_oi_combined.csv</code>.<br />
          Format: <code style={{ color: 'var(--cyan)', fontSize: 11 }}>
            https://raw.githubusercontent.com/USERNAME/REPO/main/nse_participant_oi_combined.csv
          </code>
        </p>

        <label>CSV Raw URL</label>
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://raw.githubusercontent.com/..."
          autoFocus
        />

        <div className="modal-actions">
          {onClose && <button className="btn btn-ghost" onClick={onClose}>Cancel</button>}
          <button className="btn btn-primary" onClick={() => onSave(url)} disabled={!url}>
            Save & Load
          </button>
        </div>
      </div>
    </div>
  );
}
