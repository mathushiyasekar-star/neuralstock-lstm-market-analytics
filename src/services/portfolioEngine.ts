import { PortfolioPosition, PortfolioSummary, TickerInfo, TradeOrder } from '../types/market';

const PORTFOLIO_POSITIONS_KEY = 'neuralstock_portfolio_positions_';
const PORTFOLIO_ORDERS_KEY = 'neuralstock_portfolio_orders_';
const PORTFOLIO_CASH_KEY = 'neuralstock_portfolio_cash_';

const DEFAULT_INITIAL_CASH = 100000;

export function getUserCash(userId: string): number {
  try {
    const raw = localStorage.getItem(PORTFOLIO_CASH_KEY + userId);
    if (raw !== null) return parseFloat(raw);
  } catch {
    // fallback
  }
  return DEFAULT_INITIAL_CASH;
}

export function saveUserCash(userId: string, cash: number) {
  try {
    localStorage.setItem(PORTFOLIO_CASH_KEY + userId, cash.toString());
  } catch (err) {
    console.error('Failed to save cash', err);
  }
}

export function getUserPositions(userId: string): PortfolioPosition[] {
  try {
    const raw = localStorage.getItem(PORTFOLIO_POSITIONS_KEY + userId);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }

  // Initial starter portfolio for demo realism
  const initialPositions: PortfolioPosition[] = [
    {
      symbol: 'NVDA',
      shares: 120,
      avgBuyPrice: 124.50,
      currentPrice: 138.25,
      totalInvested: 14940,
      currentValue: 16590,
      unrealizedPnL: 1650,
      unrealizedPnLPercent: 11.04,
    },
    {
      symbol: 'AAPL',
      shares: 80,
      avgBuyPrice: 221.00,
      currentPrice: 228.40,
      totalInvested: 17680,
      currentValue: 18272,
      unrealizedPnL: 592,
      unrealizedPnLPercent: 3.35,
    },
    {
      symbol: 'BTC-USD',
      shares: 0.35,
      avgBuyPrice: 79200.00,
      currentPrice: 88450.00,
      totalInvested: 27720,
      currentValue: 30957.5,
      unrealizedPnL: 3237.5,
      unrealizedPnLPercent: 11.68,
    },
  ];

  localStorage.setItem(PORTFOLIO_POSITIONS_KEY + userId, JSON.stringify(initialPositions));
  return initialPositions;
}

export function saveUserPositions(userId: string, positions: PortfolioPosition[]) {
  try {
    localStorage.setItem(PORTFOLIO_POSITIONS_KEY + userId, JSON.stringify(positions));
  } catch (err) {
    console.error('Failed to save positions', err);
  }
}

export function getUserOrders(userId: string): TradeOrder[] {
  try {
    const raw = localStorage.getItem(PORTFOLIO_ORDERS_KEY + userId);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }

  const initialOrders: TradeOrder[] = [
    {
      id: 'ord_101',
      userId,
      timestamp: '2026-11-09T14:32:00Z',
      symbol: 'NVDA',
      type: 'BUY',
      orderType: 'MARKET',
      shares: 120,
      price: 124.50,
      total: 14940,
      status: 'EXECUTED',
    },
    {
      id: 'ord_102',
      userId,
      timestamp: '2026-11-10T10:15:00Z',
      symbol: 'AAPL',
      type: 'BUY',
      orderType: 'MARKET',
      shares: 80,
      price: 221.00,
      total: 17680,
      status: 'EXECUTED',
    },
    {
      id: 'ord_103',
      userId,
      timestamp: '2026-11-10T16:45:00Z',
      symbol: 'BTC-USD',
      type: 'BUY',
      orderType: 'MARKET',
      shares: 0.35,
      price: 79200.00,
      total: 27720,
      status: 'EXECUTED',
    },
  ];

  localStorage.setItem(PORTFOLIO_ORDERS_KEY + userId, JSON.stringify(initialOrders));
  return initialOrders;
}

export function saveUserOrders(userId: string, orders: TradeOrder[]) {
  try {
    localStorage.setItem(PORTFOLIO_ORDERS_KEY + userId, JSON.stringify(orders.slice(0, 100)));
  } catch (err) {
    console.error('Failed to save orders', err);
  }
}

/**
 * Recalculate portfolio summary with current live market prices
 */
