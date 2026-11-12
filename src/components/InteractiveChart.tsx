import React, { useEffect, useRef, useState, useMemo } from 'react';
import { ChartType, IndicatorToggles, OHLCV, PredictionResult, Timeframe } from '../types/market';
import { calculateBollingerBands, calculateEMA, calculateMACD, calculateRSI, calculateSMA } from '../services/indicators';
import { Maximize2, Minimize2, TrendingUp, BarChart2, Activity } from 'lucide-react';

interface InteractiveChartProps {
  symbol: string;
  data: OHLCV[];
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  indicators: IndicatorToggles;
  predictionResult: PredictionResult | null;
  onToggleIndicator: (key: keyof IndicatorToggles) => void;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  symbol,
  data,
  timeframe,
  onTimeframeChange,
  indicators,
  predictionResult,
  onToggleIndicator,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Compute indicators
  const closes = useMemo(() => data.map((d) => d.close), [data]);
  const sma20 = useMemo(() => indicators.sma20 ? calculateSMA(closes, 20) : [], [closes, indicators.sma20]);
  const sma50 = useMemo(() => indicators.sma50 ? calculateSMA(closes, 50) : [], [closes, indicators.sma50]);
  const ema20 = useMemo(() => indicators.ema20 ? calculateEMA(closes, 20) : [], [closes, indicators.ema20]);
  const bb = useMemo(() => indicators.bollingerBands ? calculateBollingerBands(closes, 20, 2) : null, [closes, indicators.bollingerBands]);
  const rsi = useMemo(() => indicators.rsi ? calculateRSI(closes, 14) : [], [closes, indicators.rsi]);
  const macd = useMemo(() => indicators.macd ? calculateMACD(closes) : null, [closes, indicators.macd]);

  // Combined data including future forecast if active
  const forecastPoints = useMemo(() => {
    if (!indicators.lstmForecast || !predictionResult || predictionResult.symbol !== symbol) return [];
    return predictionResult.futureDates.map((date, idx) => ({
      time: date,
      timestamp: new Date(date).getTime(),
      open: predictionResult.forecastPrices[idx],
      high: predictionResult.forecastUpper[idx],
      low: predictionResult.forecastLower[idx],
      close: predictionResult.forecastPrices[idx],
      volume: 0,
      predictedClose: predictionResult.forecastPrices[idx],
      predictedLower: predictionResult.forecastLower[idx],
      predictedUpper: predictionResult.forecastUpper[idx],
    }));
  }, [indicators.lstmForecast, predictionResult, symbol]);

  const allDisplayData = useMemo(() => {
    return [...data, ...forecastPoints];
  }, [data, forecastPoints]);

  // Active hover point data
  const currentHoverItem = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < allDisplayData.length
    ? allDisplayData[hoverIndex]
    : allDisplayData[allDisplayData.length - 1];

  // Draw chart on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current || allDisplayData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Layout partitioning: Main chart, Volume (bottom of main), Subpanels (RSI, MACD)
    const padding = { top: 24, right: 65, bottom: 28, left: 16 };
    const hasSubpanel = indicators.rsi || indicators.macd;
    const subpanelCount = (indicators.rsi ? 1 : 0) + (indicators.macd ? 1 : 0);
    const subpanelHeight = hasSubpanel ? Math.min(90, (height * 0.28) / subpanelCount) : 0;
    const totalSubHeight = subpanelHeight * subpanelCount;

    const mainTop = padding.top;
    const mainBottom = height - padding.bottom - totalSubHeight - (hasSubpanel ? 14 : 0);
    const mainHeight = mainBottom - mainTop;
    const chartWidth = width - padding.left - padding.right;

    // Price scaling bounds
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    for (const item of allDisplayData) {
      minPrice = Math.min(minPrice, item.low);
      maxPrice = Math.max(maxPrice, item.high);
    }

    // Include indicators in min/max bounds
    if (bb) {
      for (const val of bb.lower) if (val !== null) minPrice = Math.min(minPrice, val);
      for (const val of bb.upper) if (val !== null) maxPrice = Math.max(maxPrice, val);
    }

