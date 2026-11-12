import React from 'react';
import { TickerInfo } from '../types/market';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerBarProps {
  tickers: TickerInfo[];
  selectedSymbol: string;
  onSelectTicker: (symbol: string) => void;
}

export const TickerBar: React.FC<TickerBarProps> = ({
  tickers,
  selectedSymbol,
  onSelectTicker,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 px-6 border-b border-slate-800 bg-slate-950/40 text-xs no-scrollbar">
      {tickers.map((t) => {
        const isSelected = t.symbol === selectedSymbol;
        const isUp = t.change >= 0;

        return (
          <button
            key={t.symbol}
            onClick={() => onSelectTicker(t.symbol)}
            className={`flex items-center gap-3 px-3 py-1.5 rounded-md border shrink-0 transition-all font-mono tabular-nums ${
              isSelected
                ? 'border-emerald-500/80 bg-emerald-500/10 text-slate-100 shadow-xs'
                : 'border-slate-800/80 bg-slate-900/40 hover:bg-slate-800/60 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-1.5 font-sans">
              <span className="font-bold text-slate-100">{t.symbol}</span>
              <span className="text-[10px] text-slate-500 hidden sm:inline">{t.category}</span>
            </div>

            <span className="font-semibold text-slate-200">
              ${t.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>

            <span
              className={`flex items-center text-[11px] font-medium ${
                isUp ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isUp ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
              {isUp ? '+' : ''}
              {t.changePercent.toFixed(2)}%
            </span>
          </button>
        );
      })}
    </div>
  );
};
