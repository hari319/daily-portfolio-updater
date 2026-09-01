import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Search, Layers, RefreshCw } from 'lucide-react';
import * as api from '../api';
import StatusTable from './StatusTable';
import AddStatusModal from './AddStatusModal';

export default function StatusTab({ showToast, isBusy, setIsBusy }) {
  const [items, setItems] = useState([]);
  const [liveQuotes, setLiveQuotes] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch live quotes for list of symbols
  const refreshLiveQuotes = useCallback(async (stockItems) => {
    const list = stockItems || [];
    const symbols = [...new Set(list.map((it) => it.symbol).filter(Boolean))];
    if (symbols.length === 0) return;

    try {
      const res = await api.fetchBatchQuotes(symbols);
      if (res && res.quotes) {
        setLiveQuotes((prev) => ({ ...prev, ...res.quotes }));
      }
    } catch (err) {
      console.warn('Failed to fetch live quotes for status tab:', err);
    }
  }, []);

  const loadStockStatuses = useCallback(async () => {
    try {
      const res = await api.fetchStockStatuses();
      if (res && res.items) {
        setItems(res.items);
        await refreshLiveQuotes(res.items);
      }
    } catch (err) {
      console.error('Failed to load stock statuses:', err);
    }
  }, [refreshLiveQuotes]);

  // Load items and live prices on component mount only once
  useEffect(() => {
    loadStockStatuses();
  }, []);

  // Manual refresh click handler
  const handleRefreshClick = async () => {
    setIsLoading(true);
    try {
      const res = await api.fetchStockStatuses();
      const currentList = res?.items || items;
      if (res && res.items) {
        setItems(res.items);
      }
      if (!currentList || currentList.length === 0) {
        showToast('No stocks in Status table yet. Click "+ Add Stock" first.', false);
        return;
      }
      await refreshLiveQuotes(currentList);
      showToast('Live prices updated.', false);
    } catch (err) {
      showToast(err.message || 'Failed to refresh prices', true);
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time search filtered by Ticker column
  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toUpperCase();
    if (!term) return items;
    return items.filter((item) => {
      const sym = (item.symbol || '').toUpperCase();
      const name = (item.name || '').toUpperCase();
      return sym.includes(term) || name.includes(term);
    });
  }, [items, searchTerm]);

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setEditItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setIsEditMode(true);
    setEditItem(item);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (payload, mode = 'add', originalId = null) => {
    setIsSubmitting(true);
    try {
      let res;
      if (mode === 'edit_existing' && originalId) {
        res = await api.updateStockStatus(originalId, payload);
      } else {
        // 'add' or 'edit_new' creates a new record
        res = await api.addStockStatus(payload);
      }

      if (res && res.items) {
        setItems(res.items);
        refreshLiveQuotes(res.items);
      } else {
        await loadStockStatuses();
      }

      setIsModalOpen(false);
      showToast(res.message || `Status for ${payload.symbol} saved successfully.`, false);
    } catch (err) {
      showToast(err.message || 'Failed to save stock status', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id, symbol) => {
    const confirmed = window.confirm(`Delete status entry for ${symbol}?`);
    if (!confirmed) return;

    try {
      const res = await api.deleteStockStatus(id);
      if (res && res.items) {
        setItems(res.items);
      } else {
        await loadStockStatuses();
      }
      showToast(res.message || `Entry for ${symbol} deleted.`, false);
    } catch (err) {
      showToast(err.message || `Failed to delete ${symbol}`, true);
    }
  };

  const uniqueTickerCount = useMemo(() => {
    return new Set(filteredItems.map((it) => it.symbol)).size;
  }, [filteredItems]);

  return (
    <div className="status-tab-container">
      {/* Top Action Bar: Search input & Add button */}
      <div className="dashboard-card p-3 mb-4">
        <div className="row g-3 align-items-center">
          {/* Search Box */}
          <div className="col-12 col-md-7 col-lg-8">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 text-muted">
                <Search size={16} />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Search by ticker (e.g. TCS, INFY, RELIANCE)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search ticker"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="btn btn-outline-secondary border-start-0"
                  onClick={() => setSearchTerm('')}
                  title="Clear search"
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="col-12 col-md-5 col-lg-4 d-flex justify-content-md-end gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary d-inline-flex align-items-center gap-1"
              onClick={handleRefreshClick}
              disabled={isLoading}
              title="Refresh status list & live prices"
            >
              <RefreshCw size={15} className={isLoading ? 'spin-anim' : ''} />
              <span>{isLoading ? 'Updating...' : 'Refresh Prices'}</span>
            </button>
            <button
              type="button"
              className="btn btn-primary d-inline-flex align-items-center gap-1 px-3 shadow-sm"
              onClick={handleOpenAddModal}
            >
              <Plus size={16} />
              <span className="fw-medium">Add Stock</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stock Status Table Card */}
      <section className="dashboard-card">
        <header className="portfolio-header">
          <div className="d-flex align-items-center gap-2">
            <Layers size={18} className="text-primary" />
            <h2 className="portfolio-name">Stock Status &amp; Targets</h2>
            <span className="portfolio-count-pill">
              {uniqueTickerCount} {uniqueTickerCount === 1 ? 'ticker' : 'tickers'} (
              {filteredItems.length} {filteredItems.length === 1 ? 'total record' : 'total records'})
            </span>
          </div>
        </header>

        <StatusTable
          items={filteredItems}
          liveQuotes={liveQuotes}
          onEditItem={handleOpenEditModal}
          onDeleteItem={handleDeleteItem}
          disabled={isBusy}
        />
      </section>

      {/* Add / Edit Stock Status Modal */}
      <AddStatusModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        isSubmitting={isSubmitting}
        isEditMode={isEditMode}
        editItem={editItem}
      />
    </div>
  );
}
