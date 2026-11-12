import React, { useState } from 'react';
import { AlertRule, AlertType, EmailDispatchRecord, TickerInfo, UserAccount } from '../types/market';
import { Bell, Mail, Smartphone, Plus, Trash2, CheckCircle2, Send, AlertTriangle, ShieldCheck, Volume2 } from 'lucide-react';
import { playAlertChime, sendNativePushNotification } from '../services/alertEngine';

interface AlertsManagerProps {
  currentUser: UserAccount;
  tickers: TickerInfo[];
  alertRules: AlertRule[];
  emailLogs: EmailDispatchRecord[];
  onAddRule: (rule: Omit<AlertRule, 'id' | 'createdAt' | 'triggerCount'>) => void;
  onToggleRule: (ruleId: string) => void;
  onDeleteRule: (ruleId: string) => void;
  onSendTestAlert: (symbol: string, email: string) => void;
}

export const AlertsManager: React.FC<AlertsManagerProps> = ({
  currentUser,
  tickers,
  alertRules,
  emailLogs,
  onAddRule,
  onToggleRule,
  onDeleteRule,
  onSendTestAlert,
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>(tickers[0]?.symbol || 'NVDA');
  const [alertType, setAlertType] = useState<AlertType>('price_above');
  const [threshold, setThreshold] = useState<number>(145.0);
  const [notifyEmail, setNotifyEmail] = useState<boolean>(true);
  const [emailAddress, setEmailAddress] = useState<string>(currentUser.email || 'rameshpiriththi@gmail.com');
  const [notifyPush, setNotifyPush] = useState<boolean>(true);
  const [pushStatus, setPushStatus] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  const handleRequestPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      setPushStatus(perm);
      if (perm === 'granted') {
        sendNativePushNotification('NeuralStock Push Enabled', 'Real-time market movement push notifications are now active on this device.');
        playAlertChime();
      }
    }
  };

  const handleSubmitRule = (e: React.FormEvent) => {
    e.preventDefault();
    onAddRule({
      userId: currentUser.id,
      symbol: selectedSymbol,
      type: alertType,
      threshold,
      notifyEmail,
      emailAddress,
      notifyPush,
      active: true,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner: Real-time Multi-Channel Delivery Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Email Alert Channel */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg flex items-start gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Automated Email Dispatch</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Instant notification delivery to <strong className="text-slate-200">{currentUser.email}</strong> upon price or indicator breach.
            </p>
            <button
              onClick={() => onSendTestAlert(selectedSymbol, emailAddress)}
              className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1"
            >
              <Send className="w-3 h-3" /> Send Test Alert Email
            </button>
          </div>
        </div>

        {/* Push Notification Channel */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg flex items-start gap-3">
          <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-md">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-100">Mobile & Desktop Push</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Status: <span className="font-mono text-slate-200 capitalize">{pushStatus}</span>
            </p>
            {pushStatus !== 'granted' ? (
              <button
                onClick={handleRequestPushPermission}
                className="mt-2 text-xs text-sky-400 hover:text-sky-300 font-medium inline-flex items-center gap-1"
              >
                <Bell className="w-3 h-3" /> Enable Browser Push
              </button>
            ) : (
              <button
                onClick={() => {
                  sendNativePushNotification('NeuralStock Alert', 'Push notification channel verified active.');
                  playAlertChime();
                }}
                className="mt-2 text-xs text-slate-400 hover:text-slate-200 font-medium inline-flex items-center gap-1"
              >
                <Volume2 className="w-3 h-3" /> Test Push & Sound
              </button>
            )}
          </div>
        </div>

        {/* Real-time Frequency Telemetry */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg flex items-start gap-3">
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-md">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Threshold Engine</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous background prober checks tick deviations and LSTM indicator conditions every 2 seconds.
            </p>
            <span className="text-xs text-purple-400 font-mono mt-1 block">
              {alertRules.filter((r) => r.active).length} Rules Active
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Rule Form */}
        <div className="lg:col-span-1 p-5 bg-slate-900/60 border border-slate-800 rounded-lg flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Plus className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-100">Create New Movement Alert</h3>
          </div>

          <form onSubmit={handleSubmitRule} className="flex flex-col gap-3.5 text-xs">
            {/* Ticker Selection */}
            <div>
              <label className="text-slate-400 block mb-1">Asset Symbol</label>
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
              >
                {tickers.map((t) => (
                  <option key={t.symbol} value={t.symbol}>
                    {t.symbol} - {t.name} (${t.price.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {/* Condition Type */}
            <div>
              <label className="text-slate-400 block mb-1">Trigger Condition</label>
              <select
                value={alertType}
                onChange={(e) => setAlertType(e.target.value as AlertType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="price_above">Price Crosses Above ($)</option>
                <option value="price_below">Price Drops Below ($)</option>
                <option value="percent_change">24h Price Move &gt; X (%)</option>
                <option value="rsi_overbought">RSI Crosses Overbought (&gt; 70)</option>
                <option value="rsi_oversold">RSI Crosses Oversold (&lt; 30)</option>
              </select>
            </div>

            {/* Threshold Input */}
            <div>
              <label className="text-slate-400 block mb-1">
                Threshold Value {alertType.includes('percent') ? '(%)' : alertType.includes('rsi') ? '(RSI points)' : '($)'}
              </label>
              <input
                type="number"
                step="any"
                required
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Delivery Channels */}
            <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
              <span className="text-slate-400 block">Notification Channels</span>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
                />
                <span>Email Notification</span>
              </label>

              {notifyEmail && (
                <input
                  type="email"
                  required
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="Target Email Address"
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 mt-1"
                />
              )}

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={notifyPush}
                  onChange={(e) => setNotifyPush(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
                />
                <span>Mobile & Desktop Push Notification</span>
              </label>
            </div>

            <button
              type="submit"
              className="mt-2 py-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-md transition-colors"
            >
              Add Alert Rule
            </button>
          </form>
        </div>

        {/* Configured Rules & Email Dispatch Log */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Active Alert Rules Table */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg">
            <h3 className="text-sm font-semibold text-slate-100 mb-3">Configured Price & Indicator Rules</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950/60 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Symbol</th>
                    <th className="py-2.5 px-3">Condition</th>
                    <th className="py-2.5 px-3">Threshold</th>
                    <th className="py-2.5 px-3">Channels</th>
                    <th className="py-2.5 px-3">Triggered</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
                  {alertRules.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500">
                        No active alert rules configured.
                      </td>
                    </tr>
                  ) : (
                    alertRules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-semibold text-slate-200">{rule.symbol}</td>
                        <td className="py-2.5 px-3 text-slate-300 capitalize font-sans">
                          {rule.type.replace('_', ' ')}
                        </td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">
                          {rule.type.includes('percent')
                            ? `±${rule.threshold}%`
                            : rule.type.includes('rsi')
                            ? `${rule.threshold}`
                            : `$${rule.threshold.toFixed(2)}`}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          <div className="flex items-center gap-2">
                            {rule.notifyEmail && (
                              <span title={rule.emailAddress}>
                                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                              </span>
                            )}
                            {rule.notifyPush && (
                              <span title="Push Enabled">
                                <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {rule.triggerCount > 0 ? (
                            <span className="text-amber-400">{rule.triggerCount} times</span>
                          ) : (
                            <span className="text-slate-500">Pending</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onToggleRule(rule.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-sans transition-colors ${
                                rule.active
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {rule.active ? 'Active' : 'Paused'}
                            </button>
                            <button
                              onClick={() => onDeleteRule(rule.id)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                              title="Delete rule"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Email Dispatch History Log */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-100">Automated Email Dispatch Audit Ledger</h3>
              <span className="text-xs text-slate-400 font-mono">{emailLogs.length} Records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950/60 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Timestamp</th>
                    <th className="py-2 px-3">Recipient</th>
                    <th className="py-2 px-3">Subject</th>
                    <th className="py-2 px-3">Trigger Reason</th>
                    <th className="py-2 px-3">Delivery Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
                  {emailLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">
                        No emails dispatched yet.
                      </td>
                    </tr>
                  ) : (
                    emailLogs.slice(0, 5).map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-slate-400 text-[11px]">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-2 px-3 text-slate-300 font-sans">{log.recipient}</td>
                        <td className="py-2 px-3 text-slate-100 font-sans max-w-[200px] truncate" title={log.subject}>
                          {log.subject}
                        </td>
                        <td className="py-2 px-3 text-amber-400 font-sans">{log.triggerReason}</td>
                        <td className="py-2 px-3">
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
                            <CheckCircle2 className="w-3 h-3" /> Delivered
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
