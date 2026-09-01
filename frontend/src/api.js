/**
 * API client for Portfolio and Stock Monitor.
 * Interacts with Flask backend REST endpoints and Server-Sent Events (SSE).
 */

async function request(url, options = {}) {
  const response = await fetch(url, options);
  let payload = {};
  try {
    payload = await response.json();
  } catch (err) {
    throw new Error(`Server returned an invalid response (HTTP ${response.status}).`);
  }

  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || `Request failed (HTTP ${response.status}).`);
  }
  return payload;
}

function sendJson(url, method, body) {
  return request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function fetchTables() {
  return request('/api/tables');
}

export async function fetchData() {
  return request('/api/data');
}

export async function refreshAll() {
  return request('/api/refresh', { method: 'POST' });
}

export async function addTicker(portfolio, symbol) {
  return sendJson('/api/tickers', 'POST', { portfolio, symbol });
}

export async function removeTicker(portfolio, symbol) {
  return sendJson('/api/tickers', 'DELETE', { portfolio, symbol });
}

export async function fetchSchedule() {
  return request('/api/schedule');
}

export async function saveSchedule(run_times) {
  return sendJson('/api/schedule', 'POST', { run_times });
}

export async function fetchStatus() {
  return request('/api/status');
}

export async function fetchStockInfo(symbol) {
  const enc = encodeURIComponent(symbol.trim());
  return request(`/api/stock-info?symbol=${enc}`);
}

export async function fetchStockStatuses() {
  return request('/api/stock-status');
}

export async function addStockStatus(data) {
  return sendJson('/api/stock-status', 'POST', data);
}

export async function updateStockStatus(itemId, data) {
  return sendJson(`/api/stock-status/${encodeURIComponent(itemId)}`, 'PUT', data);
}

export async function deleteStockStatus(itemId) {
  return request(`/api/stock-status/${encodeURIComponent(itemId)}`, {
    method: 'DELETE',
  });
}

export async function fetchBatchQuotes(symbols) {
  return sendJson('/api/stock-quotes', 'POST', { symbols });
}

/**
 * Connects to the SSE stream on /api/stream.
 * Automatically falls back to periodic polling if SSE is unavailable or permanently closed.
 */
export function connectStatusStream({
  knownVersion = 0,
  onUpdate,
  onStateChange,
  pollSeconds = 5,
}) {
  let isPolling = false;
  let pollTimer = null;
  let eventSource = null;
  let currentVersion = knownVersion;

  function startPolling() {
    if (isPolling) return;
    isPolling = true;
    if (onStateChange) onStateChange('polling');

    pollTimer = setInterval(async () => {
      try {
        const status = await fetchStatus();
        if (status && status.version !== currentVersion) {
          currentVersion = status.version;
          if (onUpdate) onUpdate(status);
        }
      } catch (err) {
        // Transient network error, retry next tick
      }
    }, Math.max(2, pollSeconds) * 1000);
  }

  function startSSE() {
    if (typeof window.EventSource === 'undefined') {
      startPolling();
      return;
    }

    try {
      eventSource = new EventSource(`/api/stream?version=${currentVersion}`);

      eventSource.addEventListener('open', () => {
        if (!isPolling && onStateChange) onStateChange('live');
      });

      eventSource.addEventListener('update', (event) => {
        try {
          const status = JSON.parse(event.data);
          if (status && status.version !== currentVersion) {
            currentVersion = status.version;
            if (onUpdate) onUpdate(status);
          }
        } catch (e) {
          if (onUpdate) onUpdate({ version: currentVersion + 1 });
        }
      });

      eventSource.addEventListener('error', () => {
        if (eventSource.readyState === EventSource.CLOSED && !isPolling) {
          startPolling();
        }
      });
    } catch (e) {
      startPolling();
    }
  }

  startSSE();

  // Return cleanup function
  return () => {
    if (eventSource) {
      eventSource.close();
    }
    if (pollTimer) {
      clearInterval(pollTimer);
    }
  };
}
