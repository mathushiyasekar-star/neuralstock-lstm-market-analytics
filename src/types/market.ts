export interface OHLCV {
  time: string; // ISO or date string
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  predictedClose?: number;
  predictedLower?: number;
  predictedUpper?: number;
}

export interface TickerInfo {
  symbol: string;
  name: string;
  category: 'Tech' | 'Index' | 'Crypto' | 'Semiconductors' | 'Consumer';
  price: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap: string;
  peRatio?: number;
  beta?: number;
}

export type Timeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y';
export type ChartType = 'candlestick' | 'line';

export interface IndicatorToggles {
  sma20: boolean;
  sma50: boolean;
  ema20: boolean;
  bollingerBands: boolean;
  rsi: boolean;
  macd: boolean;
  volume: boolean;
  lstmForecast: boolean;
}

export interface IndicatorValues {
  sma20?: number[];
  sma50?: number[];
  ema20?: number[];
  bbUpper?: number[];
  bbMiddle?: number[];
  bbLower?: number[];
  rsi?: number[];
  macdLine?: number[];
  macdSignal?: number[];
  macdHistogram?: number[];
}

export interface LSTMHyperparameters {
  lookbackDays: number; // e.g. 30
  forecastDays: number; // e.g. 14
  hiddenUnits: number; // 32, 64, 128
  numLayers: number; // 1, 2, 3
  epochs: number; // 10 - 100
  learningRate: number; // 0.001 - 0.01
  batchSize: number; // 16, 32
  dropoutRate: number; // 0.1, 0.2
  bidirectional: boolean;
  featureInputs: ('close' | 'open' | 'high' | 'low' | 'volume' | 'rsi')[];
}

export interface EpochLoss {
  epoch: number;
  trainLoss: number;
  valLoss: number;
}

export interface ModelMetrics {
  rmse: number; // Root Mean Squared Error
  mae: number; // Mean Absolute Error
  mape: number; // Mean Absolute Percentage Error (%)
  directionalAccuracy: number; // % of times predicted direction (up/down) matches actual
  r2Score: number;
  trainingTimeSec: number;
}

export interface PredictionResult {
  symbol: string;
  generatedAt: string;
  historicalDates: string[];
  actualPrices: number[];
  fittedPrices: (number | null)[];
  futureDates: string[];
  forecastPrices: number[];
  forecastLower: number[];
  forecastUpper: number[];
  metrics: ModelMetrics;
  lossHistory: EpochLoss[];
}

export type AlertType = 'price_above' | 'price_below' | 'percent_change' | 'rsi_overbought' | 'rsi_oversold' | 'macd_crossover';

export interface AlertRule {
  id: string;
  userId: string;
  symbol: string;
  type: AlertType;
  threshold: number;
  notifyEmail: boolean;
  emailAddress: string;
  notifyPush: boolean;
  active: boolean;
  createdAt: string;
  lastTriggered?: string;
  triggerCount: number;
}

export interface NotificationItem {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  symbol?: string;
  type: 'alert' | 'trade' | 'model' | 'system';
  severity: 'info' | 'success' | 'warning' | 'critical';
  read: boolean;
  emailDispatched?: boolean;
}

export interface EmailDispatchRecord {
  id: string;
  timestamp: string;
  recipient: string;
  subject: string;
  body: string;
  status: 'delivered' | 'queued' | 'simulated';
  symbol: string;
  triggerReason: string;
}

export type UserRole = 'admin' | 'analyst' | 'trader';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  passwordHash?: string;
  createdAt: string;
  lastLogin: string;
}

export interface PortfolioPosition {
  symbol: string;
  shares: number;
  avgBuyPrice: number;
  currentPrice: number;
  totalInvested: number;
  currentValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
}

export interface TradeOrder {
  id: string;
  userId: string;
  timestamp: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT';
  shares: number;
  price: number;
  total: number;
  status: 'EXECUTED' | 'CANCELLED';
}

export interface PortfolioSummary {
  cashBalance: number;
  positionsValue: number;
  totalEquity: number;
  startingBalance: number;
  totalPnL: number;
  totalPnLPercent: number;
  winRate: number;
  totalTrades: number;
}
