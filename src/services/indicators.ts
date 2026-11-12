import { OHLCV } from '../types/market';

/**
 * Simple Moving Average (SMA)
 */
export function calculateSMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j];
      }
      result.push(Number((sum / period).toFixed(2)));
    }
  }
  return result;
}

/**
 * Exponential Moving Average (EMA)
 */
export function calculateEMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const k = 2 / (period + 1);
  let prevEma: number | null = null;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      // First EMA is simple average
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j];
      }
      prevEma = sum / period;
      result.push(Number(prevEma.toFixed(2)));
    } else {
      const currentEma: number = data[i] * k + (prevEma as number) * (1 - k);
      prevEma = currentEma;
      result.push(Number(currentEma.toFixed(2)));
    }
  }
  return result;
}

/**
 * Relative Strength Index (RSI - 14 period default)
 */
export function calculateRSI(closes: number[], period = 14): (number | null)[] {
  const rsi: (number | null)[] = [];
  if (closes.length < period + 1) {
    return closes.map(() => null);
  }

  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? Math.abs(diff) : 0);
  }

  // First avg gain/loss
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // First period entries are null
  for (let i = 0; i < period; i++) {
    rsi.push(null);
  }

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsi.push(Number((100 - 100 / (1 + rs)).toFixed(2)));

  // Smoothed averages for remaining points
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    
    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const currentRs = avgGain / avgLoss;
      const val = 100 - 100 / (1 + currentRs);
      rsi.push(Number(val.toFixed(2)));
    }
  }

  return rsi;
}

/**
 * Bollinger Bands (period 20, multiplier 2)
 */
export function calculateBollingerBands(
  closes: number[],
  period = 20,
  stdDevMultiplier = 2
): {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
} {
  const middle = calculateSMA(closes, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < closes.length; i++) {
    const mid = middle[i];
    if (mid === null) {
      upper.push(null);
      lower.push(null);
    } else {
      let sumSquares = 0;
      for (let j = 0; j < period; j++) {
        sumSquares += Math.pow(closes[i - j] - mid, 2);
      }
      const stdDev = Math.sqrt(sumSquares / period);
      upper.push(Number((mid + stdDevMultiplier * stdDev).toFixed(2)));
      lower.push(Number((mid - stdDevMultiplier * stdDev).toFixed(2)));
    }
  }

  return { upper, middle, lower };
}

/**
 * Moving Average Convergence Divergence (MACD 12, 26, 9)
 */
export function calculateMACD(
  closes: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): {
  macdLine: (number | null)[];
  signalLine: (number | null)[];
  histogram: (number | null)[];
} {
  const emaFast = calculateEMA(closes, fastPeriod);
  const emaSlow = calculateEMA(closes, slowPeriod);
  
  const macdLine: (number | null)[] = [];
  const validMacdValues: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    const fast = emaFast[i];
    const slow = emaSlow[i];
    if (fast !== null && slow !== null) {
      const diff = Number((fast - slow).toFixed(3));
      macdLine.push(diff);
      validMacdValues.push(diff);
    } else {
      macdLine.push(null);
    }
  }

  const signalLineRaw = calculateEMA(validMacdValues, signalPeriod);
  const signalLine: (number | null)[] = [];
  const histogram: (number | null)[] = [];

  let validIdx = 0;
  for (let i = 0; i < closes.length; i++) {
    if (macdLine[i] === null) {
      signalLine.push(null);
      histogram.push(null);
    } else {
      const sig = signalLineRaw[validIdx];
      validIdx++;
      if (sig !== null) {
        signalLine.push(sig);
        histogram.push(Number(((macdLine[i] as number) - sig).toFixed(3)));
      } else {
        signalLine.push(null);
        histogram.push(null);
      }
    }
  }

  return { macdLine, signalLine, histogram };
}

/**
 * Volume Weighted Average Price (VWAP)
 */
export function calculateVWAP(data: OHLCV[]): (number | null)[] {
  const vwap: (number | null)[] = [];
  let cumTypicalPriceVol = 0;
  let cumVol = 0;

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const typicalPrice = (item.high + item.low + item.close) / 3;
    cumTypicalPriceVol += typicalPrice * item.volume;
    cumVol += item.volume;
    
    if (cumVol > 0) {
      vwap.push(Number((cumTypicalPriceVol / cumVol).toFixed(2)));
    } else {
      vwap.push(null);
    }
  }

  return vwap;
}
