import React, { useState } from 'react';
import { UserAccount, UserRole } from '../types/market';
import { Shield, Users, Database, Activity, Check, UserCheck, AlertCircle } from 'lucide-react';

interface AdminConsoleProps {
  users: UserAccount[];
  currentUser: UserAccount;
  onUpdateUserRole: (userId: string, newRole: UserRole) => void;
  onRefreshDataFeed: () => void;
  totalAlerts: number;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  users,
  currentUser,
  onUpdateUserRole,
  onRefreshDataFeed,
  totalAlerts,
}) => {
  const [dataFeedStatus, setDataFeedStatus] = useState<'nominal' | 'reconnecting'>('nominal');
  const [feedMessage, setFeedMessage] = useState<string | null>(null);

  const handleManualFeedSync = () => {
    setDataFeedStatus('reconnecting');
    setFeedMessage('Ingesting latest consolidated market feeds and recalculating volatility baselines...');
    setTimeout(() => {
      onRefreshDataFeed();
      setDataFeedStatus('nominal');
      setFeedMessage('Market feed synchronized across all 8 asset streams.');
      setTimeout(() => setFeedMessage(null), 3000);
    }, 800);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Users className="w-4 h-4 text-sky-400" />
            <span>Registered Users</span>
          </div>
          <div className="text-2xl font-mono font-bold text-slate-100">{users.length}</div>
          <span className="text-[11px] text-slate-500">RBAC accounts provisioned</span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Market Data Pipeline</span>
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-400">Nominal</div>
          <span className="text-[11px] text-slate-500">8 High-Frequency Tickers</span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Active Alert Rules</span>
          </div>
          <div className="text-2xl font-mono font-bold text-slate-100">{totalAlerts}</div>
          <span className="text-[11px] text-slate-500">Evaluated every 2s</span>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Shield className="w-4 h-4 text-purple-400" />
            <span>Auth Security</span>
          </div>
          <div className="text-2xl font-mono font-bold text-purple-400">Enforced</div>
          <span className="text-[11px] text-slate-500">SHA-256 WebCrypto Salted</span>
        </div>
      </div>

      {feedMessage && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-md text-xs text-emerald-300 flex items-center justify-between">
          <span>{feedMessage}</span>
          <Check className="w-4 h-4 text-emerald-400" />
        </div>
      )}

      {/* User Management & RBAC Table */}
      <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Role-Based Access Control (RBAC) Management</h3>
            <p className="text-xs text-slate-400">
              Grant and revoke operational roles (Admin, Analyst, Trader) across accounts
            </p>
          </div>
          <button
            onClick={handleManualFeedSync}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors"
          >
            Force Sync Market Feeds
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/60 text-slate-400 font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">User Name</th>
                <th className="py-2.5 px-3">Email Address</th>
                <th className="py-2.5 px-3">Assigned Role</th>
                <th className="py-2.5 px-3">Permissions Scope</th>
                <th className="py-2.5 px-3">Created</th>
                <th className="py-2.5 px-3 text-right">Role Modifier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
              {users.map((u) => {
                const isCurrent = u.id === currentUser.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-semibold text-slate-100 font-sans">
                      {u.name} {isCurrent && <span className="text-[10px] text-emerald-400 font-mono">(You)</span>}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-sans">{u.email}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold font-sans ${
                          u.role === 'admin'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                            : u.role === 'analyst'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-sans text-[11px]">
                      {u.role === 'admin'
                        ? 'Full System Oversight, Model Policies, User Management, Market Feed'
                        : u.role === 'analyst'
                        ? 'LSTM Hyperparameter Tuning, Model Training, Python Export, Metrics Backtest'
                        : 'Portfolio Management, Paper Trading Simulator, Alerts, Push Notifications'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <select
                        value={u.role}
                        disabled={isCurrent}
                        onChange={(e) => onUpdateUserRole(u.id, e.target.value as UserRole)}
                        className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs font-sans focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                      >
                        <option value="trader">Trader</option>
                        <option value="analyst">Analyst</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
