# Project Knowledge Graph: Portfolio and Stock Monitor

A comprehensive architectural map and reference guide for AI agents and developers. Consult this document to quickly locate relevant modules, understand component relationships and data flows, and make targeted modifications without re-reading the full codebase.

---

## 1. System Architecture Overview

The application is a local desktop financial dashboard that monitors Indian equity markets (NSE/BSE). It operates as a **React single-page application** served by a **lightweight Python Flask backend**, running either as a native desktop window (via `pywebview`) or in any standard web browser.

### Key Technology Stack
- **Frontend**: React 18, Vite 6, Bootstrap 5.3, Lucide React (icons), vanilla CSS (`custom.css`).
- **Backend**: Python 3.10+, Flask (routes & SSE server), pywebview (desktop shell), yfinance (market data).
- **Automation / Scheduling**: Windows Task Scheduler invoking PowerShell background runner scripts.
- **Inter-Process Coordination**: Shared atomic JSON files with Server-Sent Events (SSE) push notifications.

---

## 2. Core Architecture & Data Flow Diagrams

### High-Level System Topology

```mermaid
flowchart TB
    subgraph Sched [Scheduler & Background Process]
        WTS[Windows Task Scheduler] -->|weekdays 09:30, 11:30| PS[scripts/run_scheduled.ps1]
        PS --> SR[scheduled_run.py]
        SR -->|Fetch data & compute EMAs| YF1[yfinance / EMA Engine]
        SR -->|Atomic Write| SNAP[data/snapshot.json]
        SR -->|Version Bump| STAT[data/status.json]
        SR -->|Popup on top| SW[show_window.py]
    end

    subgraph Backend [Flask Application Process]
        APP[app.py / pywebview] --> FLASK[Flask Server (stockmon.web)]
        FLASK -->|SSE Stream /api/stream| SSE[SSE Watcher]
        FLASK -->|REST API| ROUTES[stockmon/web/routes.py]
        ROUTES -->|Read/Write| SNAP
        ROUTES -->|Read/Write| STAT
        ROUTES -->|Read/Write| SSTATUS[data/stock_status.json]
        ROUTES -->|Read/Write| QCACHE[data/quotes_cache.json]
        ROUTES -->|Read/Write| CFG[config/settings.json & portfolios.json]
    end

    subgraph Frontend [React SPA (frontend/dist)]
        UI[App.jsx]
        UI --> TAB1[Portfolio Tracker Tab]
        UI --> TAB2[Stock Status Tab]
        TAB1 --> PTABLE[PortfolioTable.jsx]
        TAB2 --> STABLE[StatusTable.jsx]
        TAB2 --> SMODAL[AddStatusModal.jsx]
        SSE -.->|Push Event| UI
    end
```

### Dual-Tab Operational Flows

```mermaid
sequenceDiagram
    autonumber
    participant User as User / Scheduler
    participant UI as React Frontend
    participant API as Flask Backend
    participant Storage as JSON Files
    participant Yahoo as Yahoo Finance (yfinance)

    %% Tab 1: Tracker
    rect rgb(240, 245, 255)
    Note over User,Yahoo: Tab 1: Tracker (EMA Monitor)
    User->>API: POST /api/refresh (or scheduled_run.py)
    API->>Yahoo: Download historical bars (yfinance)
    API->>API: Resample weekly candles, calculate 9/21/50/100/200 EMAs
    API->>Storage: Atomically update data/snapshot.json & bump data/status.json
    API-->>UI: SSE "update" event fires
    UI->>API: GET /api/tables
    API-->>UI: Fresh table snapshot data
    end

    %% Tab 2: Status
    rect rgb(245, 255, 245)
    Note over User,Yahoo: Tab 2: Stock Status (Valuation & Scenarios)
    User->>UI: Open "+ Add Stock" or Edit entry
    UI->>API: GET /api/stock-info?symbol=...
    API->>Yahoo: fetch_ticker_quote
    Yahoo-->>API: Live price, company name, currency
    API-->>UI: Stock metadata
    User->>UI: Enter Best Entry, Status (Buy/Avoid/Hold/Acc on dip), Targets & Remarks
    UI->>API: POST /api/stock-status or PUT /api/stock-status/<id>
    API->>Storage: Atomically write to data/stock_status.json
    API-->>UI: Updated items list
    UI->>API: POST /api/stock-quotes (batch live price refresh)
    API-->>UI: Live quotes + timestamps
    UI->>UI: Render Best Entry diff pill, Status badge, collapsible Remarks
    end
```

---

## 3. Directory Map & Code Locations

