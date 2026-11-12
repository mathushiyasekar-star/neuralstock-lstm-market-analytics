import { AlertRule, EmailDispatchRecord, NotificationItem, TickerInfo } from '../types/market';

const ALERTS_STORAGE_KEY = 'neuralstock_alert_rules';
const NOTIFICATIONS_STORAGE_KEY = 'neuralstock_notifications_log';
const EMAILS_STORAGE_KEY = 'neuralstock_emails_dispatched';

export const DEFAULT_ALERTS: AlertRule[] = [
  {
    id: 'alt_01',
    userId: 'usr_trader_01',
    symbol: 'NVDA',
    type: 'price_above',
    threshold: 140.0,
    notifyEmail: true,
    emailAddress: 'rameshpiriththi@gmail.com',
    notifyPush: true,
    active: true,
    createdAt: '2026-11-10T14:00:00Z',
    triggerCount: 1,
    lastTriggered: '2026-11-11T16:20:00Z',
  },
  {
    id: 'alt_02',
    userId: 'usr_trader_01',
    symbol: 'TSLA',
    type: 'percent_change',
    threshold: 2.0,
    notifyEmail: true,
    emailAddress: 'rameshpiriththi@gmail.com',
    notifyPush: true,
    active: true,
    createdAt: '2026-11-10T14:30:00Z',
    triggerCount: 0,
  },
  {
    id: 'alt_03',
    userId: 'usr_trader_01',
    symbol: 'BTC-USD',
    type: 'price_above',
    threshold: 90000.0,
    notifyEmail: true,
    emailAddress: 'rameshpiriththi@gmail.com',
    notifyPush: true,
    active: true,
    createdAt: '2026-11-11T08:00:00Z',
    triggerCount: 0,
  },
  {
    id: 'alt_04',
    userId: 'usr_trader_01',
    symbol: 'AAPL',
    type: 'rsi_oversold',
    threshold: 30.0,
    notifyEmail: false,
    emailAddress: 'rameshpiriththi@gmail.com',
    notifyPush: true,
    active: true,
    createdAt: '2026-11-11T09:15:00Z',
    triggerCount: 0,
  },
];

export function getAlertRules(): AlertRule[] {
  try {
    const raw = localStorage.getItem(ALERTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(DEFAULT_ALERTS));
  return DEFAULT_ALERTS;
}

export function saveAlertRules(rules: AlertRule[]) {
  try {
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(rules));
  } catch (err) {
    console.error('Failed to save alert rules', err);
  }
}

export function getNotifications(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  const initial: NotificationItem[] = [
    {
      id: 'notif_init_01',
      timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
      title: 'NVDA Crosses \$140.00 Resistance',
      message: 'Automated alert triggered: NVIDIA reached \$140.10 (+3.61%). Email dispatched to rameshpiriththi@gmail.com.',
      symbol: 'NVDA',
      type: 'alert',
      severity: 'warning',
      read: false,
      emailDispatched: true,
    },
    {
      id: 'notif_init_02',
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      title: 'LSTM Model Retrained',
      message: 'AAPL 30-day lookback LSTM converged with RMSE \$1.82 (Directional Accuracy: 74.2%).',
      symbol: 'AAPL',
      type: 'model',
      severity: 'success',
      read: true,
    },
  ];
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

export function saveNotifications(items: NotificationItem[]) {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(items.slice(0, 100)));
  } catch (err) {
    console.error('Failed to save notifications', err);
  }
}

export function getEmailDispatchLogs(): EmailDispatchRecord[] {
  try {
    const raw = localStorage.getItem(EMAILS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  const initial: EmailDispatchRecord[] = [
    {
      id: 'eml_01',
      timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
      recipient: 'rameshpiriththi@gmail.com',
      subject: '[NeuralStock Alert] NVDA Surpassed \$140.00 Target',
      body: 'Price alert triggered: NVDA traded at \$140.10. Strategy: Bullish momentum check. LSTM 14-day projection: \$144.50.',
      status: 'delivered',
      symbol: 'NVDA',
      triggerReason: 'Price Cross Above \$140.00',
    },
  ];
  localStorage.setItem(EMAILS_STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

export function saveEmailDispatchLogs(logs: EmailDispatchRecord[]) {
  try {
    localStorage.setItem(EMAILS_STORAGE_KEY, JSON.stringify(logs.slice(0, 50)));
  } catch (err) {
    console.error('Failed to save email logs', err);
  }
}

/**
 * Web Audio API gentle synthesizer chime for live alerts
 */
export function playAlertChime() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Audio might be blocked if user hasn't interacted yet
  }
}

/**
 * Native Browser Push Notification
 */
export async function sendNativePushNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      });
    } catch {
      // ignore
    }
  }
}

