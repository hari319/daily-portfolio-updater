import React, { useState } from 'react';
import {
  Filter,
  Plus,
  Trash2,
  Bookmark,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  Sliders,
  Sparkles,
  Layers,
  ArrowRight,
  HelpCircle,
  Check
} from 'lucide-react';
import {
  SCREENER_FILTERS,
  STRATEGY_PRESETS
} from '../constants/screenerFilters';

export default function ScreenerFilterPanel({
  activePreset,
  onSelectPreset,
  customRules,
  onChangeCustomRules,
  matchMode,
  onChangeMatchMode,
  onClearFilters,
  totalItems,
  rawItemsCount,
  savedCustomPresets = [],
  onSaveCustomPreset,
  onDeleteCustomPreset,
  onLoadCustomPreset,
}) {
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [selectedStrategyInfo, setSelectedStrategyInfo] = useState(null);
  const [newPresetName, setNewPresetName] = useState('');
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);

  // Group filter options by category for the dropdown
  const filterGroups = React.useMemo(() => {
    const groups = {};
    SCREENER_FILTERS.forEach((item) => {
      const g = item.group || 'Other';
      if (!groups[g]) groups[g] = [];
      groups[g].push(item);
    });
    return groups;
  }, []);

  const handleAddRule = () => {
    const newRule = {
      id: Date.now().toString(),
      field: 'close',
      op: '>',
      value: '',
      compareField: '',
      valueMin: '',
      valueMax: '',
    };
    onChangeCustomRules([...customRules, newRule]);
    setShowCustomBuilder(true);
  };

  const handleUpdateRule = (index, updates) => {
    const updated = [...customRules];
    updated[index] = { ...updated[index], ...updates };
    onChangeCustomRules(updated);
  };

  const handleRemoveRule = (index) => {
    const updated = customRules.filter((_, i) => i !== index);
    onChangeCustomRules(updated);
  };

  const handleSaveSubmit = (e) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    onSaveCustomPreset(newPresetName.trim(), customRules, matchMode);
    setNewPresetName('');
    setShowSavePresetModal(false);
  };

  const hasActiveFilter = Boolean(activePreset || customRules.length > 0);

  return (
    <div className="screener-filter-panel mb-4">
      {/* 1-Click Strategy Presets Bar */}
      <div className="dashboard-card p-3 mb-3">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2 pb-2 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <Sliders size={16} className="text-primary" />
            <span className="small fw-bold text-uppercase text-muted">Curated Strategy Presets</span>
            <span className="badge bg-light text-muted border">1-Click Scan</span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className={`btn btn-xs ${showCustomBuilder ? 'btn-primary' : 'btn-outline-secondary'} d-flex align-items-center gap-1`}
              onClick={() => setShowCustomBuilder((prev) => !prev)}
            >
              <Filter size={13} />
              <span>{showCustomBuilder ? 'Hide Custom Builder' : 'Custom Rule Builder'}</span>
              {customRules.length > 0 && (
                <span className="badge bg-white text-dark ms-1">{customRules.length}</span>
              )}
            </button>

            {hasActiveFilter && (
              <button
                type="button"
                className="btn btn-xs btn-outline-danger d-flex align-items-center gap-1"
                onClick={onClearFilters}
                title="Clear all active filters"
              >
                <X size={13} />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Section 1: Ultra High-Conviction Explosive 1-2 Day Setups */}
        <div className="mb-2">
          <div className="d-flex align-items-center gap-1 mb-1">
            <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-0.5 fw-bold" style={{ fontSize: '11px' }}>
              🔥 Explosive 1–2 Day Setups (Top 15–30 Candidates)
            </span>
          </div>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            {STRATEGY_PRESETS.filter((s) =>
              ['institutional_blastoff', 'vcp_squeeze', 'blue_sky_ath', 'consensus_8_8'].includes(s.id)
            ).map((strat) => {
              const isActive = activePreset === strat.id;
              return (
                <div key={strat.id} className="btn-group btn-group-sm">
                  <button
                    type="button"
                    className={`btn btn-sm ${isActive ? 'btn-danger text-white shadow-sm' : 'btn-outline-danger bg-white text-danger'}`}
                    onClick={() => onSelectPreset(strat.id)}
                    title={strat.tagline}
                  >
                    <span className="fw-bold">{strat.name}</span>
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${isActive ? 'btn-danger border-start border-white-50' : 'btn-outline-danger bg-white text-muted'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStrategyInfo(strat);
                    }}
                    title="View strategy explanation and criteria"
                  >
                    <Info size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Classical Swing, Momentum & Long-Term Strategies */}
        <div className="pt-2 border-top">
          <div className="d-flex align-items-center gap-1 mb-1">
            <span className="badge bg-secondary-subtle text-secondary border px-2 py-0.5 fw-semibold" style={{ fontSize: '11px' }}>
              📊 Classical Momentum & Positional Strategies
            </span>
          </div>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            {STRATEGY_PRESETS.filter(
              (s) => !['institutional_blastoff', 'vcp_squeeze', 'blue_sky_ath', 'consensus_8_8'].includes(s.id)
            ).map((strat) => {
              const isActive = activePreset === strat.id;
              return (
                <div key={strat.id} className="btn-group btn-group-sm">
                  <button
                    type="button"
                    className={`btn btn-sm ${isActive ? 'btn-primary text-white shadow-sm' : 'btn-outline-secondary bg-white text-dark'}`}
                    onClick={() => onSelectPreset(strat.id)}
                    title={strat.tagline}
                  >
                    <span className="fw-semibold">{strat.name}</span>
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${isActive ? 'btn-primary border-start border-white-50' : 'btn-outline-secondary bg-white text-muted'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStrategyInfo(strat);
                    }}
                    title="View strategy explanation and criteria"
                  >
                    <Info size={14} />
                  </button>
                </div>
              );
            })}

            {/* User's Saved Custom Presets */}
            {savedCustomPresets.length > 0 && (
              <div className="d-flex align-items-center gap-1 ms-lg-2">
                <span className="small text-muted me-1">Saved:</span>
                {savedCustomPresets.map((sp) => {
                  const isActive = activePreset === sp.id;
                  return (
                    <div key={sp.id} className="btn-group btn-group-sm">
                      <button
                        type="button"
                        className={`btn btn-sm ${isActive ? 'btn-success text-white' : 'btn-outline-success bg-white'}`}
                        onClick={() => onLoadCustomPreset(sp)}
                      >
                        <Bookmark size={12} className="me-1" />
                        <span>{sp.name}</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger bg-white"
                        onClick={() => onDeleteCustomPreset(sp.id)}
                        title={`Delete "${sp.name}" preset`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Active Filter Summary Bar */}
        {hasActiveFilter && (
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3 pt-2 border-top small bg-light-subtle rounded p-2">
            <div className="d-flex align-items-center gap-2">
              <Check size={14} className="text-success" />
              <span>
                <strong>Active Filter:</strong>{' '}
                {activePreset
                  ? STRATEGY_PRESETS.find((s) => s.id === activePreset)?.name ||
                    savedCustomPresets.find((s) => s.id === activePreset)?.name ||
                    activePreset
                  : `${customRules.length} Custom Rule${customRules.length > 1 ? 's' : ''}`}
              </span>
              <span className="badge bg-primary text-white ms-1">
                {totalItems.toLocaleString()} Matches
              </span>
              <span className="text-muted">
                ({(((totalItems / (rawItemsCount || 1)) * 100) || 0).toFixed(1)}% of {rawItemsCount.toLocaleString()} stocks)
              </span>
            </div>

            <div className="d-flex align-items-center gap-2">
              {activePreset && (
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 text-decoration-none small text-primary"
                  onClick={() => {
                    const strat = STRATEGY_PRESETS.find((s) => s.id === activePreset);
                    if (strat) setSelectedStrategyInfo(strat);
                  }}
                >
                  View Strategy Details
                </button>
              )}
              <button
                type="button"
                className="btn btn-link btn-sm p-0 text-decoration-none small text-danger"
                onClick={onClearFilters}
              >
                Reset to All Stocks
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom Multi-Rule Builder (Collapsible) */}
      {showCustomBuilder && (
        <div className="dashboard-card p-3 mb-3 border-primary-subtle bg-white shadow-sm">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3 pb-2 border-bottom">
            <div className="d-flex align-items-center gap-2">
              <Filter size={16} className="text-primary" />
              <h6 className="mb-0 fw-bold">Custom Multi-Rule Builder</h6>
            </div>

            <div className="d-flex align-items-center gap-3">
              {/* Match Mode (AND / OR) */}
              <div className="d-flex align-items-center gap-2 small">
                <span className="text-muted fw-semibold">Match Logic:</span>
                <div className="form-check form-check-inline mb-0">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="matchMode"
                    id="matchAll"
                    value="all"
                    checked={matchMode === 'all'}
                    onChange={() => onChangeMatchMode('all')}
                  />
                  <label className="form-check-label" htmlFor="matchAll">
                    All Rules (AND)
                  </label>
                </div>
                <div className="form-check form-check-inline mb-0">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="matchMode"
                    id="matchAny"
                    value="any"
                    checked={matchMode === 'any'}
                    onChange={() => onChangeMatchMode('any')}
                  />
                  <label className="form-check-label" htmlFor="matchAny">
                    Any Rule (OR)
                  </label>
                </div>
              </div>

              {customRules.length > 0 && (
                <button
                  type="button"
                  className="btn btn-xs btn-outline-success d-flex align-items-center gap-1"
                  onClick={() => setShowSavePresetModal(true)}
                  title="Save current custom rules as a preset"
                >
                  <Bookmark size={13} />
                  <span>Save as Preset</span>
                </button>
              )}
            </div>
          </div>

          {/* Rules List */}
          {customRules.length === 0 ? (
            <div className="text-center py-3 text-muted small">
              No custom rules added yet. Click <strong>"+ Add Condition"</strong> below to build your scan criteria.
            </div>
          ) : (
            <div className="d-flex flex-column gap-2 mb-3">
              {customRules.map((rule, idx) => {
                const isBetween = rule.op === 'between';
                const isCompareField = Boolean(rule.compareField);

                return (
                  <div
                    key={rule.id || idx}
                    className="d-flex flex-wrap align-items-center gap-2 p-2 bg-light rounded border"
                  >
                    <span className="badge bg-secondary-subtle text-secondary border px-2 py-1 small">
                      #{idx + 1}
                    </span>

                    {/* Field Selector */}
                    <div style={{ minWidth: '180px', flex: '1 1 180px' }}>
                      <select
                        className="form-select form-select-sm"
                        value={rule.field}
                        onChange={(e) => handleUpdateRule(idx, { field: e.target.value })}
                      >
                        {Object.entries(filterGroups).map(([groupName, items]) => (
                          <optgroup key={groupName} label={groupName}>
                            {items.map((item) => (
                              <option key={item.key} value={item.key}>
                                {item.label}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    {/* Operator Selector */}
                    <div style={{ width: '110px' }}>
                      <select
                        className="form-select form-select-sm"
                        value={rule.op}
                        onChange={(e) => handleUpdateRule(idx, { op: e.target.value })}
                      >
                        <option value=">">&gt; (Greater)</option>
                        <option value=">=">&gt;= (Greater/Equal)</option>
                        <option value="<">&lt; (Less)</option>
                        <option value="<=">&lt;= (Less/Equal)</option>
                        <option value="==">== (Equal to)</option>
                        <option value="!=">!= (Not Equal)</option>
                        <option value="between">between (Range)</option>
                        <option value="contains">contains (Text)</option>
                      </select>
                    </div>

                    {/* Mode Toggle: Value vs Compare to Column */}
                    {!isBetween && (
                      <div className="btn-group btn-group-sm" style={{ width: '130px' }}>
                        <button
                          type="button"
                          className={`btn btn-xs ${!isCompareField ? 'btn-secondary text-white' : 'btn-outline-secondary'}`}
                          onClick={() => handleUpdateRule(idx, { compareField: '' })}
                        >
                          Value
                        </button>
                        <button
                          type="button"
                          className={`btn btn-xs ${isCompareField ? 'btn-secondary text-white' : 'btn-outline-secondary'}`}
                          onClick={() => handleUpdateRule(idx, { compareField: 'sma_20' })}
                          title="Compare with another column (e.g. Price > SMA 20)"
                        >
                          Column
                        </button>
                      </div>
                    )}

                    {/* Target Field or Value Input */}
                    {isCompareField ? (
                      <div style={{ minWidth: '180px', flex: '1 1 180px' }}>
                        <select
                          className="form-select form-select-sm"
                          value={rule.compareField}
                          onChange={(e) => handleUpdateRule(idx, { compareField: e.target.value })}
                        >
                          <option value="">— Select Target Column —</option>
                          {Object.entries(filterGroups).map(([groupName, items]) => (
                            <optgroup key={groupName} label={groupName}>
                              {items.map((item) => (
                                <option key={item.key} value={item.key}>
                                  {item.label}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>
                    ) : isBetween ? (
                      <div className="d-flex align-items-center gap-1" style={{ minWidth: '180px', flex: '1 1 180px' }}>
                        <input
                          type="number"
                          step="any"
                          className="form-control form-control-sm"
                          placeholder="Min"
                          value={rule.valueMin || ''}
                          onChange={(e) => handleUpdateRule(idx, { valueMin: e.target.value })}
                        />
                        <span className="small text-muted">to</span>
                        <input
                          type="number"
                          step="any"
                          className="form-control form-control-sm"
                          placeholder="Max"
                          value={rule.valueMax || ''}
                          onChange={(e) => handleUpdateRule(idx, { valueMax: e.target.value })}
                        />
                      </div>
                    ) : (
                      <div style={{ minWidth: '140px', flex: '1 1 140px' }}>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Target value..."
                          value={rule.value ?? ''}
                          onChange={(e) => handleUpdateRule(idx, { value: e.target.value })}
                        />
                      </div>
                    )}

                    {/* Delete Rule */}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger p-1"
                      onClick={() => handleRemoveRule(idx)}
                      title="Remove this condition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action Row */}
          <div className="d-flex justify-content-between align-items-center pt-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
              onClick={handleAddRule}
            >
              <Plus size={14} />
              <span>Add Condition</span>
            </button>

            {customRules.length > 0 && (
              <button
                type="button"
                className="btn btn-sm btn-link text-danger text-decoration-none p-0"
                onClick={() => onChangeCustomRules([])}
              >
                Clear Custom Rules
              </button>
            )}
          </div>
        </div>
      )}

      {/* Strategy Details Modal */}
      {selectedStrategyInfo && (
        <div className="modal-backdrop-custom" role="dialog" aria-modal="true">
          <div className="modal-dialog-custom shadow-lg" style={{ maxWidth: '580px' }}>
            <div className="modal-header-custom border-bottom pb-2 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-primary text-white">{selectedStrategyInfo.badge}</span>
                <h5 className="modal-title mb-0 fw-bold">{selectedStrategyInfo.name}</h5>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setSelectedStrategyInfo(null)}
              ></button>
            </div>

            <div className="modal-body-custom py-3">
              <p className="text-secondary small mb-3 leading-relaxed">
                {selectedStrategyInfo.description}
              </p>

              <div className="p-3 bg-light rounded-3 border mb-3">
                <h6 className="fw-bold small text-uppercase text-muted mb-2 d-flex align-items-center gap-1">
                  <Sliders size={14} className="text-primary" /> Strategy Trigger Criteria:
                </h6>
                <ul className="mb-0 ps-3 small text-secondary">
                  {selectedStrategyInfo.criteriaExplanation.map((crit, idx) => (
                    <li key={idx} className="mb-1">
                      {crit}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="small text-muted border-start border-3 border-primary ps-3 py-1">
                <strong>Why this works:</strong> In momentum and quantitative screening, combining range position, volume ratios, and moving average alignment systematically eliminates laggards and surfaces institutional accumulation.
              </div>
            </div>

            <div className="modal-footer-custom border-top pt-2 d-flex justify-content-between align-items-center">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary px-3"
                onClick={() => setSelectedStrategyInfo(null)}
              >
                Close
              </button>

              <button
                type="button"
                className="btn btn-sm btn-primary px-4 fw-semibold"
                onClick={() => {
                  onSelectPreset(selectedStrategyInfo.id);
                  setSelectedStrategyInfo(null);
                }}
              >
                Apply This Preset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Custom Preset Modal */}
      {showSavePresetModal && (
        <div className="modal-backdrop-custom" role="dialog" aria-modal="true">
          <div className="modal-dialog-custom shadow-lg" style={{ maxWidth: '420px' }}>
            <form onSubmit={handleSaveSubmit}>
              <div className="modal-header-custom border-bottom pb-2 d-flex align-items-center justify-content-between">
                <h6 className="modal-title mb-0 fw-bold d-flex align-items-center gap-2">
                  <Bookmark size={16} className="text-success" /> Save Custom Preset
                </h6>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowSavePresetModal(false)}
                ></button>
              </div>

              <div className="modal-body-custom py-3">
                <label className="form-label small fw-bold text-muted mb-1">
                  Preset Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. My Swing Breakout..."
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  autoFocus
                  required
                />
                <div className="small text-muted mt-2">
                  Saves your current {customRules.length} rule(s) locally so you can reload them anytime.
                </div>
              </div>

              <div className="modal-footer-custom border-top pt-2 d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowSavePresetModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-success px-3">
                  Save Preset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
