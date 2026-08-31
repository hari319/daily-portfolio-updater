import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ErrorsPanel({ errors = [] }) {
  if (!errors || errors.length === 0) return null;

  return (
    <div className="errors-panel">
      <div className="d-flex align-items-center gap-2 mb-2">
        <AlertTriangle size={18} className="text-danger" />
        <h4 className="m-0">Fetch Problems</h4>
      </div>
      <ul className="errors-list">
        {errors.map((err, idx) => (
          <li key={`${err.symbol}-${idx}`}>
            <strong>{err.symbol}</strong> — {err.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
