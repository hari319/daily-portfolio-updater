/* Portfolio EMA Monitor - UI behaviour.
 *
 * The server renders the tables; this script swaps in freshly rendered HTML and
 * listens for "new data available" signals published by the scheduled task. */

(function () {
  'use strict';

  const tablesEl = document.getElementById('tables');
  const toastEl = document.getElementById('toast');
  const lastUpdatedEl = document.getElementById('last-updated');
  const statsEl = document.getElementById('stats');
  const errorsPanel = document.getElementById('errors-panel');
  const errorsList = document.getElementById('errors-list');
  const connEl = document.getElementById('connection');
  const refreshBtn = document.getElementById('refresh-btn');

  const pollSeconds = Number(document.body.dataset.pollSeconds || 5);
  let knownVersion = Number(document.body.dataset.version || 0);
  let toastTimer = null;

  /* ---------------- helpers ---------------- */

  function toast(message, isError) {
    if (!message) return;
    toastEl.textContent = message;
    toastEl.classList.toggle('error', Boolean(isError));
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(
      () => toastEl.classList.remove('show'),
      6000,
    );
  }

  async function request(url, options) {
    const response = await fetch(url, options);
    let payload = {};
    try {
      payload = await response.json();
    } catch (err) {
      throw new Error(
        'Server returned an unreadable response (HTTP ' +
          response.status +
          ').',
      );
    }
    if (!response.ok || payload.ok === false) {
      throw new Error(
        payload.error ||
          'Request failed (HTTP ' + response.status + ').',
      );
    }
    return payload;
  }

  function sendJson(url, method, body) {
    return request(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  function setUpdatedLabel(isoTimestamp, source) {
    const when = new Date(isoTimestamp);
    const label = isNaN(when.getTime())
      ? isoTimestamp
      : when.toLocaleString();
    lastUpdatedEl.textContent =
      'Updated ' + label + (source ? ' (' + source + ')' : '');
  }

  const collapsedPortfolios = new Set();
  const dupHintEl = document.getElementById('dup-hint');
  const symbolInput = document.getElementById('add-symbol');
  const portfolioSelect = document.getElementById('add-portfolio');

  function checkDuplicateTicker() {
    if (!symbolInput || !dupHintEl) return;
    const raw = symbolInput.value.trim().toUpperCase();
    if (!raw) {
      dupHintEl.textContent = '';
      dupHintEl.classList.add('hidden');
      return;
    }
    const defaultSuffix = symbolInput.dataset.defaultSuffix || '.NS';
    const normalized = (raw.startsWith('^') || raw.includes('.'))
      ? raw
      : raw + defaultSuffix;
    const selectedPortfolio = portfolioSelect ? portfolioSelect.value : '';

    const portfolioSections = tablesEl.querySelectorAll('.portfolio');
    let foundInPortfolio = null;
    let foundInSelected = false;

    portfolioSections.forEach((section) => {
      const portName = section.id.replace('portfolio-', '');
      const rows = section.querySelectorAll('tbody tr[data-symbol]');
      rows.forEach((row) => {
        const rowSymbol = (row.dataset.symbol || '').toUpperCase();
        const baseRow = rowSymbol.replace(/\.(NS|BO)$/, '');
        const baseRaw = raw.replace(/\.(NS|BO)$/, '');
        if (rowSymbol === normalized || rowSymbol === raw || baseRow === baseRaw) {
          foundInPortfolio = portName;
          if (portName === selectedPortfolio) {
            foundInSelected = true;
          }
        }
      });
    });

    if (foundInPortfolio) {
      if (foundInSelected) {
        dupHintEl.textContent = '⚠️ ' + normalized + ' is already in ' + foundInPortfolio + '.';
      } else {
        dupHintEl.textContent = 'ℹ️ ' + normalized + ' is in ' + foundInPortfolio + ' (will also be added to ' + selectedPortfolio + ').';
      }
      dupHintEl.classList.remove('hidden');
    } else {
      dupHintEl.textContent = '';
      dupHintEl.classList.add('hidden');
    }
  }

  if (symbolInput) {
    symbolInput.addEventListener('input', checkDuplicateTicker);
  }
  if (portfolioSelect) {
    portfolioSelect.addEventListener('change', checkDuplicateTicker);
  }

  function applyPayload(payload) {
    if (payload.html) {
      tablesEl.innerHTML = payload.html;
      // Restore collapsed state after re-render
      collapsedPortfolios.forEach((name) => {
        const section = document.getElementById('portfolio-' + name);
        if (section) {
          const body = section.querySelector('.collapsible-body');
          const btn = section.querySelector('.collapse-toggle');
          if (body && btn) {
            body.classList.add('collapsed');
            btn.classList.add('is-collapsed');
            const label = btn.querySelector('.collapse-label');
            if (label) label.textContent = 'Expand';
          }
        }
      });
    }

    if (payload.generated_at) {
      setUpdatedLabel(payload.generated_at, payload.source);
    }

    const stats = payload.stats || {};
    statsEl.textContent = stats.total
      ? stats.ok + '/' + stats.total + ' OK'
      : '';

    const errors = payload.errors || [];
    errorsList.innerHTML = '';
    errors.forEach((err) => {
      const item = document.createElement('li');
      const strong = document.createElement('strong');
      strong.textContent = err.symbol;
      item.appendChild(strong);
      item.appendChild(
        document.createTextNode(' \u2014 ' + err.message),
      );
      errorsList.appendChild(item);
    });
    errorsPanel.classList.toggle('hidden', errors.length === 0);

    if (typeof payload.version === 'number')
      knownVersion = payload.version;

    checkDuplicateTicker();
  }

  async function reloadTables(message) {
    try {
      const payload = await request('/api/tables');
      applyPayload(payload);
      if (message) toast(message);
    } catch (err) {
      toast(err.message, true);
    }
  }

  async function withBusy(button, action) {
    if (button) button.disabled = true;
    tablesEl.classList.add('busy');
    try {
      await action();
    } catch (err) {
      toast(err.message, true);
    } finally {
      tablesEl.classList.remove('busy');
      if (button) button.disabled = false;
    }
  }

  /* ---------------- user actions ---------------- */

  refreshBtn.addEventListener('click', () =>
    withBusy(refreshBtn, async () => {
      const payload = await request('/api/refresh', {
        method: 'POST',
      });
      applyPayload(payload);
      toast(payload.message);
    }),
  );

  document
    .getElementById('add-form')
    .addEventListener('submit', (event) => {
      event.preventDefault();
      const button = event.target.querySelector(
        'button[type=submit]',
      );
      const symbol = symbolInput ? symbolInput.value.trim() : '';
      if (!symbol) {
        toast('Enter a ticker symbol first.', true);
        return;
      }
      withBusy(button, async () => {
        const payload = await sendJson('/api/tickers', 'POST', {
          portfolio: portfolioSelect.value,
          symbol: symbol,
        });
        applyPayload(payload);
        if (symbolInput) symbolInput.value = '';
        checkDuplicateTicker();
        toast(payload.message);
      });
    });

  document
    .getElementById('schedule-form')
    .addEventListener('submit', (event) => {
      event.preventDefault();
      const button = event.target.querySelector(
        'button[type=submit]',
      );
      withBusy(button, async () => {
        const payload = await sendJson('/api/schedule', 'POST', {
          run_times: [
            document.getElementById('run-time-1').value,
            document.getElementById('run-time-2').value,
          ],
        });
        toast(payload.message);
      });
    });

  tablesEl.addEventListener('click', (event) => {
    const toggleBtn = event.target.closest('.collapse-toggle');
    if (toggleBtn) {
      const portfolioName = toggleBtn.dataset.portfolio;
      const section = document.getElementById('portfolio-' + portfolioName);
      if (!section) return;
      const body = section.querySelector('.collapsible-body');
      if (!body) return;

      const isCurrentlyCollapsed = body.classList.toggle('collapsed');
      toggleBtn.classList.toggle('is-collapsed', isCurrentlyCollapsed);
      const label = toggleBtn.querySelector('.collapse-label');
      if (label) {
        label.textContent = isCurrentlyCollapsed ? 'Expand' : 'Collapse';
      }
      if (isCurrentlyCollapsed) {
        collapsedPortfolios.add(portfolioName);
      } else {
        collapsedPortfolios.delete(portfolioName);
      }
      return;
    }

    const button = event.target.closest('.remove-btn');
    if (!button) return;
    const symbol = button.dataset.symbol;
    const portfolio = button.dataset.portfolio;
    if (
      !window.confirm('Remove ' + symbol + ' from ' + portfolio + '?')
    )
      return;
    withBusy(button, async () => {
      const payload = await sendJson('/api/tickers', 'DELETE', {
        portfolio: portfolio,
        symbol: symbol,
      });
      applyPayload(payload);
      toast(payload.message);
    });
  });

  /* ---------------- scheduled-run notifications ---------------- */

  function onNewVersion(status) {
    if (!status || status.version === knownVersion) return;
    knownVersion = status.version;
    const origin =
      status.source === 'scheduled'
        ? 'Scheduled run finished'
        : 'Data updated';
    reloadTables(
      origin + ' \u2014 ' + (status.message || 'tables refreshed.'),
    );
  }

  function startPolling() {
    connEl.textContent = 'polling for updates';
    connEl.className = 'conn polling';
    setInterval(
      async () => {
        try {
          const status = await request('/api/status');
          onNewVersion(status);
        } catch (err) {
          /* transient - the next tick retries */
        }
      },
      Math.max(2, pollSeconds) * 1000,
    );
  }

  function startStream() {
    if (typeof window.EventSource === 'undefined') {
      startPolling();
      return;
    }
    let fellBack = false;
    const source = new EventSource(
      '/api/stream?version=' + knownVersion,
    );

    source.addEventListener('open', () => {
      connEl.textContent = 'live';
      connEl.className = 'conn live';
    });
    source.addEventListener('update', (event) => {
      try {
        onNewVersion(JSON.parse(event.data));
      } catch (err) {
        reloadTables();
      }
    });
    source.addEventListener('error', () => {
      // The stream self-closes every few minutes; the browser reconnects on its
      // own. Only fall back to polling if it is permanently closed.
      if (source.readyState === EventSource.CLOSED && !fellBack) {
        fellBack = true;
        startPolling();
      }
    });
  }

  startStream();

  if (lastUpdatedEl.dataset.iso) {
    setUpdatedLabel(
      lastUpdatedEl.dataset.iso,
      lastUpdatedEl.dataset.source,
    );
  }
})();