```
Daily Updater/
├── app.py                     # Primary desktop entry point (launches Flask in daemon thread + pywebview)
├── show_window.py             # Focuses or restores the application window after scheduled refresh
├── scheduled_run.py           # CLI script triggered by Windows Task Scheduler
├── config/                    # Configuration storage
│   ├── settings.json          # Schedule times, timezone, task name, EMA periods, retry limits
│   └── portfolios.json        # Portfolio lists (e.g. "BAPA", "MADI" ticker arrays)
├── data/                      # Atomic runtime stores
│   ├── snapshot.json          # Rendered Tracker snapshot (prices, EMAs, signals, warnings)
│   ├── status.json            # Status sync file (version integer incremented on updates)
│   ├── stock_status.json      # Saved stock valuation records (targets, best entry, status, remarks)
│   ├── quotes_cache.json      # Cached stock price quotes & timestamps (fallback cache)
│   └── pending_additions.json # Queue of tickers added through UI to be processed in next run
├── docs/                      # Architectural and technical documentation
│   └── KNOWLEDGE_GRAPH.md     # [This file] Fast architectural lookup and module map
├── frontend/                  # React Single-Page Application (Vite project)
│   ├── package.json           # Dependencies (React 18, Bootstrap 5.3, Lucide React, Vite 6)
│   ├── vite.config.js         # Dev proxy config (/api -> http://127.0.0.1:5000)
│   ├── dist/                  # Production bundle (HTML, JS, CSS) served by Flask
│   └── src/
│       ├── main.jsx           # React root entry point
│       ├── App.jsx            # Main app shell, tab switching, global polling / SSE setup
│       ├── api.js             # Fetch client for all backend REST endpoints
│       ├── components/
│       │   ├── Header.jsx           # App bar with active tab switch, "Refresh now", last run time
│       │   ├── PortfolioSection.jsx # Collapsible portfolio container (BAPA / MADI)
│       │   ├── PortfolioTable.jsx   # Tracker table (EMA columns, Sell/Hold signals, notes)
│       │   ├── EmaCell.jsx          # Stacked Daily (D:) / Weekly (W:) EMA value renderer
│       │   ├── AddTickerPanel.jsx   # Ticker addition form with real-time duplicate check
│       │   ├── SchedulePanel.jsx    # UI to edit Task Scheduler run times (HH:MM)
│       │   ├── StatusTab.jsx        # Status tab container (search, filter, batch quotes, modal trigger)
│       │   ├── StatusTable.jsx      # Valuation scenarios table (Best Entry, Status, Targets, Remarks)
│       │   ├── AddStatusModal.jsx   # Add/Edit stock status modal (Live fetch, Best Entry, Status dropdown)
│       │   ├── ErrorsPanel.jsx      # Panel displaying fetch issues or errors
│       │   ├── Footer.jsx           # Footer showing connection status (live SSE vs. polling)
│       │   └── Toast.jsx            # Notification toast popups
│       └── styles/
│           └── custom.css           # Global application styles, badges, table layouts, modals
├── stockmon/                  # Python backend application package
│   ├── __init__.py
│   ├── paths.py               # Centralized path resolver (configurable via env variables)
│   ├── jsonstore.py           # Atomic JSON read/write using temporary file replace
│   ├── logging_config.py      # Multi-handler rotating log setup (app.log, scheduler.log)
│   ├── errors.py              # Custom exceptions (ValidationError, DataFetchError)
│   ├── config_manager.py      # Loader and updater for settings.json
│   ├── portfolio.py           # Symbol normalization, validation, and TradingView URL generation
│   ├── data_fetcher.py        # yfinance market data downloader with retries and caching
│   ├── ema.py                 # EMA calculation and Friday-anchored weekly candle resampling
│   ├── service.py             # Orchestration service: fetch -> EMA -> snapshot -> status version bump
│   ├── status.py              # Status version store management (SSE triggers)
│   ├── stock_status.py        # Storage and CRUD operations for stock_status.json
│   └── web/                   # Flask web application
│       ├── __init__.py        # Flask app factory (serves frontend/dist)
│       └── routes.py          # API route definitions and SSE event streaming
└── scripts/                   # Windows Task Scheduler automation
    ├── register_task.ps1      # Registers/updates the task in Windows Task Scheduler
    ├── run_scheduled.ps1      # PowerShell execution script run by Task Scheduler
    └── run_scheduled.bat      # Batch wrapper for run_scheduled.ps1
```

---

## 4. Component Hierarchy & State Flow

```mermaid
graph TD
    App[App.jsx]
    App --> Header[Header.jsx]
    App --> Toast[Toast.jsx]
    App --> ErrorsPanel[ErrorsPanel.jsx]
    App --> SchedulePanel[SchedulePanel.jsx]

    App -->|Tab: Tracker| AddTickerPanel[AddTickerPanel.jsx]
    App -->|Tab: Tracker| PortfolioSection[PortfolioSection.jsx]
    PortfolioSection --> PortfolioTable[PortfolioTable.jsx]
    PortfolioTable --> EmaCell[EmaCell.jsx]

    App -->|Tab: Status| StatusTab[StatusTab.jsx]
    StatusTab --> StatusTable[StatusTable.jsx]
    StatusTable --> RemarksCell["RemarksCell (Collapsible)"]
    StatusTab --> AddStatusModal[AddStatusModal.jsx]

    App --> Footer[Footer.jsx]
```

### State Management Guidelines
- **Global Data**: Handled in `App.jsx` via `loadData()` and `api.subscribeToUpdates()`. It maintains the Tracker table data, errors, and scheduled times.
- **Status Tab Data**: Managed in `StatusTab.jsx` (`items`, `liveQuotes`, `searchTerm`, `selectedHistoryMap`).
- **Modal State**: Managed in `AddStatusModal.jsx` (symbol, stockName, priceOfAnalysis, bestEntry, status, base, bull, bear, remarks). Form changes are committed via `handleModalSubmit`.

