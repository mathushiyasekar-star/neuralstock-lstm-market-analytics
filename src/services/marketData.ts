import { OHLCV, TickerInfo, Timeframe } from '../types/market';

export const INITIAL_TICKERS: TickerInfo[] = [
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    category: 'Semiconductors',
    price: 138.25,
    change: 4.82,
    changePercent: 3.61,
    high24h: 140.10,
    low24h: 134.50,
    volume24h: 48920000,
    marketCap: '$3.39T',
    peRatio: 52.4,
    beta: 1.68
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    category: 'Tech',
    price: 228.40,
    change: 1.15,
    changePercent: 0.51,
    high24h: 229.80,
    low24h: 226.70,
    volume24h: 38400000,
    marketCap: '$3.48T',
    peRatio: 34.2,
    beta: 1.05
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    category: 'Consumer',
    price: 328.60,
    change: -6.40,
    changePercent: -1.91,
    high24h: 339.20,
    low24h: 324.50,
    volume24h: 52100000,
    marketCap: '$1.05T',
    peRatio: 88.6,
    beta: 2.12
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    category: 'Tech',
    price: 422.10,
    change: 3.20,
    changePercent: 0.76,
    high24h: 424.50,
    low24h: 419.80,
    volume24h: 19800000,
    marketCap: '$3.14T',
    peRatio: 33.8,
    beta: 0.94
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    category: 'Tech',
    price: 182.75,
    change: 2.35,
    changePercent: 1.30,
    high24h: 184.20,
    low24h: 180.90,
    volume24h: 24500000,
    marketCap: '$2.26T',
    peRatio: 24.1,
    beta: 1.08
  },
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    category: 'Index',
    price: 594.30,
    change: 4.10,
    changePercent: 0.70,
    high24h: 595.60,
    low24h: 591.20,
    volume24h: 62400000,
    marketCap: '$580B',
    peRatio: 26.5,
    beta: 1.00
  },
  {
    symbol: 'QQQ',
    name: 'Invesco QQQ Trust (Nasdaq-100)',
    category: 'Index',
    price: 512.45,
    change: 5.80,
    changePercent: 1.14,
    high24h: 514.30,
    low24h: 508.90,
    volume24h: 41200000,
    marketCap: '$295B',
    peRatio: 31.0,
    beta: 1.18
  },
  {
    symbol: 'BTC-USD',
    name: 'Bitcoin',
    category: 'Crypto',
    price: 88450.00,
    change: 2350.00,
    changePercent: 2.73,
    high24h: 89800.00,
    low24h: 85900.00,
    volume24h: 38500000000,
    marketCap: '$1.74T',
    beta: 2.45
  }
];

// Deterministic Pseudo-random number generator for consistent historical data curves
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Generates realistic historical OHLCV data using Geometric Brownian Motion with Mean Reversion
 */
export function generateHistoricalData(
  symbol: string,
  timeframe: Timeframe,
  basePrice?: number
): OHLCV[] {
  const ticker = INITIAL_TICKERS.find((t) => t.symbol === symbol) || INITIAL_TICKERS[0];
  const targetCurrentPrice = basePrice || ticker.price;

  let pointsCount = 120;
  let daysSpan = 180;
  let stepDays = 1;

  switch (timeframe) {
    case '1D':
      pointsCount = 78; // 5-minute bars in trading day
      daysSpan = 1;
      stepDays = 1 / 78;
      break;
    case '1W':
      pointsCount = 84; // 1-hour bars across 7 days
      daysSpan = 7;
      stepDays = 7 / 84;
      break;
    case '1M':
      pointsCount = 60; // 4-hour bars across 30 days
      daysSpan = 30;
      stepDays = 30 / 60;
      break;
    case '3M':
      pointsCount = 90; // daily bars
      daysSpan = 90;
      stepDays = 1;
      break;
    case '6M':
      pointsCount = 126; // daily bars
      daysSpan = 180;
      stepDays = 180 / 126;
      break;
    case '1Y':
      pointsCount = 252; // daily trading bars in 1 yr
      daysSpan = 365;
      stepDays = 365 / 252;
      break;
    case '5Y':
      pointsCount = 260; // weekly bars in 5 yrs
      daysSpan = 1825;
      stepDays = 1825 / 260;
      break;
  }

  // Derive starting price backwards from current price with historical drift
  const symbolSeed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 100);
  const volatility = ticker.category === 'Crypto' ? 0.035 : ticker.category === 'Semiconductors' ? 0.022 : 0.015;
  const drift = 0.0003;

  const now = Date.now();
  const startTime = now - daysSpan * 24 * 60 * 60 * 1000;
  const timeStepMs = (now - startTime) / pointsCount;

  // Generate price path backwards or forwards then scale
  const rawCloses: number[] = [];
  let p = targetCurrentPrice * (timeframe === '5Y' ? 0.35 : timeframe === '1Y' ? 0.75 : 0.92);

  for (let i = 0; i < pointsCount; i++) {
    const seed = symbolSeed * 1000 + i;
    const r1 = pseudoRandom(seed);
    const r2 = pseudoRandom(seed + 1);
    // Box-Muller normal distribution
    const z = Math.sqrt(-2.0 * Math.log(Math.max(r1, 0.0001))) * Math.cos(2.0 * Math.PI * r2);
    
    // Mean reversion toward trend line
    const progress = i / pointsCount;
    const expected = targetCurrentPrice * (0.8 + 0.2 * progress);
    const reversion = (expected - p) * 0.03;

    p = Math.max(1, p * (1 + drift + volatility * z) + reversion);
    rawCloses.push(p);
  }

  // Rescale last close to accurately hit targetCurrentPrice
  const lastRaw = rawCloses[rawCloses.length - 1];
  const scale = targetCurrentPrice / (lastRaw || 1);

  const data: OHLCV[] = [];

  for (let i = 0; i < pointsCount; i++) {
    const tMs = startTime + i * timeStepMs;
    const dateObj = new Date(tMs);
    const dateStr = timeframe === '1D' || timeframe === '1W'
      ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : dateObj.toISOString().split('T')[0];

    const close = Number((rawCloses[i] * scale).toFixed(2));
    const prevClose = i > 0 ? data[i - 1].close : close * 0.995;
    
    const seed = symbolSeed * 2000 + i;
    const intraVar = volatility * 0.7;
    const high = Number((Math.max(close, prevClose) * (1 + Math.abs(pseudoRandom(seed)) * intraVar)).toFixed(2));
    const low = Number((Math.min(close, prevClose) * (1 - Math.abs(pseudoRandom(seed + 5)) * intraVar)).toFixed(2));
    const open = Number((prevClose + (pseudoRandom(seed + 10) - 0.5) * (high - low) * 0.4).toFixed(2));

    const baseVol = ticker.volume24h / (timeframe === '1D' ? 78 : 1);
    const volume = Math.floor(baseVol * (0.6 + pseudoRandom(seed + 15) * 0.8));

    data.push({
      time: dateStr,
      timestamp: tMs,
      open: Math.min(high, Math.max(low, open)),
      high,
      low,
      close,
      volume
    });
  }

  // Ensure last point is strictly targetCurrentPrice
  data[data.length - 1].close = targetCurrentPrice;

  return data;
}
