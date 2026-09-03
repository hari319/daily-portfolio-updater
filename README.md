# Portfolio and Stock Monitor (BAPA &amp; MADI)

A local desktop application that tracks two NSE/BSE stock portfolios — **BAPA** and **MADI** — and
flags, at a glance, every EMA the current price has fallen below.

The app features a modern **React + Bootstrap 5** single-page interface and opens as a **native desktop window** (powered by [pywebview](https://pywebview.flowrl.com/)) or in any browser. For each ticker it computes the **9, 21, 50, 100 and 200 period EMA** on
both the **daily** and the **weekly** timeframe (10 values per ticker).

* **Signal Column**: Shows **`SELL`** (in red) when the price is below the daily 200 EMA, and **`HOLD`** (in green) otherwise.
* **Priority Sorting**: Tickers below the daily 200 EMA appear first (highest priority), followed by 100, 50, 21, and 9 EMA. Within the same priority level, tickers are sorted **alphabetically**.
* **Stacked EMA Values**: Each EMA column shows daily (**D:**) on top and weekly (**W:**) below. An EMA value is displayed **only when the current price is below it on that timeframe**, rendered in **red**. If the price is above an EMA, the row stays blank.
* **N/A for Missing Data**: If a specific EMA lacks sufficient history (e.g. 200-week on a recent listing), it shows `N/A` in muted grey while other available EMAs continue to display normally.
* **NSE/BSE Auto-Switch**: If a ticker on one exchange has thin history (< 400 daily bars), the app automatically checks the alternate exchange (`.NS` ↔ `.BO`) and uses whichever has more history.
* **Stock Company Names**: The company name is fetched from Yahoo Finance and displayed directly under each ticker link.
* **Collapsible Tables**: Each portfolio table has a compact toggle button in its header to collapse or expand the table.
* **Weekday Schedule & Top-Level Popup**: Scheduled refreshes run twice daily on **weekdays (Monday to Friday)**, popping up on top of all open windows as a reminder.

The app shows **live data only** — current price and current EMAs. There is deliberately no
historical / past-day browsing.

---

## Table of contents

1. [How it works](#how-it-works)
2. [Project structure](#project-structure)
3. [Setup](#setup)
4. [Running the app](#running-the-app)
5. [Frontend Development](#frontend-development)
6. [Adding and editing tickers](#adding-and-editing-tickers)
7. [Stock Status & Analysis Scenarios](#stock-status--analysis-scenarios)
8. [Changing the scheduled run times](#changing-the-scheduled-run-times)
9. [Windows Task Scheduler setup](#windows-task-scheduler-setup)
10. [Stopping the scheduled task](#stopping-the-scheduled-task)
11. [How the scheduler notifies the app](#how-the-scheduler-notifies-the-app)
12. [EMA and colour logic](#ema-and-colour-logic)
13. [Error handling and logging](#error-handling-and-logging)
14. [Configuration reference](#configuration-reference)
15. [HTTP API](#http-api)
16. [Known limitations](#known-limitations)
17. [Planned features](#planned-features)
18. [Knowledge Graph & Architecture Map](docs/KNOWLEDGE_GRAPH.md)

---

## How it works

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

* **Prices/history** come from `yfinance`. NSE symbols use the `.NS` suffix, BSE uses `.BO`.
* **Weekly candles** are derived by resampling the daily history (Friday-anchored), so only one
  network request per ticker is needed and the in-progress week reflects the live price.
* **Two processes, one set of files.** The Flask app and the Windows scheduled task never talk
  directly; they share `data/snapshot.json` and `data/status.json`.

## Project structure

```
Daily Updater/
├── app.py                     # Desktop window entry point (python app.py)
├── show_window.py             # Reminder popup launched after a scheduled refresh
├── scheduled_run.py           # Batch refresh entry point (run by Task Scheduler)
├── requirements.txt
├── config.template.json       # Template for config/settings.json
├── portfolios.template.json   # Template for config/portfolios.json
├── frontend/                  # React + Bootstrap 5 frontend (Vite)
│   ├── package.json
│   ├── vite.config.js
│   ├── dist/                  # Production build served by Flask
│   └── src/                   # React components, styles, and API client
├── docs/
│   └── KNOWLEDGE_GRAPH.md     # Architectural map & module guide for developers/agents
├── stockmon/
│   ├── paths.py               # Where config/data/logs live (env-overridable)
│   ├── jsonstore.py           # Atomic JSON read/write shared by both processes
│   ├── logging_config.py      # Rotating file + console logging
│   ├── errors.py              # ValidationError / DataFetchError
│   ├── config_manager.py      # settings.json (schedule, EMA periods, UI options)
│   ├── portfolio.py           # Ticker validation, portfolios, TradingView links, add-log
│   ├── data_fetcher.py        # yfinance access with retries and graceful failures
│   ├── ema.py                 # Weekly resampling + EMA computation and data checks
│   ├── service.py             # Orchestration: fetch → EMAs → snapshot → status
│   ├── status.py              # The "new data available" signal (version counter)
│   └── web/
│       ├── __init__.py        # Flask application factory (serves React build)
│       └── routes.py          # REST API endpoints and SSE stream
├── scripts/
│   ├── run_scheduled.ps1      # What Task Scheduler runs
│   ├── run_scheduled.bat      # .bat wrapper around the above
│   └── register_task.ps1      # Creates/updates the task from config/settings.json
├── config/                    # Generated on first run (settings.json, portfolios.json)
├── data/                      # Generated: snapshot.json, status.json, pending_additions.json
└── logs/                      # Generated: app.log, scheduler.log, ticker_additions.log
```

## Setup

Requires **Python 3.10+** on Windows. **No API keys are required** — `yfinance` uses public Yahoo
Finance endpoints. The desktop window is provided by
[pywebview](https://pywebview.flowrl.com/) (installed automatically with `pip install -r requirements.txt`).

```powershell
cd "C:\Users\hmaru\Downloads\Personal\Project\Daily Updater"

python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

`config/settings.json` and `config/portfolios.json` are created automatically on first run from the
built-in defaults (the two `*.template.json` files in the project root document the same shape and
can be copied into `config/` if you prefer to pre-seed them).

## Running the app

```powershell
.\.venv\Scripts\python.exe app.py                 # opens a native desktop window
.\.venv\Scripts\python.exe app.py --port 8000     # different port
.\.venv\Scripts\python.exe app.py --browser       # open in the system browser instead
.\.venv\Scripts\python.exe app.py --debug         # browser mode with auto-reload for development
```

By default the app opens as a **native desktop window** (1200 × 800) via
[pywebview](https://pywebview.flowrl.com/). Flask runs in a background thread and serves
the UI inside the window. Closing the window stops the app.

Use `--browser` to fall back to the original behaviour (opens in the system browser at
`http://127.0.0.1:5000`). Use `--debug` for Flask auto-reload during development (also opens in the
browser).

If no data has been fetched yet, click **Refresh now** (or run `python scheduled_run.py` once) to
populate the tables.

Each ticker name in the table is a hyperlink that opens that symbol's **TradingView chart** in a new
tab (`NSE:RELIANCE` / `BSE:500325`), with the **company name** displayed directly below the symbol.
## Frontend Development

The frontend is built with **React**, **Bootstrap 5**, and **Lucide Icons** using **Vite**.

```powershell
cd frontend

# Install dependencies (first time only)
npm install

# Start Vite hot-reload development server (proxies /api to Flask at 127.0.0.1:5000)
npm run dev

# Build production bundle into frontend/dist/ (served by Flask and pywebview desktop window)
npm run build
```

---

## Adding and editing tickers

**Through the UI** — pick the portfolio, type the symbol and click **Add &amp; fetch**:

* Plain symbols get the default suffix (`.NS`) automatically — `CARTRADE` becomes `CARTRADE.NS`.
  Type `500325.BO` for a BSE listing.
* **Real-time duplicate check**: As you type a symbol into the box, the UI immediately alerts you if
  that stock is already in the selected portfolio (or another portfolio).
* The symbol format is validated, duplicates within a portfolio are rejected, and the ticker is
  **fetched immediately** (including the live company name). If `yfinance` returns nothing
  (typo, delisted, network down) the ticker is **not** added and the reason is shown in the UI.
* On success the row is inserted into the live table right away — you do not wait for the next
  scheduled run.
* The addition is also **logged** to `logs/ticker_additions.log` and queued in
  `data/pending_additions.json`. The next scheduled run consumes that queue, records
  *"Picked up N newly added ticker(s)"* in `logs/scheduler.log`, and refreshes the new ticker along
  with the rest of the portfolio.
* The `×` button at the end of a row removes that ticker from the portfolio.

**By editing the file** — `config/portfolios.json`:

```json
{
  "BAPA": ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS"],
  "MADI": ["INFY.NS", "ITC.NS", "CARTRADE.NS"]
}
```

Invalid entries are logged and skipped rather than crashing the app. Click **Refresh now** after
editing the file by hand.

## Stock Status & Analysis Scenarios

The app includes a dedicated **Status** tab alongside the **Tracker** tab for tracking fundamental & technical stock valuation targets (Base, Bull, Bear) across analysis dates.

### Key Features & Usage

* **Tab Navigation**: Toggle between the portfolio **Tracker** (EMA monitor) and **Status** (stock scenarios table).
* **Live Search**: Type into the search box at the top to filter status records by ticker or company name in real time.
* **Adding a Stock Analysis**:
  1. Click **+ Add Stock** in the Status tab.
  2. Enter the ticker symbol (e.g. `INFY` or `TATAMOTORS.NS`) and click **Fetch**. This retrieves the company name and current market price from Yahoo Finance as your baseline **Price of Analysis**.
  3. Enter optional **Best Entry** price and choose a **Status** stance (`Buy`, `Avoid`, `Hold`, `Acc on dip`).
  4. Enter **Target Price** and **Target CAGR (%)** for the **Base**, **Bull**, and **Bear** scenarios.
  5. Add optional **Remarks** (thesis notes, catalysts, stoploss) and click **Submit**. The entry is automatically saved with the current date.
* **Best Entry & Status Columns**:
  * **Best Entry**: Displays your target purchase price alongside a color-coded percentage badge (`+X.X%` / `-X.X%`) comparing the live Current Price to the Best Entry price, using the exact same calculation and badge styling as Current Price.
  * **Status**: Color-coded indicator badge for quick orientation:
    * `Buy` — green
    * `Avoid` — red
    * `Hold` — yellow
    * `Acc on dip` — light green
  * **Actions Column**: Placed conveniently next to the Best Entry column for quick editing or deletion.
* **Remarks Display & Collapsible Preview**:
  * The Remarks column renders multi-line text with exact whitespace, line breaks, and bullet formatting matching the input text field.
  * Collapsed by default showing a clean preview snippet; click **Show more** to expand and **Show less** to collapse.
* **Live Current Price & Timestamp**:
  * Displays the live stock price in real time with the date & time of the quote underneath.
  * Shows a color-coded percentage badge (`+X.X%` / `-X.X%`) comparing the current live price against the baseline analysis price.
  * **Quote Caching & Fallback**: Quotes are cached locally in `data/quotes_cache.json` (with max 2 retry attempts). If a live quote fails or times out, the last known stored price and its timestamp are displayed seamlessly.
* **Refresh Prices Button**: Located in the Status tab to update live market quotes and timestamps for all analysed stocks on demand. *(Note: The header **Refresh now** button remains dedicated to recomputing the Tracker portfolio EMAs).*
* **Row Editing & Multi-History Records**:
  * Click the **Edit** (pencil) icon on any row to open the modal:
    * **Existing**: Update Best Entry, Status, targets, CAGR %, or remarks for the existing analysis date.
    * **New (History)**: Creates a new historical analysis record for that stock using today's date and a fresh live market price.
* **Historical Analysis Date Dropdown**:
  * When a ticker has multiple analysis entries, the **Date of Analysis** column renders a dropdown selector.
  * Switching the date dynamically displays the historical baseline price, Best Entry, Status, scenario targets, and remarks recorded on that date, while the **Current Price** remains live.

## Changing the scheduled run times

The two run times (default **09:30** and **11:30**) live in `config/settings.json`:

```json
"schedule": { "run_times": ["09:30", "11:30"], "timezone": "Asia/Kolkata", "task_name": "StockMonitor-DailyUpdate" }
```

Set them in the **Scheduled run times** panel of the UI and click **Save times**. The app
**automatically syncs the new times with Windows Task Scheduler immediately** — no manual script
execution required. Times are validated as 24-hour `HH:MM`; exactly two are required.

## Windows Task Scheduler setup

**Recommended (scripted):**

```powershell
cd "C:\Users\hmaru\Downloads\Personal\Project\Daily Updater"
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\register_task.ps1
```

This reads `config/settings.json` and registers a task (default name `StockMonitor-DailyUpdate`)
with **weekly triggers for Monday through Friday (weekdays only)** at each configured time,
running `powershell.exe -File scripts\run_scheduled.ps1` in the active user session.
Useful switches: `-Sync` (only update when times changed), `-Unregister` (remove the task),
`-TaskName <name>`.

**Manual (Task Scheduler GUI)** — if you prefer to create it by hand:

| Setting | Value |
| --- | --- |
| General → Name | `StockMonitor-DailyUpdate` |
| General → Run only when user is logged on | Selected (required for interactive window popup) |
| Triggers | Weekly on **Mon, Tue, Wed, Thu, Fri** at `09:30`, and second trigger at `11:30` |
| Action → Program/script | `powershell.exe` |
| Action → Add arguments | `-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "C:\...\Daily Updater\scripts\run_scheduled.ps1"` |
| Action → Start in | `C:\...\Daily Updater` |
| Settings | *Run task as soon as possible after a scheduled start is missed* |

`scripts\run_scheduled.bat` is a drop-in alternative if you would rather point the action at a
`.bat` file.

**What a run does:**

1. Locates the interpreter (`.venv\Scripts\python.exe`, then `venv\`, then `python.exe` on `PATH`).
2. Runs `scheduled_run.py`, which checks the weekday guard, consumes queued additions, fetches every
   ticker in both portfolios, computes EMAs, applies priority sorting, and rewrites `data/snapshot.json`.
3. Bumps `data/status.json` so any open desktop window refreshes itself via SSE.
4. **Pops up a reminder window on top** — on success, launches `show_window.py` which brings the app
   window on top of all currently running applications so you don't miss the update. If the window
   is already open, it is restored and brought to the front.
5. Re-syncs the task triggers with `config/settings.json`.
6. Logs the outcome to `logs/scheduler.log` (plus a runner transcript in
   `logs/scheduled_run_console.log`).

Exit codes: `0` success, `1` every ticker failed, `2` unexpected fatal error.

Test it any time without waiting for the clock:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\run_scheduled.ps1
```

## Stopping the scheduled task

If you no longer want the twice-daily scheduled runs (and the reminder popup), you can **disable** or
**remove** the Windows Task Scheduler task.

### Remove the task entirely (scripted)

```powershell
cd "C:\Users\hmaru\Downloads\Personal\Project\Daily Updater"
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\register_task.ps1 -Unregister
```

This deletes the `StockMonitor-DailyUpdate` task from Task Scheduler. You can re-create it later by
running `register_task.ps1` again without `-Unregister`.

### Disable the task temporarily (GUI)

1. Press **Win + R**, type `taskschd.msc`, press Enter.
2. In the left pane navigate to **Task Scheduler Library**.
3. Find the task named **StockMonitor-DailyUpdate** in the list.
4. Right-click it → **Disable**.

The task stays registered but will not fire until you right-click → **Enable** it again.

### Disable the task temporarily (PowerShell)

```powershell
# Disable (stop all future runs)
Disable-ScheduledTask -TaskName "StockMonitor-DailyUpdate"

# Re-enable when you want it back
Enable-ScheduledTask -TaskName "StockMonitor-DailyUpdate"
```

### Skip a single run

If you just want to stop the **currently running** instance (or prevent the next imminent one):

```powershell
# Stop a run that is executing right now
Stop-ScheduledTask -TaskName "StockMonitor-DailyUpdate"
```

The task remains enabled and will fire again at the next configured time.

### Check current status

```powershell
Get-ScheduledTask -TaskName "StockMonitor-DailyUpdate" | Select-Object TaskName, State
```

| State | Meaning |
| --- | --- |
| `Ready` | Enabled, waiting for the next trigger |
| `Running` | Currently executing |
| `Disabled` | Will not fire until re-enabled |

## How the scheduler notifies the app

The scheduled task runs in its **own process**, so it signals the app through a shared file:

* Every successful refresh writes `data/status.json` with an incremented `version`, a timestamp, the
  source (`scheduled`, `manual`, `ticker-added`, `ticker-removed`) and a summary.
* The desktop window holds an **SSE** connection to `GET /api/stream`. The Flask app watches the
  status file and pushes an `update` event as soon as the version changes.
* On that event the page fetches `GET /api/tables` and swaps in freshly rendered tables — no reload
  and no manual click. A toast confirms *"Scheduled run finished — 6/6 tickers refreshed"*.
* If `EventSource` is unavailable or the stream closes permanently, the page falls back to polling
  `GET /api/status` every `ui.status_poll_seconds`. The indicator in the footer shows which mode is
  active (`live` / `polling for updates`).

The same mechanism drives the **Refresh now** button, ticker additions and removals, so every window
stays in sync.

## EMA and colour logic

* EMA uses the standard smoothed formula, `close.ewm(span=n, adjust=False)`, matching charting
  platforms.
* **Daily** values come from the daily close series; **weekly** values from Friday-anchored weekly
  candles resampled from the same history. The current (unfinished) day and week are included so the
  numbers are "live".
* The current price is the live quote when available, otherwise the most recent close (noted in the
  row's tooltip). When a live quote exists, the forming daily candle's close is updated with it so
  the intraday EMA matches what a chart shows.
* **Signal Logic**:
  * **`SELL`** (red text): Current price is **below** the daily 200 EMA.
  * **`HOLD`** (green text): Current price is **above** the daily 200 EMA (or 200 EMA data is not available).
* **Priority Sorting**:
  * Tickers are sorted by the highest daily EMA breached:
    1. **Priority 0 (Highest)**: Price below daily **200** EMA
    2. **Priority 1**: Price below daily **100** EMA
    3. **Priority 2**: Price below daily **50** EMA
    4. **Priority 3**: Price below daily **21** EMA
    5. **Priority 4**: Price below daily **9** EMA
    6. **Priority 5 (Lowest)**: Price above all daily EMAs
  * Tickers sharing the same priority level are sorted **alphabetically**.
* **Display rule** per EMA and timeframe:

  | Condition | Cell content |
  | --- | --- |
  | price **below** the EMA | **D:** or **W:** label followed by the value, in **red** |
  | price **above** the EMA | blank (the **D:** / **W:** label is still shown for alignment) |
  | data **unavailable** | **D:** or **W:** followed by **`N/A`** in muted grey |

  Each EMA column stacks the daily value on top (**D:**) and the weekly value below (**W:**).
  Example: if CARTRADE is below its daily 9 EMA but above its weekly 9 EMA, the "9 EMA" cell shows
  `D: 245.30` in red on the first line, with the second line (`W:`) blank.
* **N/A for Missing Data**: If an individual EMA cannot be computed due to insufficient historical bars
  (e.g., 200-week EMA on a stock listed 1 year ago), that specific timeframe renders as `N/A` in muted grey.
  All other EMAs for that stock continue to compute and display normally without throwing warning flags.
* **NSE / BSE Auto-Switch**: If a ticker on its primary exchange has thin historical data (< 400 daily bars,
  which is ~200 EMA × 2), the system automatically attempts to fetch history from the alternate exchange
  (`.NS` ↔ `.BO`). If the alternate exchange provides more bars, it is used automatically to compute the EMAs
  accurately.

## Error handling and logging

| Situation | Behaviour |
| --- | --- |
| Invalid/unknown/delisted symbol | Fetch retried (`data.retries`, exponential backoff), then the ticker is skipped, the row shows *"Data unavailable — …"*, and it is listed in the red **Fetch problems** panel. Other tickers continue to process. |
| Ticker added through the UI that cannot be fetched | Rejected with an explanation; nothing is written to the portfolio. |
| Malformed ticker input | Rejected by format validation before any network call. |
| Duplicate ticker | Rejected with a message naming the portfolio. |
| Invalid schedule time | Rejected; `config/settings.json` is left untouched. |
| Corrupt `settings.json` / `portfolios.json` / `snapshot.json` | Logged, moved aside as `*.corrupt`, and regenerated from defaults. |
| Network outage during a scheduled run | Every failure is logged; exit code `1` if nothing could be fetched, so Task Scheduler shows the failure. |
| Live quote unavailable | Falls back to the latest close and notes it on the row. |
| Overlapping refreshes | A second concurrent refresh returns HTTP 409 instead of duplicating work. |

Log files (rotating, 5 backups):

| File | Contents |
| --- | --- |
| `logs/app.log` | Web app activity: refreshes, additions/removals, schedule edits, errors |
| `logs/scheduler.log` | One block per scheduled run: tickers picked up, per-ticker failures, totals |
| `logs/ticker_additions.log` | Audit trail of every ticker added through the UI |
| `logs/scheduled_run_console.log` | Transcript written by the PowerShell runner |

## Configuration reference

`config/settings.json` (see `config.template.json`):

| Key | Default | Meaning |
| --- | --- | --- |
| `schedule.run_times` | `["09:30", "11:30"]` | The two daily run times, editable from the UI |
| `schedule.timezone` | `Asia/Kolkata` | Informational label for the market timezone |
| `schedule.task_name` | `StockMonitor-DailyUpdate` | Windows scheduled task name |
| `data.default_exchange_suffix` | `.NS` | Suffix applied to symbols entered without one |
| `data.history_period` | `10y` | History downloaded per ticker (needs ≥ 200 weeks for the 200-week EMA) |
| `data.ema_periods` | `[9, 21, 50, 100, 200]` | EMA periods; adding one adds a table column |
| `data.max_workers` | `4` | Parallel ticker downloads |
| `data.retries` / `data.retry_backoff_seconds` | `2` / `1.5` | Retry policy per ticker |
| `ui.status_poll_seconds` | `5` | Poll interval used when SSE is unavailable |
| `ui.price_decimals` | `2` | Decimal places for prices and EMAs |

The config/data/log locations can be relocated with the `STOCKMON_CONFIG_DIR`, `STOCKMON_DATA_DIR`
and `STOCKMON_LOG_DIR` environment variables (both processes must see the same values).

## HTTP API

| Method &amp; path | Purpose |
| --- | --- |
| `GET /` | The UI |
| `GET /api/tables` | Freshly rendered table HTML + stats + errors (no re-fetch) |
| `GET /api/data` | Raw `snapshot.json` |
| `POST /api/refresh` | Re-fetch everything now |
| `POST /api/tickers` | `{portfolio, symbol}` — validate, fetch immediately, add |
| `DELETE /api/tickers` | `{portfolio, symbol}` — remove |
| `GET` / `POST /api/schedule` | Read / write the two run times |
| `GET /api/status` | Current data version and last-run summary |
| `GET /api/stream` | Server-Sent Events feed of status changes |
| `GET /api/stock-info?symbol=...` | Fetch live stock price and company name for single ticker |
| `POST /api/stock-quotes` | Batch fetch live stock quotes and timestamps for multiple tickers |
| `GET /api/stock-status` | Get all saved stock status and scenario analysis entries |
| `POST /api/stock-status` | Add a new stock status / scenario entry |
| `PUT /api/stock-status/<id>` | Update an existing stock status entry |
| `DELETE /api/stock-status/<id>` | Delete a stock status entry |

## Known limitations

* **Live data only.** No historical or past-day view, no charts, no snapshot archive — by design.
* Data comes from the free Yahoo Finance endpoints via `yfinance`: quotes can be delayed, rate
  limited, or occasionally unavailable, and coverage of thinly traded BSE scrips is patchy.
* Weekly candles are resampled from daily bars (Friday-anchored). They match standard weekly charts
  but may differ marginally from a broker's own weekly series around holidays.
* EMAs are only as good as the available history: newly listed stocks cannot produce a meaningful
  200-week EMA, and such values are omitted or flagged.
* The Flask development server is used behind the pywebview desktop window — this is a **local,
  single-user tool**. It has no authentication and should not be exposed beyond `127.0.0.1`.
* The scheduler is Windows Task Scheduler; the app itself runs no internal timer, so scheduled
  refreshes require the machine to be on.
* Portfolio names are fixed to `BAPA` and `MADI` in this version.

## Planned features

This is an early version, intentionally modular so features can be layered on:

* Per-ticker notes, quantity/average price and simple P&amp;L columns.
* Configurable portfolios (add, rename or remove portfolios from the UI).
* Alerts — desktop or email notification when a price crosses a watched EMA.
* Sorting and filtering (e.g. "show only tickers below the 200 EMA").
* Additional indicators (RSI, ATR, volume averages) and monthly timeframe support.
* Optional historical snapshot archive and a "what changed since the last run" diff view.
* Pluggable data providers (NSE official API, broker APIs) as a fallback for `yfinance`.
* Export to CSV/Excel.
* Automated test suite with recorded `yfinance` fixtures.
