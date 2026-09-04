// Generated columns list from col.jsx
export const SCREENER_CATEGORIES = [
  "Equity",
  "Price",
  "Signal",
  "Volume",
  "Moving Averages",
  "Technical",
  "Supertrend",
  "52 Week",
  "Breakouts",
  "Performance",
  "Fundamental",
  "Volatility",
  "Short Selling",
  "Deals",
  "Price Action",
  "Trend",
  "Setup",
  "Pivot Levels"
];

export const SCREENER_COLUMNS = [
  {
    "key": "series",
    "label": "Series",
    "category": "Equity",
    "defaultVisible": false,
    "format": "number"
  },
  {
    "key": "close",
    "label": "Price",
    "category": "Price",
    "defaultVisible": true,
    "format": "currency"
  },
  {
    "key": "open",
    "label": "Open",
    "category": "Price",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "high",
    "label": "High",
    "category": "Price",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "low",
    "label": "Low",
    "category": "Price",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "prev_close",
    "label": "Prev Close",
    "category": "Price",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "pct_change",
    "label": "Change %",
    "category": "Price",
    "defaultVisible": true,
    "format": "number"
  },
  {
    "key": "avg_price",
    "label": "Avg Price",
    "category": "Price",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "signal",
    "label": "Signal",
    "category": "Signal",
    "defaultVisible": true,
    "format": "signal"
  },
  {
    "key": "volume",
    "label": "Volume",
    "category": "Volume",
    "defaultVisible": true,
    "format": "integer"
  },
  {
    "key": "traded_value",
    "label": "Turnover",
    "category": "Volume",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "total_trades",
    "label": "Trades",
    "category": "Volume",
    "defaultVisible": false,
    "format": "integer"
  },
  {
    "key": "delivery_percent",
    "label": "Delivery %",
    "category": "Volume",
    "defaultVisible": false,
    "format": "percent"
  },
  {
    "key": "delivery_qty",
    "label": "Del Qty",
    "category": "Volume",
    "defaultVisible": false,
    "format": "integer"
  },
  {
    "key": "avg_volume_20",
    "label": "AvgVol 20",
    "category": "Volume",
    "defaultVisible": false,
    "format": "integer"
  },
  {
    "key": "volume_ratio_20",
    "label": "RVOL",
    "category": "Volume",
    "defaultVisible": false,
    "format": "number"
  },
  {
    "key": "volume_change_pct",
    "label": "Vol Chg %",
    "category": "Volume",
    "defaultVisible": false,
    "format": "percent"
  },
  {
    "key": "volume_rising_3",
    "label": "Vol Rise 3D",
    "category": "Volume",
    "defaultVisible": false,
    "format": "boolean_flag"
  },
  {
    "key": "volume_rising_5",
    "label": "Vol Rise 5D",
    "category": "Volume",
    "defaultVisible": false,
    "format": "boolean_flag"
  },
  {
    "key": "is_highest_vol_20",
    "label": "HighVol 20D",
    "category": "Volume",
    "defaultVisible": false,
    "format": "boolean_flag"
  },
  {
    "key": "is_highest_vol_50",
    "label": "HighVol 50D",
    "category": "Volume",
    "defaultVisible": false,
    "format": "boolean_flag"
  },
  {
    "key": "is_highest_vol_252",
    "label": "HighVol 252D",
    "category": "Volume",
    "defaultVisible": false,
    "format": "boolean_flag"
  },
  {
    "key": "is_highest_turnover_20",
    "label": "HighTurn 20D",
    "category": "Volume",
    "defaultVisible": false,
    "format": "boolean_flag"
  },
  {
    "key": "delivery_rising_3",
    "label": "Del Rise 3D",
    "category": "Volume",
    "defaultVisible": false,
    "format": "boolean_flag"
  },
  {
    "key": "delivery_rising_5",
    "label": "Del Rise 5D",
    "category": "Volume",
    "defaultVisible": false,
    "format": "boolean_flag"
  },
  {
    "key": "volume_trend",
    "label": "Vol Trend",
    "category": "Volume",
    "defaultVisible": false,
    "format": "badge"
  },
  {
    "key": "volume_breakout",
    "label": "Vol Breakout",
    "category": "Volume",
    "defaultVisible": false,
    "format": "badge"
  },
  {
    "key": "avg_volume_5",
    "label": "AvgVol 5",
    "category": "Volume",
    "defaultVisible": false,
    "format": "integer"
  },
  {
    "key": "avg_volume_10",
    "label": "AvgVol 10",
    "category": "Volume",
    "defaultVisible": false,
    "format": "integer"
  },
  {
    "key": "avg_volume_50",
    "label": "AvgVol 50",
    "category": "Volume",
    "defaultVisible": false,
    "format": "integer"
  },
  {
    "key": "avg_turnover_20",
    "label": "AvgTurn 20",
    "category": "Volume",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "avg_turnover_50",
    "label": "AvgTurn 50",
    "category": "Volume",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "sma_5",
    "label": "SMA 5",
    "category": "Moving Averages",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "sma_10",
    "label": "SMA 10",
    "category": "Moving Averages",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "sma_20",
    "label": "SMA 20",
    "category": "Moving Averages",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "sma_50",
    "label": "SMA 50",
    "category": "Moving Averages",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "sma_100",
    "label": "SMA 100",
    "category": "Moving Averages",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "sma_200",
    "label": "SMA 200",
    "category": "Moving Averages",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "ema_20",
    "label": "EMA 20",
    "category": "Moving Averages",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "ema_50",
    "label": "EMA 50",
    "category": "Moving Averages",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "ema_100",
    "label": "EMA 100",
    "category": "Moving Averages",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "ema_200",
    "label": "EMA 200",
    "category": "Moving Averages",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "ma_trend",
    "label": "MA Trend",
    "category": "Moving Averages",
    "defaultVisible": false,
    "format": "number"
  },
  {
    "key": "ma_signal",
    "label": "MA Signal",
    "category": "Moving Averages",
    "defaultVisible": false,
    "format": "signal"
  },
  {
    "key": "ema_5",
    "label": "EMA 5",
    "category": "Moving Averages",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "ema_9",
    "label": "EMA 9",
    "category": "Moving Averages",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "ema_10",
    "label": "EMA 10",
    "category": "Moving Averages",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "price_vs_sma_20",
    "label": "Price vs SMA20",
    "category": "Moving Averages",
    "defaultVisible": false,
    "format": "number"
  },
  {
    "key": "price_vs_sma_50",
    "label": "Price vs SMA50",
    "category": "Moving Averages",
    "defaultVisible": false,
    "format": "number"
  },
  {
    "key": "price_vs_sma_200",
    "label": "Price vs SMA200",
    "category": "Moving Averages",
    "defaultVisible": false,
    "format": "number"
  },
  {
    "key": "rsi_14",
    "label": "RSI",
    "category": "Technical",
    "defaultVisible": true,
    "format": "number"
  },
  {
    "key": "rsi_7",
    "label": "RSI 7",
    "category": "Technical",
    "defaultVisible": false,
    "format": "number"
  },
  {
    "key": "macd",
    "label": "MACD",
    "category": "Technical",
    "defaultVisible": true,
    "format": "number"
  },
  {
    "key": "macd_signal",
    "label": "MACD Signal",
    "category": "Technical",
    "defaultVisible": true,
    "format": "number"
  },
  {
    "key": "macd_histogram",
    "label": "MACD Hist",
    "category": "Technical",
    "defaultVisible": false,
    "format": "number"
  },
  {
    "key": "adx_14",
    "label": "ADX",
    "category": "Technical",
    "defaultVisible": true,
    "format": "number"
  },
  {
    "key": "adx_plus_di",
    "label": "+DI",
    "category": "Technical",
    "defaultVisible": false,
    "format": "number"
  },
  {
    "key": "adx_minus_di",
    "label": "-DI",
    "category": "Technical",
    "defaultVisible": false,
    "format": "number"
  },
  {
    "key": "atr_14",
    "label": "ATR 14",
    "category": "Technical",
    "defaultVisible": false,
    "format": "number"
  },
  {
    "key": "atr_percent",
    "label": "ATR %",
    "category": "Technical",
    "defaultVisible": true,
    "format": "percent"
  },
  {
    "key": "stochastic",
    "label": "Stoch %K",
    "category": "Technical",
    "defaultVisible": false,
    "format": "number"
  },
  {
    "key": "stochastic_d",
    "label": "Stoch %D",
    "category": "Technical",
    "defaultVisible": false,
    "format": "number"
  },
  {
    "key": "bb_upper",
    "label": "BB Upper",
    "category": "Technical",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "bb_lower",
    "label": "BB Lower",
    "category": "Technical",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "bb_bandwidth",
    "label": "BB Width %",
    "category": "Technical",
    "defaultVisible": false,
    "format": "percent"
  },
  {
    "key": "bb_pct_b",
    "label": "BB %B",
    "category": "Technical",
    "defaultVisible": false,
    "format": "percent"
  },
  {
    "key": "momentum",
    "label": "Momentum",
    "category": "Technical",
    "defaultVisible": false,
    "format": "percent"
  },
  {
    "key": "roc",
    "label": "ROC",
    "category": "Technical",
    "defaultVisible": false,
    "format": "percent"
  },
  {
    "key": "rsi_zone",
    "label": "RSI Zone",
    "category": "Technical",
    "defaultVisible": false,
    "format": "badge"
  },
  {
    "key": "rsi_change",
    "label": "RSI Change",
    "category": "Technical",
    "defaultVisible": false,
    "format": "number"
  },
  {
    "key": "rsi_trend",
    "label": "RSI Trend",
    "category": "Technical",
    "defaultVisible": false,
    "format": "badge"
  },
  {
    "key": "di_diff",
    "label": "DI Diff",
    "category": "Technical",
    "defaultVisible": false,
    "format": "number"
  },
  {
    "key": "adx_trend",
    "label": "ADX Trend",
    "category": "Technical",
    "defaultVisible": false,
    "format": "number"
  },
  {
    "key": "bb_middle",
    "label": "BB Middle",
    "category": "Technical",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "supertrend",
    "label": "Supertrend",
    "category": "Supertrend",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "supertrend_dir",
    "label": "ST Dir",
    "category": "Supertrend",
    "defaultVisible": false,
    "format": "st_dir"
  },
  {
    "key": "st_direction",
    "label": "ST Direction",
    "category": "Supertrend",
    "defaultVisible": false,
    "format": "badge"
  },
  {
    "key": "st_signal",
    "label": "ST Signal",
    "category": "Supertrend",
    "defaultVisible": false,
    "format": "signal"
  },
  {
    "key": "price_vs_supertrend",
    "label": "Price vs ST",
    "category": "Supertrend",
    "defaultVisible": false,
    "format": "badge"
  },
  {
    "key": "st_period",
    "label": "ST Period",
    "category": "Supertrend",
    "defaultVisible": false,
    "format": "number"
  },
  {
    "key": "st_multiplier",
    "label": "ST Multiplier",
    "category": "Supertrend",
    "defaultVisible": false,
    "format": "number"
  },
  {
    "key": "high52",
    "label": "52W High",
    "category": "52 Week",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "low52",
    "label": "52W Low",
    "category": "52 Week",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "dist_52w_high",
    "label": "Dist 52W H",
    "category": "52 Week",
    "defaultVisible": false,
    "format": "percent"
  },
  {
    "key": "dist_52w_low",
    "label": "Dist 52W L",
    "category": "52 Week",
    "defaultVisible": false,
    "format": "percent"
  },
  {
    "key": "pos_52w",
    "label": "52W Pos %",
    "category": "52 Week",
    "defaultVisible": false,
    "format": "percent"
  },
  {
    "key": "new_52w_high",
    "label": "New 52WH",
    "category": "52 Week",
    "defaultVisible": false,
    "format": "boolean_flag"
  },
  {
    "key": "new_52w_low",
    "label": "New 52WL",
    "category": "52 Week",
    "defaultVisible": false,
    "format": "boolean_flag"
  },
  {
    "key": "high_20",
    "label": "20D High",
    "category": "Breakouts",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "low_20",
    "label": "20D Low",
    "category": "Breakouts",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "high_50",
    "label": "50D High",
    "category": "Breakouts",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "low_50",
    "label": "50D Low",
    "category": "Breakouts",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "high_100",
    "label": "100D High",
    "category": "Breakouts",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "low_100",
    "label": "100D Low",
    "category": "Breakouts",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "high_200",
    "label": "200D High",
    "category": "Breakouts",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "low_200",
    "label": "200D Low",
    "category": "Breakouts",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "high_252",
    "label": "252D High",
    "category": "Breakouts",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "low_252",
    "label": "252D Low",
    "category": "Breakouts",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "breakout_type",
    "label": "Breakout Type",
    "category": "Breakouts",
    "defaultVisible": false,
    "format": "number"
  },
  {
    "key": "breakout_price",
    "label": "Breakout Price",
    "category": "Breakouts",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "breakout_pct",
    "label": "Breakout %",
    "category": "Breakouts",
    "defaultVisible": false,
    "format": "percent"
  },
  {
    "key": "breakout_strength",
    "label": "Breakout Str",
    "category": "Breakouts",
    "defaultVisible": false,
    "format": "number"
  },
  {
    "key": "perf_1d",
    "label": "1D %",
    "category": "Performance",
    "defaultVisible": true,
    "format": "percent"
  },
  {
    "key": "perf_1w",
    "label": "1W %",
    "category": "Performance",
    "defaultVisible": true,
    "format": "percent"
  },
  {
    "key": "perf_1m",
    "label": "1M %",
    "category": "Performance",
    "defaultVisible": true,
    "format": "percent"
  },
  {
    "key": "perf_3m",
    "label": "3M %",
    "category": "Performance",
    "defaultVisible": false,
    "format": "percent"
  },
  {
    "key": "perf_6m",
    "label": "6M %",
    "category": "Performance",
    "defaultVisible": false,
    "format": "percent"
  },
  {
    "key": "perf_1y",
    "label": "1Y %",
    "category": "Performance",
    "defaultVisible": true,
    "format": "percent"
  },
  {
    "key": "perf_3y",
    "label": "3Y %",
    "category": "Performance",
    "defaultVisible": false,
    "format": "percent"
  },
  {
    "key": "perf_5y",
    "label": "5Y %",
    "category": "Performance",
    "defaultVisible": false,
    "format": "percent"
  },
  {
    "key": "ytd_return",
    "label": "YTD %",
    "category": "Performance",
    "defaultVisible": false,
    "format": "percent"
  },
  {
    "key": "pe_ratio",
    "label": "PE",
    "category": "Fundamental",
    "defaultVisible": false,
    "format": "number"
  },
  {
    "key": "adjusted_pe",
    "label": "Adj PE",
    "category": "Fundamental",
    "defaultVisible": false,
    "format": "number"
  },
  {
    "key": "daily_volatility",
    "label": "Daily Vol",
    "category": "Volatility",
    "defaultVisible": false,
    "format": "percent"
  },
  {
    "key": "annualised_volatility",
    "label": "Ann Vol",
    "category": "Volatility",
    "defaultVisible": false,
    "format": "percent"
  },
  {
    "key": "hist_volatility_20",
    "label": "HistVol 20",
    "category": "Volatility",
    "defaultVisible": false,
    "format": "percent"
  },
  {
    "key": "daily_range_pct",
    "label": "Range %",
    "category": "Volatility",
    "defaultVisible": false,
    "format": "percent"
  },
  {
    "key": "gap_pct",
    "label": "Gap %",
    "category": "Volatility",
    "defaultVisible": false,
    "format": "percent"
  },
  {
    "key": "range_pct_5",
    "label": "5D Range %",
    "category": "Volatility",
    "defaultVisible": false,
    "format": "number"
  },
  {
    "key": "range_pct_10",
    "label": "10D Range %",
    "category": "Volatility",
    "defaultVisible": false,
    "format": "number"
  },
  {
    "key": "range_pct_20",
    "label": "20D Range %",
    "category": "Volatility",
    "defaultVisible": false,
    "format": "number"
  },
  {
    "key": "close_near_high_pct",
    "label": "Close in Range",
    "category": "Volatility",
    "defaultVisible": false,
    "format": "percent"
  },
  {
    "key": "volatility_rank",
    "label": "Vol Rank",
    "category": "Volatility",
    "defaultVisible": false,
    "format": "badge"
  },
  {
    "key": "short_qty",
    "label": "Short Qty",
    "category": "Short Selling",
    "defaultVisible": false,
    "format": "integer"
  },
  {
    "key": "short_value",
    "label": "Short Value",
    "category": "Short Selling",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "block_deal_count",
    "label": "Block",
    "category": "Deals",
    "defaultVisible": false,
    "format": "integer"
  },
  {
    "key": "bulk_deal_count",
    "label": "Bulk",
    "category": "Deals",
    "defaultVisible": false,
    "format": "integer"
  },
  {
    "key": "bullish_engulfing",
    "label": "Bull Engulf",
    "category": "Price Action",
    "defaultVisible": false,
    "format": "boolean_flag"
  },
  {
    "key": "bearish_engulfing",
    "label": "Bear Engulf",
    "category": "Price Action",
    "defaultVisible": false,
    "format": "boolean_flag"
  },
  {
    "key": "hammer",
    "label": "Hammer",
    "category": "Price Action",
    "defaultVisible": false,
    "format": "boolean_flag"
  },
  {
    "key": "shooting_star",
    "label": "Shoot Star",
    "category": "Price Action",
    "defaultVisible": false,
    "format": "boolean_flag"
  },
  {
    "key": "inside_day",
    "label": "Inside Day",
    "category": "Price Action",
    "defaultVisible": false,
    "format": "boolean_flag"
  },
  {
    "key": "outside_day",
    "label": "Outside Day",
    "category": "Price Action",
    "defaultVisible": false,
    "format": "boolean_flag"
  },
  {
    "key": "nr4",
    "label": "NR4",
    "category": "Price Action",
    "defaultVisible": false,
    "format": "boolean_flag"
  },
  {
    "key": "nr7",
    "label": "NR7",
    "category": "Price Action",
    "defaultVisible": false,
    "format": "boolean_flag"
  },
  {
    "key": "upper_circuit",
    "label": "Upper Circ",
    "category": "Price Action",
    "defaultVisible": false,
    "format": "boolean_flag"
  },
  {
    "key": "lower_circuit",
    "label": "Lower Circ",
    "category": "Price Action",
    "defaultVisible": false,
    "format": "boolean_flag"
  },
  {
    "key": "higher_high",
    "label": "Higher High",
    "category": "Price Action",
    "defaultVisible": false,
    "format": "boolean_flag"
  },
  {
    "key": "higher_low",
    "label": "Higher Low",
    "category": "Price Action",
    "defaultVisible": false,
    "format": "boolean_flag"
  },
  {
    "key": "lower_high",
    "label": "Lower High",
    "category": "Price Action",
    "defaultVisible": false,
    "format": "boolean_flag"
  },
  {
    "key": "lower_low",
    "label": "Lower Low",
    "category": "Price Action",
    "defaultVisible": false,
    "format": "boolean_flag"
  },
  {
    "key": "trend_direction",
    "label": "Trend",
    "category": "Trend",
    "defaultVisible": false,
    "format": "badge"
  },
  {
    "key": "trend_strength",
    "label": "Trend Strength",
    "category": "Trend",
    "defaultVisible": false,
    "format": "badge"
  },
  {
    "key": "setup",
    "label": "Setup",
    "category": "Setup",
    "defaultVisible": false,
    "format": "number"
  },
  {
    "key": "setup_strength",
    "label": "Setup Strength",
    "category": "Setup",
    "defaultVisible": false,
    "format": "badge"
  },
  {
    "key": "bearish_setup",
    "label": "Bearish Setup",
    "category": "Setup",
    "defaultVisible": false,
    "format": "number"
  },
  {
    "key": "confirmation_count",
    "label": "Confirmations",
    "category": "Setup",
    "defaultVisible": false,
    "format": "number"
  },
  {
    "key": "pivot",
    "label": "Pivot",
    "category": "Pivot Levels",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "r1",
    "label": "R1",
    "category": "Pivot Levels",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "r2",
    "label": "R2",
    "category": "Pivot Levels",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "r3",
    "label": "R3",
    "category": "Pivot Levels",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "s1",
    "label": "S1",
    "category": "Pivot Levels",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "s2",
    "label": "S2",
    "category": "Pivot Levels",
    "defaultVisible": false,
    "format": "currency"
  },
  {
    "key": "s3",
    "label": "S3",
    "category": "Pivot Levels",
    "defaultVisible": false,
    "format": "currency"
  }
];

export const DEFAULT_VISIBLE_COLUMNS = [
  'pct_change',
  'signal',
  'volume',
  'rsi_14',
  'macd',
  'macd_signal',
  'adx_14',
  'atr_percent',
  'perf_1d',
  'perf_1w',
  'perf_1m',
  'perf_1y'
];
