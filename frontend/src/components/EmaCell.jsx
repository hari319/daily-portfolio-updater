import React from 'react';

export default function EmaCell({ cell, period }) {
  if (!cell) {
    return (
      <div className="ema-cell-stack">
        <div className="ema-line">&nbsp;</div>
        <div className="ema-line">&nbsp;</div>
      </div>
    );
  }

  const { daily, weekly } = cell;

  return (
    <div className="ema-cell-stack">
      {/* Daily timeframe */}
      <div className="ema-line">
        <span className="ema-tf">D:</span>
        <span
          className={`ema-val ${daily.below ? 'below' : ''} ${!daily.available ? 'na' : ''}`}
          title={`${period} EMA daily: ${daily.value !== null && daily.value !== undefined ? daily.value : 'not available'}`}
        >
          {daily.display || '—'}
        </span>
      </div>

      {/* Weekly timeframe */}
      <div className="ema-line">
        <span className="ema-tf">W:</span>
        <span
          className={`ema-val ${weekly.below ? 'below' : ''} ${!weekly.available ? 'na' : ''}`}
          title={`${period} EMA weekly: ${weekly.value !== null && weekly.value !== undefined ? weekly.value : 'not available'}`}
        >
          {weekly.display || '—'}
        </span>
      </div>
    </div>
  );
}
