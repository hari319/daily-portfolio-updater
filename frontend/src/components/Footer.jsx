import React from 'react';

export default function Footer({ connectionStatus = 'live' }) {
  return (
    <footer className="d-flex flex-wrap align-items-center justify-content-between gap-3 pt-4 mt-4 border-top text-muted" style={{ fontSize: '0.82rem' }}>
      <span>Live data only — no historical view. Data via yfinance; charts open on TradingView.</span>

      <div className="d-flex align-items-center gap-2">
        <span className={`conn-badge ${connectionStatus}`}>
          <span className="conn-dot" />
          <span>{connectionStatus === 'live' ? 'Live SSE' : 'Polling'}</span>
        </span>
      </div>
    </footer>
  );
}
