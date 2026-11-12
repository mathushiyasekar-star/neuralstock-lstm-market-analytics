import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertRule,
  ChartType,
  EmailDispatchRecord,
  IndicatorToggles,
  LSTMHyperparameters,
  NotificationItem,
  OHLCV,
  PortfolioPosition,
  PortfolioSummary,
  PredictionResult,
  TickerInfo,
  Timeframe,
  UserAccount,
  UserRole,
} from './types/market';
import { INITIAL_TICKERS, generateHistoricalData } from './services/marketData';
import { trainAndPredictLSTM } from './services/lstmEngine';
import {
  evaluatePriceAlerts,
  getAlertRules,
  getEmailDispatchLogs,
  getNotifications,
  playAlertChime,
  saveAlertRules,
  saveEmailDispatchLogs,
  saveNotifications,
  sendNativePushNotification,
} from './services/alertEngine';
import {
  calculatePortfolioSummary,
  executeTrade,
  getUserOrders,
  getUserPositions,
} from './services/portfolioEngine';
import {
  getCurrentUser,
  getStoredUsers,
  hasPermission,
  saveUsers,
  setCurrentUser,
} from './services/authStore';
import { TopNav, ActiveTab } from './components/TopNav';
import { TickerBar } from './components/TickerBar';
import { InteractiveChart } from './components/InteractiveChart';
import { LSTMLab } from './components/LSTMLab';
import { AlertsManager } from './components/AlertsManager';
import { PortfolioView } from './components/PortfolioView';
import { AdminConsole } from './components/AdminConsole';
import { PythonExportModal } from './components/PythonExportModal';
import { AuthModal } from './components/AuthModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import {
  Cpu,
  TrendingUp,
  TrendingDown,
  Terminal,
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Info,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(true);

  // Auth & RBAC State
  const [currentUser, setCurrentUserState] = useState<UserAccount>(() => getCurrentUser());
  const [users, setUsers] = useState<UserAccount[]>(() => getStoredUsers());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('terminal');

  // Market & Asset State
  const [tickers, setTickers] = useState<TickerInfo[]>(INITIAL_TICKERS);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('NVDA');
  const [timeframe, setTimeframe] = useState<Timeframe>('3M');
  const [historicalData, setHistoricalData] = useState<OHLCV[]>([]);

  // Technical Indicators
  const [indicators, setIndicators] = useState<IndicatorToggles>({
    sma20: true,
    sma50: true,
    ema20: false,
    bollingerBands: false,
    rsi: true,
    macd: false,
    volume: true,
    lstmForecast: true,
  });

  // LSTM Neural Network State
  const [hyperparams, setHyperparams] = useState<LSTMHyperparameters>({
    lookbackDays: 30,
    forecastDays: 14,
    hiddenUnits: 64,
    numLayers: 2,
    epochs: 35,
    learningRate: 0.003,
    batchSize: 16,
    dropoutRate: 0.2,
    bidirectional: false,
    featureInputs: ['close', 'volume', 'rsi'],
  });

  const [predictionsBySymbol, setPredictionsBySymbol] = useState<Record<string, PredictionResult>>({});
  const [isTraining, setIsTraining] = useState(false);
  const [trainingEpoch, setTrainingEpoch] = useState(0);
  const [currentEpochLoss, setCurrentEpochLoss] = useState<{ epoch: number; trainLoss: number; valLoss: number } | null>(null);

  // Alerts & Notification Center
  const [alertRules, setAlertRules] = useState<AlertRule[]>(() => getAlertRules());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => getNotifications());
  const [emailLogs, setEmailLogs] = useState<EmailDispatchRecord[]>(() => getEmailDispatchLogs());
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  // Portfolio & Paper Trading
  const [portfolioPrices, setPortfolioPrices] = useState<Record<string, number>>({});
  const [portfolioKey, setPortfolioKey] = useState(0); // trigger recalculation

  // Python Exporter Modal
  const [isPythonModalOpen, setIsPythonModalOpen] = useState(false);

  // Sync dark class on document element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Load historical data whenever selectedSymbol or timeframe changes
  useEffect(() => {
    const currentTicker = tickers.find((t) => t.symbol === selectedSymbol);
    const data = generateHistoricalData(selectedSymbol, timeframe, currentTicker?.price);
    setHistoricalData(data);
  }, [selectedSymbol, timeframe]);

  // Active ticker info
  const activeTicker = useMemo(() => {
    return tickers.find((t) => t.symbol === selectedSymbol) || tickers[0];
  }, [tickers, selectedSymbol]);

  // Active prediction result for selected symbol
  const activePrediction = predictionsBySymbol[selectedSymbol] || null;

  // Auto-train initial model for the first ticker if not already generated
  useEffect(() => {
    if (historicalData.length > 20 && !predictionsBySymbol[selectedSymbol]) {
      trainAndPredictLSTM(selectedSymbol, historicalData, hyperparams).then((result) => {
        setPredictionsBySymbol((prev) => ({
          ...prev,
          [selectedSymbol]: result,
        }));
      });
    }
  }, [selectedSymbol, historicalData.length]);

  // Real-Time High-Frequency Ticker Update Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setTickers((prevTickers) => {
        const priceMap: Record<string, number> = {};
        const updated = prevTickers.map((t) => {
          // Micro-fluctuation between -0.3% and +0.3%
          const pct = (Math.random() - 0.49) * 0.005;
          const newPrice = Number((t.price * (1 + pct)).toFixed(2));
          const newChange = Number((newPrice - (t.price - t.change)).toFixed(2));
          const newChangePct = Number(((newChange / (newPrice - newChange)) * 100).toFixed(2));

          priceMap[t.symbol] = newPrice;

          return {
            ...t,
            price: newPrice,
            change: newChange,
            changePercent: newChangePct,
            high24h: Math.max(t.high24h, newPrice),
            low24h: Math.min(t.low24h, newPrice),
          };
        });

        setPortfolioPrices(priceMap);

        // Check active ticker against alert rules
        const cur = updated.find((t) => t.symbol === selectedSymbol);
        if (cur) {
          const { triggeredAlerts, newNotifications, newEmails } = evaluatePriceAlerts(cur);
          if (triggeredAlerts.length > 0) {
            playAlertChime();
            setNotifications((prev) => {
              const merged = [...newNotifications, ...prev];
              saveNotifications(merged);
              return merged;
            });
            setEmailLogs((prev) => {
              const merged = [...newEmails, ...prev];
              saveEmailDispatchLogs(merged);
              return merged;
            });
            setAlertRules(getAlertRules());
          }
        }

        return updated;
      });
    }, 2800);

    return () => clearInterval(interval);
  }, [selectedSymbol]);

  // Recalculate portfolio with live prices
  const { summary: portfolioSummary, updatedPositions } = useMemo(() => {
    const prices: Record<string, number> = {};
    tickers.forEach((t) => (prices[t.symbol] = t.price));
    return calculatePortfolioSummary(currentUser.id, prices);
  }, [currentUser.id, tickers, portfolioKey]);

  // Indicator toggle handler
  const handleToggleIndicator = (key: keyof IndicatorToggles) => {
    setIndicators((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Train LSTM Model Handler
  const handleTrainModel = async () => {
    if (!hasPermission(currentUser.role, 'train_model')) return;
    setIsTraining(true);
    setTrainingEpoch(0);

    try {
      const result = await trainAndPredictLSTM(
        selectedSymbol,
        historicalData,
        hyperparams,
        (epoch, trainLoss, valLoss) => {
          setTrainingEpoch(epoch);
          setCurrentEpochLoss({ epoch, trainLoss, valLoss });
        }
      );

      setPredictionsBySymbol((prev) => ({
        ...prev,
        [selectedSymbol]: result,
      }));

      // Add success notification
      const notif: NotificationItem = {
        id: `notif_${Date.now()}`,
        timestamp: new Date().toISOString(),
        title: `LSTM Model Trained for ${selectedSymbol}`,
        message: `Trained ${hyperparams.epochs} epochs with lookback=${hyperparams.lookbackDays}d. RMSE: \$${result.metrics.rmse}, Directional Acc: ${result.metrics.directionalAccuracy}%.`,
        symbol: selectedSymbol,
        type: 'model',
        severity: 'success',
        read: false,
      };

      setNotifications((prev) => {
        const merged = [notif, ...prev];
        saveNotifications(merged);
        return merged;
      });
    } catch (err) {
      console.error('Failed to train LSTM model', err);
    } finally {
      setIsTraining(false);
    }
  };

  // Paper Trade Execution Handler
  const handleExecuteTrade = (symbol: string, type: 'BUY' | 'SELL', shares: number, price: number) => {
    const res = executeTrade(currentUser.id, symbol, type, shares, price);
    if (res.success && res.order) {
      setPortfolioKey((k) => k + 1);

      // Notification
      const notif: NotificationItem = {
        id: `notif_${Date.now()}`,
        timestamp: new Date().toISOString(),
        title: `Trade Executed: ${type} ${shares} ${symbol}`,
        message: `Filled ${shares} shares of ${symbol} at \$${price.toFixed(2)} (Total: \$${res.order.total.toFixed(2)}).`,
        symbol,
        type: 'trade',
        severity: 'info',
        read: false,
      };

      setNotifications((prev) => {
        const merged = [notif, ...prev];
        saveNotifications(merged);
        return merged;
      });
    }
    return res;
  };

  // Add Alert Rule Handler
  const handleAddRule = (rule: Omit<AlertRule, 'id' | 'createdAt' | 'triggerCount'>) => {
    const newRule: AlertRule = {
      ...rule,
      id: `alt_${Date.now()}`,
      createdAt: new Date().toISOString(),
      triggerCount: 0,
    };
    const updated = [newRule, ...alertRules];
    setAlertRules(updated);
    saveAlertRules(updated);

    // Notification
    const notif: NotificationItem = {
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: `Alert Configured: ${rule.symbol}`,
      message: `Monitoring ${rule.symbol} for condition ${rule.type} (threshold: ${rule.threshold}). Email & push configured.`,
      symbol: rule.symbol,
      type: 'alert',
      severity: 'info',
      read: false,
    };
    setNotifications((prev) => {
      const merged = [notif, ...prev];
      saveNotifications(merged);
      return merged;
    });
  };

  const handleToggleRule = (ruleId: string) => {
    const updated = alertRules.map((r) => (r.id === ruleId ? { ...r, active: !r.active } : r));
    setAlertRules(updated);
    saveAlertRules(updated);
  };

  const handleDeleteRule = (ruleId: string) => {
    const updated = alertRules.filter((r) => r.id !== ruleId);
    setAlertRules(updated);
    saveAlertRules(updated);
  };

  const handleSendTestAlert = (symbol: string, email: string) => {
    const emailRecord: EmailDispatchRecord = {
      id: `eml_${Date.now()}`,
      timestamp: new Date().toISOString(),
      recipient: email,
      subject: `[NeuralStock Alert] Automated Test Price Signal: ${symbol}`,
      body: `This is a verified test dispatch from NeuralStock LSTM Engine to ${email}.\nPrice target breached for ${symbol}.\nTimestamp: ${new Date().toLocaleString()}`,
      status: 'delivered',
      symbol,
      triggerReason: 'Manual Test Trigger',
    };

    setEmailLogs((prev) => {
      const merged = [emailRecord, ...prev];
      saveEmailDispatchLogs(merged);
      return merged;
    });

    playAlertChime();
    sendNativePushNotification(`Test Alert: ${symbol}`, `Email dispatched to ${email}`);

    const notif: NotificationItem = {
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: `Test Email Dispatched for ${symbol}`,
      message: `Notification simulated and logged to ${email}.`,
      symbol,
      type: 'alert',
      severity: 'success',
      read: false,
      emailDispatched: true,
    };
    setNotifications((prev) => {
      const merged = [notif, ...prev];
      saveNotifications(merged);
      return merged;
    });
  };

  // User management
  const handleUpdateUserRole = (userId: string, newRole: UserRole) => {
    const updated = users.map((u) => (u.id === userId ? { ...u, role: newRole } : u));
    setUsers(updated);
    saveUsers(updated);
    if (currentUser.id === userId) {
      const updatedCur = { ...currentUser, role: newRole };
      setCurrentUserState(updatedCur);
      setCurrentUser(updatedCur);
    }
  };

  const handleSelectUser = (user: UserAccount) => {
    setCurrentUserState(user);
    setCurrentUser(user);
    setPortfolioKey((k) => k + 1);
  };

  const handleRegisterUser = (name: string, email: string, role: UserRole) => {
    const newUser: UserAccount = {
      id: `usr_${Date.now()}`,
      name,
      email,
      role,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    const updated = [...users, newUser];
    setUsers(updated);
    saveUsers(updated);
    setCurrentUserState(newUser);
    setCurrentUser(newUser);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Bar Contract Navigation */}
      <TopNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        unreadCount={unreadCount}
        onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
      />

      {/* Real-Time Ticker Strip */}
      <TickerBar
        tickers={tickers}
        selectedSymbol={selectedSymbol}
        onSelectTicker={setSelectedSymbol}
      />

      {/* Main Workspace Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* VIEW 1: MARKET TERMINAL */}
        {activeTab === 'terminal' && (
          <div className="flex flex-col gap-6">
            {/* Ticker Header Summary Strip */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-slate-100 tracking-tight">{activeTicker.symbol}</h1>
                    <span className="text-xs text-slate-400">· {activeTicker.name}</span>
                    <span className="text-xs text-slate-500">· {activeTicker.category}</span>
                  </div>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-2xl font-mono font-bold text-slate-100 tabular-nums">
                      ${activeTicker.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span
                      className={`text-sm font-mono font-semibold flex items-center tabular-nums ${
                        activeTicker.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {activeTicker.change >= 0 ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                      {activeTicker.change >= 0 ? '+' : ''}
                      {activeTicker.change.toFixed(2)} ({activeTicker.changePercent >= 0 ? '+' : ''}
                      {activeTicker.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Stat Metrics */}
              <div className="flex items-center gap-6 text-xs font-mono tabular-nums text-slate-400 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-6">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">24h High</span>
                  <span className="text-slate-200 font-semibold">${activeTicker.high24h.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">24h Low</span>
                  <span className="text-slate-200 font-semibold">${activeTicker.low24h.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Market Cap</span>
                  <span className="text-slate-200 font-semibold">{activeTicker.marketCap}</span>
                </div>
                {activeTicker.peRatio && (
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">P/E Ratio</span>
                    <span className="text-slate-200 font-semibold">{activeTicker.peRatio}</span>
                  </div>
                )}
                <div className="hidden lg:block">
                  <span className="text-[10px] text-slate-500 uppercase block">Beta (Vol)</span>
                  <span className="text-slate-200 font-semibold">{activeTicker.beta || '1.05'}</span>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPythonModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors flex items-center gap-1.5"
                >
                  <Terminal className="w-3.5 h-3.5 text-sky-400" />
                  Python Scripts
                </button>
                <button
                  onClick={() => setActiveTab('lstm_lab')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-md transition-colors flex items-center gap-1.5"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  Model Lab
                </button>
              </div>
            </div>

            {/* High-Frequency Canvas Chart */}
            <div className="h-[460px]">
              <InteractiveChart
                symbol={selectedSymbol}
                data={historicalData}
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
                indicators={indicators}
                predictionResult={activePrediction}
                onToggleIndicator={handleToggleIndicator}
              />
            </div>

            {/* Bottom 2-Column Split: LSTM Forecast Summary & Quick Paper Order */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Active Model Performance */}
              <div className="lg:col-span-2 p-5 bg-slate-900/60 border border-slate-800 rounded-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-semibold text-slate-100">
                        LSTM Predictive Model Summary ({selectedSymbol})
                      </h3>
                    </div>
                    {activePrediction && (
                      <span className="text-[11px] font-mono text-emerald-400">
                        {activePrediction.metrics.directionalAccuracy}% Directional Accuracy
                      </span>
                    )}
                  </div>

                  {activePrediction ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-md">
                          <span className="text-[10px] text-slate-500 uppercase block">14d Projected Target</span>
                          <span className="text-base font-mono font-bold text-emerald-400 tabular-nums">
                            ${activePrediction.forecastPrices[activePrediction.forecastPrices.length - 1].toFixed(2)}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-md">
                          <span className="text-[10px] text-slate-500 uppercase block">95% CI Lower Bound</span>
                          <span className="text-base font-mono font-bold text-slate-300 tabular-nums">
                            ${activePrediction.forecastLower[activePrediction.forecastLower.length - 1].toFixed(2)}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-md">
                          <span className="text-[10px] text-slate-500 uppercase block">95% CI Upper Bound</span>
                          <span className="text-base font-mono font-bold text-slate-300 tabular-nums">
                            ${activePrediction.forecastUpper[activePrediction.forecastUpper.length - 1].toFixed(2)}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-md">
                          <span className="text-[10px] text-slate-500 uppercase block">Root Mean Sq Err</span>
                          <span className="text-base font-mono font-bold text-sky-400 tabular-nums">
                            ${activePrediction.metrics.rmse.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        The Long Short-Term Memory neural network captures sequential memory vectors across a {hyperparams.lookbackDays}-day lookback sequence. Projected trajectory indicates a 14-day expected price target with widening confidence bands reflecting residual variance.
                      </p>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Generating LSTM model weights...
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Weights trained on {historicalData.length} sequential bars
                  </span>
                  <button
                    onClick={() => setActiveTab('lstm_lab')}
                    className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1"
                  >
                    Open Full Architecture & Loss Curves <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Col: Instant Paper Trading Order Widget */}
              <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-3">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-slate-100">Execute Paper Trade</h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Available Cash:</span>
                      <span className="font-mono text-slate-200 font-semibold">
                        ${portfolioSummary.cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleExecuteTrade(selectedSymbol, 'BUY', 10, activeTicker.price)}
                        className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-md transition-colors"
                      >
                        Buy 10 Shares (${(activeTicker.price * 10).toFixed(2)})
                      </button>
                      <button
                        onClick={() => handleExecuteTrade(selectedSymbol, 'SELL', 10, activeTicker.price)}
                        className="flex-1 py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded-md transition-colors"
                      >
                        Sell 10 Shares
                      </button>
                    </div>

                    <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-md text-[11px] text-slate-400">
                      Instant execution at market bid/ask: <strong className="text-slate-200 font-mono">${activeTicker.price.toFixed(2)}</strong>. Positions and P&L update live with each price tick.
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('portfolio')}
                  className="mt-4 text-xs text-slate-400 hover:text-slate-200 flex items-center justify-between pt-2 border-t border-slate-800"
                >
                  <span>View Full Portfolio & Ledger</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: LSTM MODEL LABORATORY */}
        {activeTab === 'lstm_lab' && (
          <LSTMLab
            currentTicker={activeTicker}
            hyperparams={hyperparams}
            onUpdateHyperparams={setHyperparams}
            onTrainModel={handleTrainModel}
            isTraining={isTraining}
            trainingEpoch={trainingEpoch}
            currentEpochLoss={currentEpochLoss}
            predictionResult={activePrediction}
            onOpenPythonModal={() => setIsPythonModalOpen(true)}
            canTrain={hasPermission(currentUser.role, 'train_model')}
          />
        )}

        {/* VIEW 3: AUTOMATED ALERTS & NOTIFICATIONS */}
        {activeTab === 'alerts' && (
          <AlertsManager
            currentUser={currentUser}
            tickers={tickers}
            alertRules={alertRules}
            emailLogs={emailLogs}
            onAddRule={handleAddRule}
            onToggleRule={handleToggleRule}
            onDeleteRule={handleDeleteRule}
            onSendTestAlert={handleSendTestAlert}
          />
        )}

        {/* VIEW 4: PERSONALIZED PORTFOLIO & PAPER TRADING */}
        {activeTab === 'portfolio' && (
          <PortfolioView
            currentUser={currentUser}
            summary={portfolioSummary}
            positions={updatedPositions}
            orders={getUserOrders(currentUser.id)}
            tickers={tickers}
            onExecuteTrade={handleExecuteTrade}
          />
        )}

        {/* VIEW 5: ADMIN CONSOLE */}
        {activeTab === 'admin' && currentUser.role === 'admin' && (
          <AdminConsole
            users={users}
            currentUser={currentUser}
            onUpdateUserRole={handleUpdateUserRole}
            onRefreshDataFeed={() => {
              setHistoricalData(generateHistoricalData(selectedSymbol, timeframe));
            }}
            totalAlerts={alertRules.length}
          />
        )}
      </main>

      {/* Python Export Modal */}
      <PythonExportModal
        isOpen={isPythonModalOpen}
        onClose={() => setIsPythonModalOpen(false)}
        symbol={selectedSymbol}
        hyperparams={hyperparams}
      />

      {/* Encrypted Auth & Role Switcher Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        onRegisterUser={handleRegisterUser}
      />

      {/* Live Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        onMarkAllRead={() => {
          const marked = notifications.map((n) => ({ ...n, read: true }));
          setNotifications(marked);
          saveNotifications(marked);
        }}
        onClearAll={() => {
          setNotifications([]);
          saveNotifications([]);
        }}
        onNotificationClick={(notif) => {
          if (notif.symbol) setSelectedSymbol(notif.symbol);
          setIsNotificationDrawerOpen(false);
        }}
      />
    </div>
  );
}