---

## 5. Data Contracts & Persistence Schemas

### `data/stock_status.json` Record Schema
```json
{
  "id": "c154101a9a22",
  "symbol": "LORDSMARK.BO",
  "name": "Lord's Mark Industries Limited",
  "date_of_analysis": "2026-09-02",
  "price_of_analysis": 81.11,
  "best_entry": 75.0,
  "status": "Buy",
  "currency": "INR",
  "base": ["93", "4.6"],
  "bull": ["139", "19"],
  "bear": ["62", "-8.6"],
  "remarks": "- Multi-line remarks text preserved with exact line breaks and formatting...",
  "created_at": "2026-09-02T19:53:10.347524",
  "updated_at": "2026-09-02T20:25:00.123456"
}
```

### Status Dropdown & Badge Values
| Value | Badge Class | Color | Meaning |
| :--- | :--- | :--- | :--- |
| `Buy` | `.status-badge-buy` | Rich Green (`#15803d` / `#dcfce7`) | Strong buy candidate at current/entry level |
| `Avoid` | `.status-badge-avoid` | Red (`#b91c1c` / `#fee2e2`) | Avoid or high downside risk |
| `Hold` | `.status-badge-hold` | Yellow (`#b45309` / `#fef3c7`) | Neutral / wait and hold |
| `Acc on dip` | `.status-badge-acc-on-dip` | Light Green / Mint (`#065f46` / `#d1fae5`) | Accumulate on price retracements |

### Percentage Difference Formula (Shared Logic)
For both **Current Price** (vs Price of Analysis) and **Best Entry** (vs Current Price):
$$\text{diff} = \frac{\text{Current Price} - \text{Reference Price}}{\text{Reference Price}} \times 100$$
- Displayed with `+` sign if $\ge 0$.
- Colored with `.price-change-pill.pos` (green) or `.price-change-pill.neg` (red).

---

## 6. HTTP API Endpoint Matrix

| Method | Path | Handled In | Purpose | Request Body / Query |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/tables` | `routes.py` | Full tracker tables + errors | None |
| `GET` | `/api/data` | `routes.py` | Raw `snapshot.json` | None |
| `POST` | `/api/refresh` | `routes.py` | Trigger full EMA re-fetch | None |
| `POST` | `/api/tickers` | `routes.py` | Add ticker to portfolio | `{"portfolio": "BAPA", "symbol": "TCS"}` |
| `DELETE` | `/api/tickers` | `routes.py` | Remove ticker | `{"portfolio": "BAPA", "symbol": "TCS"}` |
| `GET` | `/api/schedule` | `routes.py` | Get scheduled times | None |
| `POST` | `/api/schedule` | `routes.py` | Update scheduled times | `{"run_times": ["09:30", "11:30"]}` |
| `GET` | `/api/status` | `routes.py` | Get current data version | None |
| `GET` | `/api/stream` | `routes.py` | SSE push stream for version bump | Query: `?version=N` |
| `GET` | `/api/stock-info` | `routes.py` | Fetch live quote & company name | Query: `?symbol=INFY.NS` |
| `POST` | `/api/stock-quotes`| `routes.py`| Batch parallel quote fetch | `{"symbols": ["TCS.NS", "INFY.NS"]}` |
| `GET` | `/api/stock-status`| `routes.py`| List all status records | None |
| `POST` | `/api/stock-status`| `routes.py`| Create new stock status record | Status record payload |
| `PUT` | `/api/stock-status/<id>` | `routes.py` | Update existing status record | Updated fields payload |
| `DELETE`| `/api/stock-status/<id>` | `routes.py` | Delete status record | None |

---

## 7. Developer & Agent Cheat Sheet

When implementing new changes, refer to this table to minimize file exploration:

| Goal | Primary Files to Inspect / Modify |
| :--- | :--- |
| **Status Tab Columns or UI** | `frontend/src/components/StatusTable.jsx`, `frontend/src/components/StatusTab.jsx` |
| **Add/Edit Stock Modal** | `frontend/src/components/AddStatusModal.jsx` |
| **Stock Status Backend Storage** | `stockmon/stock_status.py`, `stockmon/web/routes.py` |
| **Tracker Table or EMAs** | `frontend/src/components/PortfolioTable.jsx`, `stockmon/ema.py`, `stockmon/service.py` |
| **Market Data Fetching / yfinance** | `stockmon/data_fetcher.py`, `stockmon/portfolio.py` |
| **CSS Badges, Pills, Layouts** | `frontend/src/styles/custom.css` |
| **Task Scheduler & Automated Runs** | `stockmon/config_manager.py`, `scripts/register_task.ps1`, `scheduled_run.py` |
| **Frontend Production Build** | Run `npm run build` in `frontend/` (outputs to `frontend/dist/`) |
| **Backend Testing / Python Check** | Run `.\.venv\Scripts\python.exe` with `stockmon` imports |