export function calculatePortfolioSummary(
  userId: string,
  currentPrices: Record<string, number>
): { summary: PortfolioSummary; updatedPositions: PortfolioPosition[] } {
  const cash = getUserCash(userId);
  const rawPositions = getUserPositions(userId);
  const orders = getUserOrders(userId);

  let positionsValue = 0;
  let totalInvested = 0;

  const updatedPositions = rawPositions.map((pos) => {
    const livePrice = currentPrices[pos.symbol] || pos.currentPrice;
    const curVal = pos.shares * livePrice;
    const invested = pos.shares * pos.avgBuyPrice;
    const pnl = curVal - invested;
    const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;

    positionsValue += curVal;
    totalInvested += invested;

    return {
      ...pos,
      currentPrice: livePrice,
      currentValue: Number(curVal.toFixed(2)),
      totalInvested: Number(invested.toFixed(2)),
      unrealizedPnL: Number(pnl.toFixed(2)),
      unrealizedPnLPercent: Number(pnlPct.toFixed(2)),
    };
  });

  const totalEquity = cash + positionsValue;
  const startingBalance = DEFAULT_INITIAL_CASH;
  const totalPnL = totalEquity - startingBalance;
  const totalPnLPercent = (totalPnL / startingBalance) * 100;

  // Calculate win rate from closed trades or positions
  const winningPositions = updatedPositions.filter((p) => p.unrealizedPnL > 0).length;
  const winRate = updatedPositions.length > 0 ? Number(((winningPositions / updatedPositions.length) * 100).toFixed(1)) : 100;

  const summary: PortfolioSummary = {
    cashBalance: Number(cash.toFixed(2)),
    positionsValue: Number(positionsValue.toFixed(2)),
    totalEquity: Number(totalEquity.toFixed(2)),
    startingBalance,
    totalPnL: Number(totalPnL.toFixed(2)),
    totalPnLPercent: Number(totalPnLPercent.toFixed(2)),
    winRate,
    totalTrades: orders.length,
  };

  return { summary, updatedPositions };
}

/**
 * Execute Paper Trade Order
 */
export function executeTrade(
  userId: string,
  symbol: string,
  type: 'BUY' | 'SELL',
  shares: number,
  price: number
): { success: boolean; message: string; order?: TradeOrder } {
  if (shares <= 0 || price <= 0) {
    return { success: false, message: 'Shares and price must be greater than zero.' };
  }

  const currentCash = getUserCash(userId);
  const positions = getUserPositions(userId);
  const totalAmount = shares * price;

  const existingIndex = positions.findIndex((p) => p.symbol === symbol);

  if (type === 'BUY') {
    if (currentCash < totalAmount) {
      return { success: false, message: `Insufficient cash balance. Required: \$${totalAmount.toFixed(2)}, Available: \$${currentCash.toFixed(2)}.` };
    }

    // Deduct cash
    saveUserCash(userId, currentCash - totalAmount);

    if (existingIndex >= 0) {
      const existing = positions[existingIndex];
      const newShares = existing.shares + shares;
      const newInvested = existing.totalInvested + totalAmount;
      const newAvgPrice = newInvested / newShares;

      positions[existingIndex] = {
        ...existing,
        shares: newShares,
        avgBuyPrice: Number(newAvgPrice.toFixed(2)),
        totalInvested: Number(newInvested.toFixed(2)),
        currentPrice: price,
        currentValue: Number((newShares * price).toFixed(2)),
        unrealizedPnL: Number(((newShares * price) - newInvested).toFixed(2)),
        unrealizedPnLPercent: Number(((((newShares * price) - newInvested) / newInvested) * 100).toFixed(2)),
      };
    } else {
      positions.push({
        symbol,
        shares,
        avgBuyPrice: price,
        currentPrice: price,
        totalInvested: totalAmount,
        currentValue: totalAmount,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
      });
    }

    saveUserPositions(userId, positions);
  } else {
    // SELL
    if (existingIndex < 0 || positions[existingIndex].shares < shares) {
      const owned = existingIndex >= 0 ? positions[existingIndex].shares : 0;
      return { success: false, message: `Insufficient shares to sell. Owned: ${owned}, Requested: ${shares}.` };
    }

    // Add cash
    saveUserCash(userId, currentCash + totalAmount);

    const existing = positions[existingIndex];
    const remainingShares = existing.shares - shares;

    if (remainingShares <= 0.00001) {
      // Position closed
      positions.splice(existingIndex, 1);
    } else {
      const newInvested = remainingShares * existing.avgBuyPrice;
      positions[existingIndex] = {
        ...existing,
        shares: remainingShares,
        totalInvested: Number(newInvested.toFixed(2)),
        currentPrice: price,
        currentValue: Number((remainingShares * price).toFixed(2)),
        unrealizedPnL: Number(((remainingShares * price) - newInvested).toFixed(2)),
        unrealizedPnLPercent: Number(((((remainingShares * price) - newInvested) / newInvested) * 100).toFixed(2)),
      };
    }

    saveUserPositions(userId, positions);
  }

  // Record Order
  const order: TradeOrder = {
    id: `ord_${Date.now()}`,
    userId,
    timestamp: new Date().toISOString(),
    symbol,
    type,
    orderType: 'MARKET',
    shares,
    price,
    total: totalAmount,
    status: 'EXECUTED',
  };

  const orders = [order, ...getUserOrders(userId)];
  saveUserOrders(userId, orders);

  return {
    success: true,
    message: `Successfully executed ${type} order: ${shares} ${symbol} @ \$${price.toFixed(2)}`,
    order,
  };
}