    // Add 4% vertical breathing headroom
    const priceMargin = (maxPrice - minPrice) * 0.05 || 1;
    minPrice -= priceMargin;
    maxPrice += priceMargin;
    const priceRange = maxPrice - minPrice;

    // Maximum volume for sub-bar scaling
    let maxVolume = 1;
    for (const item of data) {
      if (item.volume > maxVolume) maxVolume = item.volume;
    }

    const n = allDisplayData.length;
    const barWidth = Math.max(2, (chartWidth / n) * 0.72);
    const stepX = chartWidth / (n - 1 || 1);

    const getY = (price: number) => {
      return mainBottom - ((price - minPrice) / priceRange) * mainHeight;
    };

    const getX = (idx: number) => {
      return padding.left + idx * stepX;
    };

    // Draw Subtle Grid Lines & Price Ticks
    const gridRows = 5;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.fillStyle = '#64748b';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'left';

    for (let i = 0; i <= gridRows; i++) {
      const y = mainTop + (mainHeight / gridRows) * i;
      const priceAtY = maxPrice - (i / gridRows) * priceRange;

      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Right axis price label
      ctx.fillText(`$${priceAtY.toFixed(priceAtY >= 1000 ? 0 : 2)}`, width - padding.right + 8, y + 4);
    }

    // Vertical Date Grid & Labels
    const dateInterval = Math.max(1, Math.floor(n / 6));
    ctx.textAlign = 'center';
    for (let i = 0; i < n; i += dateInterval) {
      const x = getX(i);
      ctx.beginPath();
      ctx.moveTo(x, mainTop);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();

      ctx.fillText(allDisplayData[i].time, x, height - 8);
    }

    // Draw Volume Bars (stacked subtly in bottom 25% of main area)
    const volAreaHeight = mainHeight * 0.22;
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const x = getX(i);
      const vHeight = (item.volume / maxVolume) * volAreaHeight;
      const vY = mainBottom - vHeight;
      const isUp = item.close >= item.open;