/**
 * Evaluate all active alert rules against a price update
 */
export function evaluatePriceAlerts(
  ticker: TickerInfo,
  rsiValue?: number
): { triggeredAlerts: AlertRule[]; newNotifications: NotificationItem[]; newEmails: EmailDispatchRecord[] } {
  const rules = getAlertRules();
  const triggeredAlerts: AlertRule[] = [];
  const newNotifications: NotificationItem[] = [];
  const newEmails: EmailDispatchRecord[] = [];

  let rulesUpdated = false;

  for (const rule of rules) {
    if (!rule.active || rule.symbol !== ticker.symbol) continue;

    let conditionMet = false;
    let message = '';

    switch (rule.type) {
      case 'price_above':
        if (ticker.price >= rule.threshold) {
          conditionMet = true;
          message = `${ticker.symbol} traded at \$${ticker.price.toFixed(2)}, crossing above your threshold of \$${rule.threshold.toFixed(2)}.`;
        }
        break;
      case 'price_below':
        if (ticker.price <= rule.threshold) {
          conditionMet = true;
          message = `${ticker.symbol} dropped to \$${ticker.price.toFixed(2)}, falling below your threshold of \$${rule.threshold.toFixed(2)}.`;
        }
        break;
      case 'percent_change':
        if (Math.abs(ticker.changePercent) >= rule.threshold) {
          conditionMet = true;
          message = `${ticker.symbol} moved ${ticker.changePercent > 0 ? '+' : ''}${ticker.changePercent.toFixed(2)}% in 24h (threshold: ±${rule.threshold}%).`;
        }
        break;
      case 'rsi_overbought':
        if (rsiValue !== undefined && rsiValue >= rule.threshold) {
          conditionMet = true;
          message = `${ticker.symbol} RSI reached ${rsiValue.toFixed(1)} (Overbought territory > ${rule.threshold}).`;
        }
        break;
      case 'rsi_oversold':
        if (rsiValue !== undefined && rsiValue <= rule.threshold) {
          conditionMet = true;
          message = `${ticker.symbol} RSI dropped to ${rsiValue.toFixed(1)} (Oversold territory < ${rule.threshold}).`;
        }
        break;
    }

    if (conditionMet) {
      // Throttle: don't retrigger within 15 minutes unless first time
      const lastTrig = rule.lastTriggered ? new Date(rule.lastTriggered).getTime() : 0;
      if (Date.now() - lastTrig > 15 * 60 * 1000) {
        rule.triggerCount += 1;
        rule.lastTriggered = new Date().toISOString();
        triggeredAlerts.push(rule);
        rulesUpdated = true;

        const notif: NotificationItem = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date().toISOString(),
          title: `Alert: ${ticker.symbol} Threshold Triggered`,
          message,
          symbol: ticker.symbol,
          type: 'alert',
          severity: rule.type === 'price_below' || (rsiValue && rsiValue < 30) ? 'warning' : 'info',
          read: false,
          emailDispatched: rule.notifyEmail,
        };
        newNotifications.push(notif);

        if (rule.notifyEmail) {
          const emailRecord: EmailDispatchRecord = {
            id: `eml_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            timestamp: new Date().toISOString(),
            recipient: rule.emailAddress || 'rameshpiriththi@gmail.com',
            subject: `[NeuralStock Alert] ${ticker.symbol} Triggered ${rule.type.replace('_', ' ').toUpperCase()}`,
            body: `${message}\n\nCurrent Price: \$${ticker.price.toFixed(2)}\n24h Change: ${ticker.changePercent > 0 ? '+' : ''}${ticker.changePercent.toFixed(2)}%\nTimestamp: ${new Date().toLocaleString()}`,
            status: 'delivered',
            symbol: ticker.symbol,
            triggerReason: `${rule.type} (${rule.threshold})`,
          };
          newEmails.push(emailRecord);
        }

        if (rule.notifyPush) {
          sendNativePushNotification(`NeuralStock: ${ticker.symbol} Alert`, message);
        }
      }
    }
  }

  if (rulesUpdated) {
    saveAlertRules(rules);
  }

  return { triggeredAlerts, newNotifications, newEmails };
}
