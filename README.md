# Portfolio and Stock Monitor (BAPA & MADI)

A comprehensive local desktop application for tracking NSE/BSE stock portfolios, conducting scenario-based fundamental/technical valuation tracking, and scanning the broad Indian stock market (>3,400 companies) with predictive multi-day momentum indicators.

The application features a modern **React + Bootstrap 5** interface served inside a **native desktop window** (powered by [pywebview](https://pywebview.flowrl.com/)) or any web browser.

---

## 📚 Feature Documentation by Tab

Detailed feature guides, formulas, screening criteria, and workflows have been modularized by application tab:

| Tab | Documentation | Description |
| :--- | :--- | :--- |
| **Tab 1: Tracker** | [**Portfolio Monitor Guide**](docs/TAB1_PORTFOLIO_MONITOR.md) | Multi-portfolio tracking (BAPA & MADI), 10 stacked Daily/Weekly EMAs, priority sorting, SELL/HOLD signals, NSE/BSE auto-switching, and ticker management. |
| **Tab 2: Status** | [**Stock Status & Scenario Analysis**](docs/TAB2_STOCK_STATUS.md) | Valuation journal, Base/Bull/Bear targets & CAGR %, Best Entry tracking, live price comparisons, and multi-date analysis versioning. |
| **Tab 3: Screener** | [**Market Screener & Predictive Analysis**](docs/TAB3_MARKET_SCREENER.md) | Broad-market scanning (>3,400 NSE stocks), automated daily `X-WP-Nonce` lifecycle, 154-column table, 1-click strategy presets, custom filter builder, and multi-day trajectory engine. |
| **Architecture** | [**Knowledge Graph & Module Map**](docs/KNOWLEDGE_GRAPH.md) | Complete codebase architecture, component interactions, data stores, and developer onboarding reference. |

---

## Table of Contents

1. [How It Works](#how-it-works)
2. [Project Structure](#project-structure)
3. [Setup & Installation](#setup--installation)
4. [Running the Application](#running-the-application)
5. [Frontend Development](#frontend-development)
6. [Tab Overview Summaries](#tab-overview-summaries)
   - [Tab 1: Portfolio Monitor (Tracker)](#tab-1-portfolio-monitor-tracker)
   - [Tab 2: Stock Status & Scenarios](#tab-2-stock-status--scenarios)
   - [Tab 3: Market Screener & Predictive Analysis](#tab-3-market-screener--predictive-analysis)
7. [Scheduled Runs & Windows Task Scheduler](#scheduled-runs--windows-task-scheduler)
8. [Configuration Reference](#configuration-reference)
9. [Error Handling & Logging](#error-handling--logging)
10. [HTTP API Reference](#http-api-reference)
11. [Known Limitations & Planned Features](#known-limitations--planned-features)

---

## How It Works

```
config/portfolios.json ──┐
config/settings.json  ───┤
                         ▼
   scheduled_run.py / "Refresh now"  ──►  yfinance  ──►  EMA engine
                         │
                         ├──►  data/snapshot.json   (what the UI renders from)
                         └──►  data/status.json     ("new data available", version counter)
                                       │
                                       ▼
                  Flask (daemon thread)  ──SSE──►  React Frontend (pywebview / Browser)
                                                   (auto-refreshes on new data)
                  scheduled_run.py  ──►  show_window.py  ──►  pops up reminder window
                                         (only if no window is already open)
```

* **Prices & Historical Bars**: Fetched via `yfinance`. NSE symbols use `.NS`, BSE symbols use `.BO`.
* **Weekly Candles**: Resampled from daily history (Friday-anchored) for speed and live price consistency.
* **Shared File State**: Flask and scheduled tasks communicate via atomic JSON files (`data/snapshot.json` and `data/status.json`).
* **Real-Time UI Updates**: Open desktop windows receive Server-Sent Events (SSE) from Flask whenever data updates.

---

## Project Structure

```
Daily Updater/
├── app.py                     # Desktop window entry point (python app.py)
├── show_window.py             # Reminder popup launched after a scheduled refresh
├── scheduled_run.py           # Batch refresh entry point (run by Task Scheduler)
├── requirements.txt
├── config.template.json       # Template for config/settings.json
├── portfolios.template.json   # Template for config/portfolios.json
├── docs/                      # Modular documentation by application tab
│   ├── TAB1_PORTFOLIO_MONITOR.md
│   ├── TAB2_STOCK_STATUS.md
│   ├── TAB3_MARKET_SCREENER.md
│   └── KNOWLEDGE_GRAPH.md
├── frontend/                  # React + Bootstrap 5 frontend (Vite)
│   ├── package.json
│   ├── vite.config.js
│   ├── dist/                  # Production build served by Flask
│   └── src/                   # React components, styles, and API client
├── stockmon/                  # Python backend package
│   ├── paths.py               # Config/data/log path resolution
│   ├── jsonstore.py           # Thread-safe atomic JSON store
│   ├── logging_config.py      # Rotating file + console logging
│   ├── config_manager.py      # settings.json manager
│   ├── portfolio.py           # Portfolios, ticker validation, TradingView links
│   ├── data_fetcher.py        # yfinance integration with retry backoff
│   ├── ema.py                 # EMA calculations & weekly resampling
│   ├── screener.py            # Prime screener API client & daily nonce handling
│   ├── multi_day_analyzer.py  # Multi-day chronological sequence engine
│   ├── service.py             # Orchestration service
│   ├── status.py              # Version counter and update signaling
│   └── web/                   # Flask server, routes, and SSE streaming
├── scripts/                   # Windows Task Scheduler automation scripts
│   ├── register_task.ps1      # Registers/updates task from settings.json
│   ├── run_scheduled.ps1      # PowerShell execution wrapper
│   └── run_scheduled.bat      # Batch file execution wrapper
├── config/                    # Local configuration (settings.json, portfolios.json)
├── data/                      # Local data stores, screener cache, and quotes cache
└── logs/                      # Application, scheduler, and ticker audit logs
```

---

## Setup & Installation

Requires **Python 3.10+** on Windows. **No API keys are required** — public endpoints are utilized. The desktop window is powered by [pywebview](https://pywebview.flowrl.com/).

```powershell
cd "C:\Users\hmaru\Downloads\Personal\Project\Daily Updater"

# Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

On first run, `config/settings.json` and `config/portfolios.json` will be automatically generated from the template defaults.

---

## Running the Application

```powershell
# Default: Launch as a native desktop window (1200 x 800)
.\.venv\Scripts\python.exe app.py

# Optional: Run on a custom port
.\.venv\Scripts\python.exe app.py --port 8000

# Optional: Open in your default web browser instead of desktop window
.\.venv\Scripts\python.exe app.py --browser

# Optional: Development mode with Flask auto-reload
.\.venv\Scripts\python.exe app.py --debug
```

If no portfolio data has been fetched yet, click **Refresh now** in the UI header (or run `python scheduled_run.py` once) to populate the tables.

---

## Frontend Development

The frontend is built with **React**, **Bootstrap 5**, and **Lucide Icons** using **Vite**.

```powershell
cd frontend

# Install npm dependencies (first time only)
npm install

# Start Vite dev server with hot-reload (proxies /api to Flask on port 5000)
npm run dev

# Compile production bundle into frontend/dist/ (served by Flask)
npm run build
```

---

## Tab Overview Summaries

### Tab 1: Portfolio Monitor (Tracker)
*Full details in [docs/TAB1_PORTFOLIO_MONITOR.md](docs/TAB1_PORTFOLIO_MONITOR.md)*

* **Portfolio Separation**: Monitors two distinct portfolios (**BAPA** and **MADI**).
* **Dual Timeframe EMAs**: Tracks the **9, 21, 50, 100, and 200 EMA** across both **Daily (D:)** and **Weekly (W:)** timeframes (10 values per ticker).
* **Display Rule**: Values are rendered in **red** only when the current price is below that EMA; otherwise, the space remains blank.
* **Priority Sorting**: Tickers breaching the 200 daily EMA appear at the very top (highest priority alert), followed by 100, 50, 21, and 9 EMA. Within the same priority, tickers sort alphabetically.
* **Signal Badge**: Clearly displays **`SELL`** (red) if below the daily 200 EMA, and **`HOLD`** (green) if holding above.
* **Smart History Switching**: Automatically checks alternate exchanges (`.NS` ↔ `.BO`) if a symbol has fewer than 400 trading bars.
* **Ticker CRUD**: Add and remove tickers directly from the UI with real-time symbol validation and duplicate checks.

---

### Tab 2: Stock Status & Scenarios
*Full details in [docs/TAB2_STOCK_STATUS.md](docs/TAB2_STOCK_STATUS.md)*

* **Valuation Scenarios**: Record target price and expected CAGR (%) across **Base**, **Bull**, and **Bear** business cases.
* **Best Entry Tracking**: Specify target buy zones; the UI displays live percentage distances from the current price to your ideal entry price.
* **Status Badges**: Color-coded investment stances (`Buy`, `Avoid`, `Hold`, `Acc on dip`).
* **Multi-History Versioning**: Keep an audit trail of past analyses; switch between dates via the Date of Analysis dropdown to inspect how your thesis evolved over time.
* **Live Quotes & Local Cache**: Live market prices update on demand with background caching in `data/quotes_cache.json`.

---

### Tab 3: Market Screener & Predictive Analysis
*Full details in [docs/TAB3_MARKET_SCREENER.md](docs/TAB3_MARKET_SCREENER.md)*

* **Broad Market Universe**: Scan >3,400 NSE companies on demand from Prime Screener (`bigbreakingwire.in`).
* **Automated Daily Nonce**: Automatically discovers, caches, and rotates the required `X-WP-Nonce` daily.
* **154-Column Table**: Categorized column selector with frozen sticky columns, pagination, and TradingView chart links.
* **Multi-Day Sequence Analyzer**: Analyzes up to 11 chronological daily trading sessions to calculate predictive trajectory indicators:
  * `Accumulation Score (0–100)`: Quantifies institutional accumulation and flat-base coiling.
  * `Signal Freshness`: Pinpoints whether a breakout or trend flip occurred on Day 0/1 or is stale.
  * `VCP Compression Ratio`: Measures volatility contraction prior to expansion.
* **1-Click Strategy Presets**:
  * **Predictive Trajectory**: *Silent Accumulation*, *Fresh Signal Ignition*, *Multi-Day VCP Breakout*, *Staircase Buying*.
  * **Explosive 1–2 Day Setups**: *Institutional Blastoff*, *Coiled Spring Squeeze*, *Blue Sky ATH*, *8/8 Consensus*.
  * **Classical Momentum & Positional**: *BTST Surge*, *Swing Breakout*, *52W High*, *Dip Buyer*, *Compounders*, *High Delivery*.
* **Custom Filter Builder**: Multi-rule filter builder supporting 146 technical fields, column-to-column comparisons, and custom preset saving.

---

## Scheduled Runs & Windows Task Scheduler

Scheduled updates run twice daily on **weekdays (Monday–Friday)**.

### Registering or Updating the Task
The schedule times (default: **09:30** and **11:30**) can be configured directly from the UI or in `config/settings.json`. Saving times in the UI automatically synchronizes the Windows Task Scheduler.

To configure manually via PowerShell:
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\register_task.ps1
```

### Unregistering or Disabling the Task
```powershell
# Remove the task completely
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\register_task.ps1 -Unregister

# Temporarily disable the task
Disable-ScheduledTask -TaskName "StockMonitor-DailyUpdate"

# Re-enable the task
Enable-ScheduledTask -TaskName "StockMonitor-DailyUpdate"
```

### Scheduled Execution Workflow
1. Runs `scheduled_run.py` at the scheduled times.
2. Checks the weekday guard (Mon–Fri only).
3. Consumes any newly added tickers from `data/pending_additions.json`.
4. Fetches market prices, recomputes EMAs, and updates `data/snapshot.json`.
5. Increments `data/status.json`, triggering an instant SSE refresh on any open desktop window.
6. Launches `show_window.py` to pop the window to the foreground as a visual alert.

---

## Configuration Reference

Settings are stored in `config/settings.json` (see `config.template.json`):

| Setting | Default | Description |
| :--- | :--- | :--- |
| `schedule.run_times` | `["09:30", "11:30"]` | Daily run times (24-hour `HH:MM`) |
| `schedule.timezone` | `Asia/Kolkata` | Market timezone reference |
| `schedule.task_name` | `StockMonitor-DailyUpdate` | Windows Task Scheduler task name |
| `data.default_exchange_suffix` | `.NS` | Default exchange suffix for bare symbols |
| `data.history_period` | `10y` | Historical period fetched for EMA calculation |
| `data.ema_periods` | `[9, 21, 50, 100, 200]` | Tracked EMA periods |
| `data.max_workers` | `4` | Concurrency for background downloads |
| `data.retries` / `data.retry_backoff_seconds` | `2` / `1.5` | Retry attempts and backoff duration |
| `ui.status_poll_seconds` | `5` | Fallback polling interval if SSE disconnects |
| `ui.price_decimals` | `2` | Number of decimal places rendered in tables |

---

## Error Handling & Logging

All events and anomalies are logged to rotating files in `logs/`:

| Log File | Description |
| :--- | :--- |
| `logs/app.log` | Flask web server logs, API requests, and UI operations. |
| `logs/scheduler.log` | Summary records of scheduled runs, processed tickers, and network errors. |
| `logs/ticker_additions.log` | Audit trail of all ticker additions made through the UI. |
| `logs/scheduled_run_console.log` | Full console stdout/stderr from Task Scheduler runs. |

---

## HTTP API Reference

The Flask backend provides clean REST endpoints and real-time SSE streaming:

| Method & Path | Description |
| :--- | :--- |
| `GET /` | Serves the single-page React desktop application. |
| `GET /api/tables` | Returns rendered portfolio tables HTML and summary stats. |
| `GET /api/data` | Returns raw `snapshot.json` contents. |
| `POST /api/refresh` | Triggers immediate re-fetch and EMA recomputation for all portfolios. |
| `POST /api/tickers` | Validates, fetches, and appends a new ticker `{portfolio, symbol}`. |
| `DELETE /api/tickers` | Removes a ticker from a portfolio `{portfolio, symbol}`. |
| `GET` / `POST /api/schedule` | Reads or updates scheduled run times. |
| `GET /api/status` | Returns current data version counter and last-run summary. |
| `GET /api/stream` | Server-Sent Events (SSE) feed notifying clients of version updates. |
| `GET /api/stock-info?symbol=...` | Fetches live market price and official company name for a single ticker. |
| `POST /api/stock-quotes` | Batch fetches live market prices and timestamps for multiple tickers. |
| `GET /api/stock-status` | Retrieves all saved stock status and scenario analysis entries. |
| `POST /api/stock-status` | Saves a new stock status/scenario analysis entry. |
| `PUT /api/stock-status/<id>` | Updates an existing stock status entry. |
| `DELETE /api/stock-status/<id>` | Deletes a stock status entry. |
| `GET /api/screener/data?date=...` | Returns cached screener records and available historical dates. |
| `POST /api/screener/fetch` | Triggers on-demand screener fetch `{nonce, date, search, per_page}`. |
| `GET /api/screener/detect-nonce` | Auto-detects and returns active `X-WP-Nonce` from the screener site. |
| `POST /api/screener/sync-history` | Synchronizes available past trading dates into local disk cache. |
| `GET /api/screener/multi-day-analysis` | Computes multi-day sequence metrics and returns ranked predictive setups. |

---

## Known Limitations & Planned Features

### Limitations
* **Local Single-User Architecture**: Built for local desktop use; does not require authentication.
* **Public Data Endpoints**: Market data relies on Yahoo Finance (`yfinance`) and Prime Screener; subject to intermittent network latency or rate-limiting.
* **Active Machine Requirement**: Scheduled runs execute via Windows Task Scheduler; machine must be active or awake.

### Roadmap
* [ ] Alerts: Native desktop toast or notification sound when prices cross watched EMAs.
* [ ] Direct Broker Integration: Pluggable fallback data providers (e.g. Zerodha Kite, Upstox).
* [ ] Portfolio Customization: Support creating, renaming, and deleting custom portfolios from the UI.
* [ ] Data Export: One-click export to CSV/Excel for screener and portfolio tables.
