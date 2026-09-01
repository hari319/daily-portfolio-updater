import React, { useState } from 'react';
import { ExternalLink, Edit2, Trash2, Calendar, FileText, Clock } from 'lucide-react';

export default function StatusTable({
  items = [],
  liveQuotes = {},
  onEditItem,
  onDeleteItem,
  disabled = false,
}) {
  // State for selected history date per ticker: { [symbol]: selectedItemId }
  const [selectedHistoryMap, setSelectedHistoryMap] = useState({});

  const getTradingViewUrl = (symbol) => {
    let clean = (symbol || '').toUpperCase();
    if (clean.endsWith('.NS')) {
      return `https://www.tradingview.com/chart/?symbol=NSE%3A${clean.slice(0, -3)}`;
    }
    if (clean.endsWith('.BO')) {
      return `https://www.tradingview.com/chart/?symbol=BSE%3A${clean.slice(0, -3)}`;
    }
    return `https://www.tradingview.com/chart/?symbol=${clean}`;
  };

  const formatPrice = (val, currency = 'INR') => {
    if (val === null || val === undefined || val === '') return '—';
    const num = Number(val);
    if (isNaN(num)) return String(val);
    return `${currency === 'INR' ? '₹' : currency + ' '}${num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatTimestamp = (isoStr) => {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) {
      return isoStr;
    }
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const renderScenarioTarget = (pair, typeClass) => {
    if (!pair || (!pair[0] && !pair[1])) {
      return <span className="text-muted">—</span>;
    }
    const targetPrice = pair[0];
    const targetCagr = pair[1];

    return (
      <div className={`scenario-pill-pair ${typeClass}`}>
        <div className="scenario-item-target">
          {targetPrice ? <span className="target-num">₹{targetPrice}</span> : <span className="pill-empty">—</span>}
        </div>
        {targetCagr && (
          <div className="scenario-item-cagr">
            <span className="cagr-val">{targetCagr}%</span>
          </div>
        )}
      </div>
    );
  };

  if (!items || items.length === 0) {
    return (
      <div className="p-5 text-center text-muted">
        <FileText size={32} className="opacity-40 mb-2" />
        <p className="mb-0">No stock status records found. Click <strong>+ Add Stock</strong> above to create one.</p>
      </div>
    );
  }

  // Group items by ticker symbol
  const groupedBySymbol = {};
  items.forEach((item) => {
    const sym = item.symbol;
    if (!groupedBySymbol[sym]) {
      groupedBySymbol[sym] = [];
    }
    groupedBySymbol[sym].push(item);
  });

  const uniqueSymbols = Object.keys(groupedBySymbol);

  return (
    <div className="table-responsive-wrapper">
      <table className="table-stock status-table">
        <thead>
          <tr>
            <th style={{ width: '180px' }}>Ticker</th>
            <th style={{ width: '180px' }}>Date of Analysis</th>
            <th style={{ width: '130px' }}>Price of Analysis</th>
            <th style={{ width: '150px' }}>Current Price</th>
            <th style={{ width: '140px' }}>Base</th>
            <th style={{ width: '140px' }}>Bull</th>
            <th style={{ width: '140px' }}>Bear</th>
            <th>Remarks</th>
            <th style={{ width: '75px', textAlign: 'center' }}>
              <span className="visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {uniqueSymbols.map((symbol) => {
            const historyList = groupedBySymbol[symbol] || [];
            // Default to latest (first in list) if not explicitly chosen
            const selectedId = selectedHistoryMap[symbol] || historyList[0]?.id;
            const activeItem = historyList.find((it) => it.id === selectedId) || historyList[0];

            if (!activeItem) return null;

            const liveQuote = liveQuotes[symbol];
            const livePrice = liveQuote?.price;
            const hasMultipleHistory = historyList.length > 1;

            // Calculate change from analysis price if available
            let priceChangePercent = null;
            if (
              livePrice &&
              activeItem.price_of_analysis &&
              activeItem.price_of_analysis > 0
            ) {
              priceChangePercent =
                ((livePrice - activeItem.price_of_analysis) /
                  activeItem.price_of_analysis) *
                100;
            }

            return (
              <tr key={symbol}>
                {/* Ticker */}
                <td>
                  <div className="col-ticker-wrap">
                    <div className="d-flex align-items-center gap-1">
                      <a
                        href={getTradingViewUrl(activeItem.symbol)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ticker-link d-inline-flex align-items-center gap-1"
                        title={`Open ${activeItem.symbol} on TradingView`}
                      >
                        {activeItem.symbol}
                        <ExternalLink size={12} className="opacity-75" />
                      </a>
                      {hasMultipleHistory && (
                        <span
                          className="history-count-badge"
                          title={`${historyList.length} analysis records available`}
                        >
                          <Clock size={10} className="me-1" />
                          {historyList.length}
                        </span>
                      )}
                    </div>
                    {activeItem.name && (
                      <div className="stock-company-name" title={activeItem.name}>
                        {activeItem.name}
                      </div>
                    )}
                  </div>
                </td>

                {/* Date of Analysis (Fancy dropdown if multiple history, badge if single) */}
                <td>
                  {hasMultipleHistory ? (
                    <div className="fancy-date-select-container">
                      <div className="fancy-date-select-inner">
                        <Calendar size={13} className="text-primary date-icon" />
                        <select
                          className="fancy-date-select"
                          value={activeItem.id}
                          onChange={(e) =>
                            setSelectedHistoryMap((prev) => ({
                              ...prev,
                              [symbol]: e.target.value,
                            }))
                          }
                          aria-label={`Select analysis date for ${symbol}`}
                        >
                          {historyList.map((hist, idx) => (
                            <option key={hist.id} value={hist.id}>
                              {hist.date_of_analysis || 'No Date'} {idx === 0 ? '★ Latest' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="single-date-pill">
                      <Calendar size={13} className="text-muted opacity-75 me-1" />
                      <span className="analysis-date-val">
                        {activeItem.date_of_analysis || '—'}
                      </span>
                    </div>
                  )}
                </td>

                {/* Price of Analysis */}
                <td>
                  <span className="col-price-val text-muted">
                    {formatPrice(activeItem.price_of_analysis, activeItem.currency)}
                  </span>
                </td>

                {/* Current Price (Price upside, Time/Date downside) */}
                <td>
                  <div className="col-live-price-wrap">
                    <div className="d-flex align-items-center gap-1">
                      <span className="col-price-val fw-bold text-dark">
                        {livePrice !== undefined && livePrice !== null
                          ? formatPrice(livePrice, activeItem.currency)
                          : <span className="spinner-border spinner-border-sm text-muted" role="status" style={{ width: '12px', height: '12px' }} />}
                      </span>
                      {priceChangePercent !== null && (
                        <span
                          className={`price-change-pill ${
                            priceChangePercent >= 0 ? 'pos' : 'neg'
                          }`}
                          title={`Change since analysis on ${activeItem.date_of_analysis}`}
                        >
                          {priceChangePercent >= 0 ? '+' : ''}
                          {priceChangePercent.toFixed(1)}%
                        </span>
                      )}
                    </div>

                    {/* Date and time below price */}
                    {liveQuote && liveQuote.as_of && (
                      <div className="price-as-of-text">
                        {liveQuote.is_cached && (
                          <span className="cached-badge me-1" title="Live quote unavailable, showing last stored price">
                            Last known
                          </span>
                        )}
                        <span>{formatTimestamp(liveQuote.as_of)}</span>
                      </div>
                    )}
                  </div>
                </td>

                {/* Base (Target & CAGR) */}
                <td>{renderScenarioTarget(activeItem.base, 'base-pill')}</td>

                {/* Bull (Target & CAGR) */}
                <td>{renderScenarioTarget(activeItem.bull, 'bull-pill')}</td>

                {/* Bear (Target & CAGR) */}
                <td>{renderScenarioTarget(activeItem.bear, 'bear-pill')}</td>

                {/* Remarks */}
                <td>
                  <div className="remarks-text" title={activeItem.remarks}>
                    {activeItem.remarks || <span className="text-muted">—</span>}
                  </div>
                </td>

                {/* Actions: Edit & Delete */}
                <td style={{ textAlign: 'center' }}>
                  <div className="d-inline-flex align-items-center gap-1">
                    <button
                      type="button"
                      className="action-edit-btn"
                      title={`Edit or add history for ${activeItem.symbol}`}
                      disabled={disabled}
                      onClick={() => onEditItem(activeItem)}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      className="action-del-btn"
                      title={`Delete this analysis entry (${activeItem.date_of_analysis})`}
                      disabled={disabled}
                      onClick={() => onDeleteItem(activeItem.id, activeItem.symbol)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