      ctx.fillStyle = isUp ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
      ctx.fillRect(x - barWidth / 2, vY, barWidth, vHeight);
    }

    // Draw Bollinger Bands (Cloud & Lines)
    if (bb && indicators.bollingerBands) {
      ctx.fillStyle = 'rgba(59, 130, 246, 0.06)';
      ctx.beginPath();
      let started = false;

      for (let i = 0; i < data.length; i++) {
        if (bb.upper[i] !== null) {
          const x = getX(i);
          const y = getY(bb.upper[i] as number);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }

      for (let i = data.length - 1; i >= 0; i--) {
        if (bb.lower[i] !== null) {
          const x = getX(i);
          const y = getY(bb.lower[i] as number);
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();

      // Upper & Lower boundary lines
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.4)';
      ctx.setLineDash([3, 3]);

      ctx.beginPath();
      for (let i = 0; i < data.length; i++) {
        if (bb.upper[i] !== null) {
          const x = getX(i);
          const y = getY(bb.upper[i] as number);
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      ctx.beginPath();
      for (let i = 0; i < data.length; i++) {
        if (bb.lower[i] !== null) {
          const x = getX(i);
          const y = getY(bb.lower[i] as number);
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Price Series (Candlestick or Line)
    if (chartType === 'candlestick') {
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const x = getX(i);
        const isUp = item.close >= item.open;
        const color = isUp ? '#10b981' : '#ef4444';

        // High-low wick
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, getY(item.high));
        ctx.lineTo(x, getY(item.low));
        ctx.stroke();

        // Open-close candle body
        const yOpen = getY(item.open);
        const yClose = getY(item.close);
        const bodyY = Math.min(yOpen, yClose);
        const bodyHeight = Math.max(1.5, Math.abs(yClose - yOpen));

        ctx.fillStyle = color;
        ctx.fillRect(x - barWidth / 2, bodyY, barWidth, bodyHeight);
      }
    } else {
      // Line Chart with smooth gradient fill
      const grad = ctx.createLinearGradient(0, mainTop, 0, mainBottom);
      grad.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

      ctx.beginPath();
      ctx.moveTo(getX(0), getY(data[0].close));
      for (let i = 1; i < data.length; i++) {
        ctx.lineTo(getX(i), getY(data[i].close));
      }
      ctx.lineTo(getX(data.length - 1), mainBottom);
      ctx.lineTo(getX(0), mainBottom);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Stroke line
      ctx.beginPath();
      ctx.moveTo(getX(0), getY(data[0].close));
      for (let i = 1; i < data.length; i++) {
        ctx.lineTo(getX(i), getY(data[i].close));
      }
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw Moving Averages
    const drawLineIndicator = (values: (number | null)[], strokeColor: string) => {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      let first = true;
      for (let i = 0; i < data.length; i++) {
        const val = values[i];
        if (val !== null && val !== undefined) {
          const x = getX(i);
          const y = getY(val);
          if (first) {
            ctx.moveTo(x, y);
            first = false;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
    };

    if (indicators.sma20) drawLineIndicator(sma20, '#f59e0b');
    if (indicators.sma50) drawLineIndicator(sma50, '#38bdf8');
    if (indicators.ema20) drawLineIndicator(ema20, '#a855f7');

    // Draw LSTM Future Forecast & Confidence Cone
    if (indicators.lstmForecast && forecastPoints.length > 0 && predictionResult) {
      const startIdx = data.length - 1;
      const startX = getX(startIdx);
      const startY = getY(data[data.length - 1].close);

      // Shaded 95% Confidence Interval Cone
      ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
      ctx.beginPath();
      ctx.moveTo(startX, startY);

      for (let i = 0; i < forecastPoints.length; i++) {
        const x = getX(startIdx + 1 + i);
        const yUpper = getY(forecastPoints[i].predictedUpper || forecastPoints[i].high);
        ctx.lineTo(x, yUpper);
      }

      for (let i = forecastPoints.length - 1; i >= 0; i--) {
        const x = getX(startIdx + 1 + i);
        const yLower = getY(forecastPoints[i].predictedLower || forecastPoints[i].low);
        ctx.lineTo(x, yLower);
      }

      ctx.closePath();
      ctx.fill();

      // Forecast Trajectory Line (Emerald dashed line)
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(startX, startY);

      for (let i = 0; i < forecastPoints.length; i++) {
        const x = getX(startIdx + 1 + i);
        const y = getY(forecastPoints[i].close);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw forecast marker dots
      for (let i = 0; i < forecastPoints.length; i++) {
        const x = getX(startIdx + 1 + i);
        const y = getY(forecastPoints[i].close);
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw Subpanels (RSI & MACD)
    let currentSubTop = mainBottom + 16;

    if (indicators.rsi && rsi.length > 0) {
      const subBottom = currentSubTop + subpanelHeight - 10;
      const rsiRange = 100;
      const getRsiY = (val: number) => subBottom - (val / rsiRange) * (subpanelHeight - 14);

      // Background border
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
      ctx.strokeRect(padding.left, currentSubTop, chartWidth, subpanelHeight - 10);

      // 70 / 30 reference thresholds
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(padding.left, getRsiY(70));
      ctx.lineTo(width - padding.right, getRsiY(70));
      ctx.stroke();

      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.beginPath();
      ctx.moveTo(padding.left, getRsiY(30));
      ctx.lineTo(width - padding.right, getRsiY(30));
      ctx.stroke();
      ctx.setLineDash([]);

      // RSI Label & Value
      ctx.fillStyle = '#f43f5e';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      const lastRsi = rsi[rsi.length - 1];
      ctx.fillText(`RSI (14): ${lastRsi !== null ? lastRsi.toFixed(1) : '--'}`, padding.left + 8, currentSubTop + 14);

      // RSI Curve
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < data.length; i++) {
        const val = rsi[i];
        if (val !== null) {
          const x = getX(i);
          const y = getRsiY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();

      currentSubTop += subpanelHeight;
    }

    if (indicators.macd && macd) {
      const subBottom = currentSubTop + subpanelHeight - 10;
      // Find min/max MACD values
      let macdMax = 0.5;
      for (let i = 0; i < data.length; i++) {
        if (macd.macdLine[i] !== null) macdMax = Math.max(macdMax, Math.abs(macd.macdLine[i] as number));
        if (macd.histogram[i] !== null) macdMax = Math.max(macdMax, Math.abs(macd.histogram[i] as number));
      }

      const getMacdY = (val: number) => {
        const mid = currentSubTop + (subpanelHeight - 10) / 2;
        return mid - (val / (macdMax * 1.2)) * ((subpanelHeight - 14) / 2);
      };

      // Border & zero line
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
      ctx.strokeRect(padding.left, currentSubTop, chartWidth, subpanelHeight - 10);

      const zeroY = getMacdY(0);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
      ctx.beginPath();
      ctx.moveTo(padding.left, zeroY);
      ctx.lineTo(width - padding.right, zeroY);
      ctx.stroke();

      // Histogram bars
      for (let i = 0; i < data.length; i++) {
        const hist = macd.histogram[i];
        if (hist !== null) {
          const x = getX(i);
          const y = getMacdY(hist);
          const h = Math.abs(y - zeroY);
          ctx.fillStyle = hist >= 0 ? '#10b981' : '#ef4444';
          ctx.fillRect(x - barWidth / 2, Math.min(y, zeroY), barWidth, Math.max(1, h));
        }
      }

      // MACD Line
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < data.length; i++) {
        const val = macd.macdLine[i];
        if (val !== null) {
          const x = getX(i);
          const y = getMacdY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();

      // Signal Line
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      started = false;
      for (let i = 0; i < data.length; i++) {
        const val = macd.signalLine[i];
        if (val !== null) {
          const x = getX(i);
          const y = getMacdY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();

      // Label
      ctx.fillStyle = '#38bdf8';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('MACD (12, 26, 9)', padding.left + 8, currentSubTop + 14);
    }

    // Crosshair rendering
    if (mousePos && hoverIndex !== null && hoverIndex >= 0 && hoverIndex < n) {
      const crossX = getX(hoverIndex);
      const crossY = Math.max(mainTop, Math.min(mainBottom, mousePos.y));

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // Vertical line across entire canvas
      ctx.beginPath();
      ctx.moveTo(crossX, mainTop);
      ctx.lineTo(crossX, height - padding.bottom);
      ctx.stroke();

      // Horizontal line in main chart area
      if (mousePos.y <= mainBottom) {
        ctx.beginPath();
        ctx.moveTo(padding.left, crossY);
        ctx.lineTo(width - padding.right, crossY);
        ctx.stroke();

        // Crosshair price tag on axis
        const hoverPrice = maxPrice - ((crossY - mainTop) / mainHeight) * priceRange;
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(width - padding.right + 2, crossY - 10, 60, 20);
        ctx.fillStyle = '#020617';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`$${hoverPrice.toFixed(2)}`, width - padding.right + 6, crossY + 4);
      }

      ctx.setLineDash([]);
    }
  }, [allDisplayData, data, chartType, timeframe, indicators, bb, sma20, sma50, ema20, rsi, macd, mousePos, hoverIndex, forecastPoints, predictionResult, symbol]);

  // Handle crosshair mouse interactions
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });

    const paddingLeft = 16;
    const paddingRight = 65;
    const chartWidth = rect.width - paddingLeft - paddingRight;
    const n = allDisplayData.length;

    if (x >= paddingLeft && x <= rect.width - paddingRight && n > 1) {
      const stepX = chartWidth / (n - 1);
      const idx = Math.round((x - paddingLeft) / stepX);
      setHoverIndex(Math.max(0, Math.min(n - 1, idx)));
    }
  };

  const handleMouseLeave = () => {
    setMousePos(null);
    setHoverIndex(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/70 border border-slate-800 rounded-lg overflow-hidden">
      {/* Chart Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-800 bg-slate-950/40 text-xs">
        {/* Timeframe Switcher */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-md">
          {(['1D', '1W', '1M', '3M', '6M', '1Y', '5Y'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                timeframe === tf
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Chart Style & Indicators Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Candlestick / Line Toggle */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-md">
            <button
              onClick={() => setChartType('candlestick')}
              title="Candlestick Chart"
              className={`px-2 py-1 rounded transition-colors ${
                chartType === 'candlestick' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType('line')}
              title="Line Chart"
              className={`px-2 py-1 rounded transition-colors ${
                chartType === 'line' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Indicator Quick Toggles */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onToggleIndicator('sma20')}
              className={`px-2 py-1 rounded border transition-colors ${
                indicators.sma20
                  ? 'border-amber-500/60 bg-amber-500/10 text-amber-300'
                  : 'border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              SMA 20
            </button>
            <button
              onClick={() => onToggleIndicator('sma50')}
              className={`px-2 py-1 rounded border transition-colors ${
                indicators.sma50
                  ? 'border-sky-500/60 bg-sky-500/10 text-sky-300'
                  : 'border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              SMA 50
            </button>
            <button
              onClick={() => onToggleIndicator('ema20')}
              className={`px-2 py-1 rounded border transition-colors ${
                indicators.ema20
                  ? 'border-purple-500/60 bg-purple-500/10 text-purple-300'
                  : 'border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              EMA 20
            </button>
            <button
              onClick={() => onToggleIndicator('bollingerBands')}
              className={`px-2 py-1 rounded border transition-colors ${
                indicators.bollingerBands
                  ? 'border-blue-500/60 bg-blue-500/10 text-blue-300'
                  : 'border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              BB (20,2)
            </button>
            <button
              onClick={() => onToggleIndicator('rsi')}
              className={`px-2 py-1 rounded border transition-colors ${
                indicators.rsi
                  ? 'border-rose-500/60 bg-rose-500/10 text-rose-300'
                  : 'border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              RSI (14)
            </button>
            <button
              onClick={() => onToggleIndicator('macd')}
              className={`px-2 py-1 rounded border transition-colors ${
                indicators.macd
                  ? 'border-teal-500/60 bg-teal-500/10 text-teal-300'
                  : 'border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              MACD
            </button>
            <button
              onClick={() => onToggleIndicator('lstmForecast')}
              className={`px-2.5 py-1 rounded border font-medium flex items-center gap-1.5 transition-colors ${
                indicators.lstmForecast
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                  : 'border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3 h-3 text-emerald-400" />
              LSTM Forecast
            </button>
          </div>
        </div>
      </div>

      {/* Floating HUD Bar displaying Cursor Values */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-1.5 border-b border-slate-800/60 bg-slate-950/20 text-xs font-mono tabular-nums text-slate-400">
        <span className="text-slate-200 font-semibold">{symbol}</span>
        <span>Date: <span className="text-slate-300">{currentHoverItem?.time || '--'}</span></span>
        <span>O: <span className="text-slate-200">${currentHoverItem?.open.toFixed(2) || '--'}</span></span>
        <span>H: <span className="text-slate-200">${currentHoverItem?.high.toFixed(2) || '--'}</span></span>
        <span>L: <span className="text-slate-200">${currentHoverItem?.low.toFixed(2) || '--'}</span></span>
        <span>C: <span className={`font-semibold ${currentHoverItem && currentHoverItem.close >= currentHoverItem.open ? 'text-emerald-400' : 'text-rose-400'}`}>${currentHoverItem?.close.toFixed(2) || '--'}</span></span>
        {currentHoverItem?.volume ? (
          <span>Vol: <span className="text-slate-300">{(currentHoverItem.volume / 1000000).toFixed(2)}M</span></span>
        ) : null}
        {currentHoverItem?.predictedClose ? (
          <span className="text-emerald-400 font-semibold">
            LSTM Projected: ${currentHoverItem.predictedClose.toFixed(2)} [95% CI: ${currentHoverItem.predictedLower?.toFixed(2)} - ${currentHoverItem.predictedUpper?.toFixed(2)}]
          </span>
        ) : null}
      </div>

      {/* Canvas Viewport */}
      <div ref={containerRef} className="relative flex-1 w-full min-h-[380px] bg-slate-950/40">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full cursor-crosshair block"
        />
      </div>
    </div>
  );
};
