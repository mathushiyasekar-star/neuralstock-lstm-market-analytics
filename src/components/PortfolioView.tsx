import React, { useState } from 'react';
import { PortfolioPosition, PortfolioSummary, TickerInfo, TradeOrder, UserAccount } from '../types/market';
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, DollarSign, PieChart, ShieldCheck } from 'lucide-react';

interface PortfolioViewProps {
  currentUser: UserAccount;
  summary: PortfolioSummary;
  positions: PortfolioPosition[];
  orders: TradeOrder[];
  tickers: TickerInfo[];
  onExecuteTrade: (symbol: string, type: 'BUY' | 'SELL', shares: number, price: number) => { success: boolean; message: string };
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  currentUser,
  summary,
  positions,
  orders,
  tickers,
  onExecuteTrade,
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>(tickers[0]?.symbol || 'NVDA');
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [sharesInput, setSharesInput] = useState<number>(10);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const activeTicker = tickers.find((t) => t.symbol === selectedSymbol) || tickers[0];
  const orderPrice = activeTicker ? activeTicker.price : 100;
  const estimatedTotal = sharesInput * orderPrice;

  const currentOwnedShares = positions.find((p) => p.symbol === selectedSymbol)?.shares || 0;

  const handleTradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = onExecuteTrade(selectedSymbol, tradeType, sharesInput, orderPrice);
    setFeedback(res);
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Portfolio Top KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Total Net Worth</span>
          <span className="text-xl font-mono font-bold text-slate-100 tabular-nums">
            ${summary.totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className={`text-[11px] font-mono mt-1 flex items-center gap-0.5 ${summary.totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {summary.totalPnL >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {summary.totalPnL >= 0 ? '+' : ''}${summary.totalPnL.toFixed(2)} ({summary.totalPnLPercent >= 0 ? '+' : ''}{summary.totalPnLPercent.toFixed(2)}%)
          </span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Available Cash</span>
          <span className="text-xl font-mono font-bold text-slate-100 tabular-nums">
            ${summary.cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">Instant Buying Power</span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Holdings Value</span>
          <span className="text-xl font-mono font-bold text-sky-400 tabular-nums">
            ${summary.positionsValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">{positions.length} Active Positions</span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Starting Capital</span>
          <span className="text-xl font-mono font-bold text-slate-300 tabular-nums">
            ${summary.startingBalance.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">Simulation Seed</span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Win Rate</span>
          <span className="text-xl font-mono font-bold text-emerald-400 tabular-nums">
            {summary.winRate.toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">Profitable Positions</span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Total Trades</span>
          <span className="text-xl font-mono font-bold text-slate-100 tabular-nums">
            {summary.totalTrades}
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">Executed Orders</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Paper Trading Order Execution Form */}
        <div className="lg:col-span-1 p-5 bg-slate-900/60 border border-slate-800 rounded-lg flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-100">Trade Terminal (Paper Simulator)</h3>
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-md text-xs border ${
                feedback.success
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}
            >
              {feedback.message}
            </div>
          )}

          <form onSubmit={handleTradeSubmit} className="flex flex-col gap-3.5 text-xs">
            {/* Side toggle */}
            <div className="flex gap-2 p-1 bg-slate-950 rounded-md border border-slate-800">
              <button
                type="button"
                onClick={() => setTradeType('BUY')}
                className={`flex-1 py-1.5 rounded font-bold transition-colors ${
                  tradeType === 'BUY'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                BUY
              </button>
              <button
                type="button"
                onClick={() => setTradeType('SELL')}
                className={`flex-1 py-1.5 rounded font-bold transition-colors ${
                  tradeType === 'SELL'
                    ? 'bg-rose-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                SELL
              </button>
            </div>

            {/* Asset selector */}
            <div>
              <label className="text-slate-400 block mb-1">Select Asset</label>
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
              >
                {tickers.map((t) => (
                  <option key={t.symbol} value={t.symbol}>
                    {t.symbol} (${t.price.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {/* Shares input */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Shares / Units</span>
                {tradeType === 'SELL' && (
                  <span className="text-slate-400">Owned: {currentOwnedShares}</span>
                )}
              </div>
              <input
                type="number"
                min="0.01"
                step="any"
                required
                value={sharesInput}
                onChange={(e) => setSharesInput(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Order calculations */}
            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-md font-mono text-xs flex flex-col gap-1.5 text-slate-400">
              <div className="flex justify-between">
                <span>Execution Price:</span>
                <span className="text-slate-200 font-semibold">${orderPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Order Total:</span>
                <span className="text-emerald-400 font-bold">${estimatedTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Remaining Cash:</span>
                <span>
                  $
                  {(tradeType === 'BUY'
                    ? summary.cashBalance - estimatedTotal
                    : summary.cashBalance + estimatedTotal
                  ).toFixed(2)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className={`py-2 px-4 font-bold rounded-md transition-colors ${
                tradeType === 'BUY'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  : 'bg-rose-500 hover:bg-rose-400 text-slate-950'
              }`}
            >
              Confirm {tradeType} ({selectedSymbol})
            </button>
          </form>
        </div>

        {/* Current Positions Table */}
        <div className="lg:col-span-2 p-5 bg-slate-900/60 border border-slate-800 rounded-lg flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100">Active Asset Holdings</h3>
            <span className="text-xs text-slate-400 font-mono">
              Account: {currentUser.name} ({currentUser.email})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950/60 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Symbol</th>
                  <th className="py-2.5 px-3">Units</th>
                  <th className="py-2.5 px-3">Avg Cost</th>
                  <th className="py-2.5 px-3">Current Price</th>
                  <th className="py-2.5 px-3">Market Value</th>
                  <th className="py-2.5 px-3">Unrealized P&L</th>
                  <th className="py-2.5 px-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
                {positions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500">
                      No positions open in portfolio. Execute a buy order to open a position.
                    </td>
                  </tr>
                ) : (
                  positions.map((pos) => {
                    const isProfit = pos.unrealizedPnL >= 0;
                    return (
                      <tr key={pos.symbol} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-semibold text-slate-100">{pos.symbol}</td>
                        <td className="py-2.5 px-3 text-slate-300">{pos.shares}</td>
                        <td className="py-2.5 px-3 text-slate-400">${pos.avgBuyPrice.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-slate-200">${pos.currentPrice.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-slate-100 font-medium">${pos.currentValue.toFixed(2)}</td>
                        <td className={`py-2.5 px-3 ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isProfit ? '+' : ''}${pos.unrealizedPnL.toFixed(2)} ({isProfit ? '+' : ''}{pos.unrealizedPnLPercent.toFixed(2)}%)
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedSymbol(pos.symbol);
                              setTradeType('SELL');
                              setSharesInput(pos.shares);
                            }}
                            className="px-2 py-0.5 rounded text-[11px] font-sans font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          >
                            Close
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Trade History Ledger */}
      <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-100">Trade Execution Ledger</h3>
          <span className="text-xs text-slate-400 font-mono">{orders.length} Historical Orders</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/60 text-slate-400 font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2 px-3">Order ID</th>
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Side</th>
                <th className="py-2 px-3">Symbol</th>
                <th className="py-2 px-3">Shares</th>
                <th className="py-2 px-3">Executed Price</th>
                <th className="py-2 px-3">Total Amount</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
              {orders.slice(0, 10).map((order) => (
                <tr key={order.id} className="hover:bg-slate-800/30">
                  <td className="py-2 px-3 text-slate-400 text-[11px]">{order.id}</td>
                  <td className="py-2 px-3 text-slate-400 text-[11px]">
                    {new Date(order.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`font-semibold ${
                        order.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {order.type}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-200">{order.symbol}</td>
                  <td className="py-2 px-3 text-slate-300">{order.shares}</td>
                  <td className="py-2 px-3 text-slate-300">${order.price.toFixed(2)}</td>
                  <td className="py-2 px-3 text-slate-100 font-medium">${order.total.toFixed(2)}</td>
                  <td className="py-2 px-3 text-emerald-400 text-[11px]">{order.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
