import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as api from './api';
import Header from './components/Header';
import AddTickerPanel from './components/AddTickerPanel';
import SchedulePanel from './components/SchedulePanel';
import ErrorsPanel from './components/ErrorsPanel';
import PortfolioSection from './components/PortfolioSection';
import Toast from './components/Toast';
import Footer from './components/Footer';

export default function App() {
  const [snapshot, setSnapshot] = useState(null);
  const [runTimes, setRunTimes] = useState(['09:30', '11:30']);
  const [portfolioNames, setPortfolioNames] = useState(['BAPA', 'MADI']);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [toastInfo, setToastInfo] = useState({ message: '', isError: false });

  const knownVersionRef = useRef(0);

  const showToast = useCallback((message, isError = false) => {
    if (!message) return;
    setToastInfo({ message, isError });
  }, []);

  const hideToast = useCallback(() => {
    setToastInfo({ message: '', isError: false });
  }, []);

  const loadData = useCallback(async (notifyMessage = '') => {
    try {
      const dataPayload = await api.fetchData();
      if (dataPayload) {
        setSnapshot(dataPayload);
        if (dataPayload.portfolios) {
          setPortfolioNames(Object.keys(dataPayload.portfolios));
        }
      }

      if (notifyMessage) {
        showToast(notifyMessage, false);
      }
    } catch (err) {
      console.error('Failed to load portfolio data:', err);
      showToast(err.message || 'Failed to load portfolio data.', true);
    }
  }, [showToast]);

  const loadSchedule = useCallback(async () => {
    try {
      const res = await api.fetchSchedule();
      if (res && res.run_times) {
        setRunTimes(res.run_times);
      }
    } catch (err) {
      console.error('Failed to load schedule settings:', err);
    }
  }, []);

  // Initial load & SSE connection
  useEffect(() => {
    loadData();
    loadSchedule();

    const cleanup = api.connectStatusStream({
      knownVersion: knownVersionRef.current,
      onStateChange: (status) => {
        setConnectionStatus(status);
      },
      onUpdate: (status) => {
        if (status && typeof status.version === 'number') {
          knownVersionRef.current = status.version;
        }
        const sourceLabel = status && status.source === 'scheduled' ? 'Scheduled run completed' : 'Data updated';
        loadData(`${sourceLabel} — tables refreshed.`);
      },
    });

    return () => {
      cleanup();
    };
  }, [loadData, loadSchedule]);

  // Refresh All Tickers
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setIsBusy(true);
    try {
      const res = await api.refreshAll();
      if (res.snapshot) {
        setSnapshot(res.snapshot);
      } else {
        await loadData();
      }
      showToast(res.message || 'Data refreshed successfully.', false);
    } catch (err) {
      showToast(err.message || 'Refresh failed.', true);
    } finally {
      setIsRefreshing(false);
      setIsBusy(false);
    }
  };

  // Add Ticker
  const handleAddTicker = async (portfolio, symbol) => {
    setIsBusy(true);
    try {
      const res = await api.addTicker(portfolio, symbol);
      if (res.snapshot) {
        setSnapshot(res.snapshot);
      } else {
        await loadData();
      }
      showToast(res.message || `${symbol} added to ${portfolio}.`, false);
    } catch (err) {
      showToast(err.message || `Failed to add ${symbol}.`, true);
      throw err; // rethrow so the form keeps its input on error
    } finally {
      setIsBusy(false);
    }
  };

  // Remove Ticker
  const handleRemoveTicker = async (portfolio, symbol) => {
    const confirmed = window.confirm(`Remove ${symbol} from ${portfolio}?`);
    if (!confirmed) return;

    setIsBusy(true);
    try {
      const res = await api.removeTicker(portfolio, symbol);
      if (res.snapshot) {
        setSnapshot(res.snapshot);
      } else {
        await loadData();
      }
      showToast(res.message || `${symbol} removed from ${portfolio}.`, false);
    } catch (err) {
      showToast(err.message || `Failed to remove ${symbol}.`, true);
    } finally {
      setIsBusy(false);
    }
  };

  // Save Schedule
  const handleSaveSchedule = async (times) => {
    setIsBusy(true);
    try {
      const res = await api.saveSchedule(times);
      if (res.run_times) {
        setRunTimes(res.run_times);
      }
      showToast(res.message || 'Scheduled run times saved.', false);
    } catch (err) {
      showToast(err.message || 'Failed to save scheduled run times.', true);
    } finally {
      setIsBusy(false);
    }
  };

  const portfolios = snapshot?.portfolios || {};
  const periods = snapshot?.ema_periods || [9, 21, 50, 100, 200];
  const errors = snapshot?.errors || [];
  const stats = snapshot?.stats || {};
  const generatedAt = snapshot?.generated_at || null;
  const source = snapshot?.source || null;

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        generatedAt={generatedAt}
        source={source}
        stats={stats}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />

      {/* Control Panels: Add Ticker & Schedule */}
      <section className="row g-3 mb-4">
        <div className="col-12 col-lg-7">
          <AddTickerPanel
            portfolioNames={portfolioNames}
            portfolios={portfolios}
            onAddTicker={handleAddTicker}
            disabled={isBusy}
          />
        </div>
        <div className="col-12 col-lg-5">
          <SchedulePanel
            initialRunTimes={runTimes}
            onSaveSchedule={handleSaveSchedule}
            disabled={isBusy}
          />
        </div>
      </section>

      {/* Errors / Fetch Problems */}
      <ErrorsPanel errors={errors} />

      {/* Main Portfolio Tables */}
      <main className={isBusy ? 'busy-overlay' : ''}>
        {portfolioNames.map((name) => (
          <PortfolioSection
            key={name}
            name={name}
            portfolioData={portfolios[name]}
            periods={periods}
            onRemoveTicker={handleRemoveTicker}
            disabled={isBusy}
          />
        ))}
      </main>

      {/* Footer */}
      <Footer connectionStatus={connectionStatus} />

      {/* Toast notifications */}
      <Toast
        message={toastInfo.message}
        isError={toastInfo.isError}
        onClose={hideToast}
      />
    </div>
  );
}
