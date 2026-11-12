import React, { useState } from 'react';
import { EpochLoss, LSTMHyperparameters, ModelMetrics, PredictionResult, TickerInfo } from '../types/market';
import { Cpu, Play, CheckCircle2, Sliders, Layers, BarChart, ArrowUpRight, ArrowDownRight, RefreshCw, Terminal, Download } from 'lucide-react';

interface LSTMLabProps {
  currentTicker: TickerInfo;
  hyperparams: LSTMHyperparameters;
  onUpdateHyperparams: (hp: LSTMHyperparameters) => void;
  onTrainModel: () => Promise<void>;
  isTraining: boolean;
  trainingEpoch: number;
  currentEpochLoss: EpochLoss | null;
  predictionResult: PredictionResult | null;
  onOpenPythonModal: () => void;
  canTrain: boolean;
}

export const LSTMLab: React.FC<LSTMLabProps> = ({
  currentTicker,
  hyperparams,
  onUpdateHyperparams,
  onTrainModel,
  isTraining,
  trainingEpoch,
  currentEpochLoss,
  predictionResult,
  onOpenPythonModal,
  canTrain,
}) => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'residuals' | 'architecture'>('metrics');

  const handleSliderChange = <K extends keyof LSTMHyperparameters>(key: K, value: LSTMHyperparameters[K]) => {
    onUpdateHyperparams({
      ...hyperparams,
      [key]: value,
    });
  };

  const metrics = predictionResult?.metrics;

  return (
    <div className="flex flex-col gap-4 bg-slate-900/60 border border-slate-800 rounded-lg p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-slate-100">LSTM Recurrent Neural Network Lab</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Train multi-layer LSTM cells for non-linear temporal price forecasting on {currentTicker.symbol}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenPythonModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors"
          >
            <Terminal className="w-3.5 h-3.5 text-sky-400" />
            Export Python / PyTorch Code
          </button>

          <button
            onClick={onTrainModel}
            disabled={isTraining || !canTrain}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md shadow-sm transition-all ${
              isTraining
                ? 'bg-emerald-600/50 text-emerald-200 cursor-not-allowed'
                : canTrain
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isTraining ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Training Epoch {trainingEpoch}/{hyperparams.epochs}...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Train Model ({currentTicker.symbol})
              </>
            )}
          </button>
        </div>
      </div>

      {!canTrain && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-md text-xs text-amber-300">
          Your current account role (Trader) has read-only access to trained models. Switch to <strong>Analyst</strong> or <strong>Admin</strong> in the top navigation to adjust hyperparameters and retrain the LSTM network.
        </div>
      )}

      {/* Hyperparameter Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-950/40 border border-slate-800/80 rounded-md">
        {/* Lookback Days */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-400">Lookback Sequence (Days)</span>
            <span className="font-mono text-emerald-400 font-semibold">{hyperparams.lookbackDays}d</span>
          </div>
          <input
            type="range"
            min={10}
            max={60}
            step={5}
            value={hyperparams.lookbackDays}
            disabled={!canTrain || isTraining}
            onChange={(e) => handleSliderChange('lookbackDays', parseInt(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Forecast Horizon */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-400">Forecast Horizon (Days)</span>
            <span className="font-mono text-emerald-400 font-semibold">{hyperparams.forecastDays}d</span>
          </div>
          <input
            type="range"
            min={3}
            max={30}
            step={1}
            value={hyperparams.forecastDays}
            disabled={!canTrain || isTraining}
            onChange={(e) => handleSliderChange('forecastDays', parseInt(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Hidden Units */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-400">LSTM Hidden Units</span>
            <span className="font-mono text-sky-400 font-semibold">{hyperparams.hiddenUnits} units</span>
          </div>
          <div className="flex gap-1.5">
            {[32, 64, 128].map((units) => (
              <button
                key={units}
                type="button"
                disabled={!canTrain || isTraining}
                onClick={() => handleSliderChange('hiddenUnits', units)}
                className={`flex-1 py-1 text-xs font-mono rounded border transition-colors ${
                  hyperparams.hiddenUnits === units
                    ? 'border-sky-500 bg-sky-500/20 text-sky-300 font-semibold'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {units}
              </button>
            ))}
          </div>
        </div>

        {/* Epochs */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-400">Training Epochs</span>
            <span className="font-mono text-purple-400 font-semibold">{hyperparams.epochs}</span>
          </div>
          <input
            type="range"
            min={10}
            max={80}
            step={5}
            value={hyperparams.epochs}
            disabled={!canTrain || isTraining}
            onChange={(e) => handleSliderChange('epochs', parseInt(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>
      </div>

      {/* Live Training Progress Banner */}
      {isTraining && currentEpochLoss && (
        <div className="flex items-center justify-between p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-md text-xs">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-emerald-300 font-medium">
              Epoch {trainingEpoch} / {hyperparams.epochs} in progress
            </span>
          </div>
          <div className="flex items-center gap-4 font-mono">
            <span>Train MSE: <strong className="text-emerald-400">{currentEpochLoss.trainLoss.toFixed(5)}</strong></span>
            <span>Val MSE: <strong className="text-sky-400">{currentEpochLoss.valLoss.toFixed(5)}</strong></span>
          </div>
        </div>
      )}

      {/* Metrics Cards Strip */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-md">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">RMSE</span>
            <span className="text-lg font-mono font-bold text-slate-100 tabular-nums">
              ${metrics.rmse.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Root Mean Sq Error</span>
          </div>

          <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-md">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">MAE</span>
            <span className="text-lg font-mono font-bold text-slate-100 tabular-nums">
              ${metrics.mae.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Mean Abs Error</span>
          </div>

          <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-md">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">MAPE</span>
            <span className="text-lg font-mono font-bold text-emerald-400 tabular-nums">
              {metrics.mape.toFixed(2)}%
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Mean Abs % Error</span>
          </div>

          <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-md">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Directional Acc.</span>
            <span className="text-lg font-mono font-bold text-emerald-400 tabular-nums">
              {metrics.directionalAccuracy.toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Trend Match Rate</span>
          </div>

          <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-md">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">R² Score</span>
            <span className="text-lg font-mono font-bold text-sky-400 tabular-nums">
              {metrics.r2Score.toFixed(3)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Goodness of Fit</span>
          </div>

          <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-md">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Train Latency</span>
            <span className="text-lg font-mono font-bold text-slate-100 tabular-nums">
              {metrics.trainingTimeSec}s
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">BPTT Convergence</span>
          </div>
        </div>
      )}

      {/* Tabs for Loss Curves vs Residual Comparison */}
      <div className="flex items-center gap-2 border-b border-slate-800 pt-2 text-xs">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`pb-2 px-1 font-medium transition-colors ${
            activeTab === 'metrics'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Epoch Loss Curve
        </button>
        <button
          onClick={() => setActiveTab('residuals')}
          className={`pb-2 px-1 font-medium transition-colors ${
            activeTab === 'residuals'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Ground Truth vs Prediction Backtest
        </button>
        <button
          onClick={() => setActiveTab('architecture')}
          className={`pb-2 px-1 font-medium transition-colors ${
            activeTab === 'architecture'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          LSTM Architecture Spec
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'metrics' && predictionResult && (
        <div className="h-44 w-full bg-slate-950/60 p-3 rounded-md flex flex-col justify-between">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
            <span>Training & Validation Loss Convergence (Mean Squared Error)</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-emerald-400 inline-block" /> Train Loss</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-sky-400 inline-block" /> Val Loss</span>
            </div>
          </div>
          {/* Mini SVG Loss Graph */}
          <div className="flex-1 w-full relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
              {/* Grid */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(148, 163, 184, 0.1)" strokeDasharray="3 3" />
              <line x1="0" y1="60" x2="500" y2="60" stroke="rgba(148, 163, 184, 0.1)" strokeDasharray="3 3" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="rgba(148, 163, 184, 0.1)" strokeDasharray="3 3" />

              {/* Train Loss Path */}
              {predictionResult.lossHistory.length > 1 && (
                <path
                  d={predictionResult.lossHistory
                    .map((item, idx) => {
                      const x = (idx / (predictionResult.lossHistory.length - 1)) * 500;
                      const y = Math.max(5, Math.min(115, 115 - (item.trainLoss / 0.1) * 110));
                      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                />
              )}

              {/* Val Loss Path */}
              {predictionResult.lossHistory.length > 1 && (
                <path
                  d={predictionResult.lossHistory
                    .map((item, idx) => {
                      const x = (idx / (predictionResult.lossHistory.length - 1)) * 500;
                      const y = Math.max(5, Math.min(115, 115 - (item.valLoss / 0.1) * 110));
                      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
              )}
            </svg>
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-1">
            <span>Epoch 1</span>
            <span>Epoch {Math.floor(hyperparams.epochs / 2)}</span>
            <span>Epoch {hyperparams.epochs}</span>
          </div>
        </div>
      )}

      {activeTab === 'residuals' && predictionResult && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/60 text-slate-400 font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Actual Close</th>
                <th className="py-2 px-3">LSTM Fitted</th>
                <th className="py-2 px-3">Residual Error</th>
                <th className="py-2 px-3">Error %</th>
                <th className="py-2 px-3">Direction Match</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
              {predictionResult.historicalDates.slice(-8).map((date, idx) => {
                const globalIdx = predictionResult.historicalDates.length - 8 + idx;
                const actual = predictionResult.actualPrices[globalIdx];
                const pred = predictionResult.fittedPrices[globalIdx];
                const err = pred !== null ? pred - actual : 0;
                const errPct = pred !== null ? (Math.abs(err) / actual) * 100 : 0;
                const isMatch = Math.abs(errPct) < 2.5;

                return (
                  <tr key={date} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 text-slate-300">{date}</td>
                    <td className="py-2 px-3 text-slate-100 font-medium">${actual.toFixed(2)}</td>
                    <td className="py-2 px-3 text-emerald-400">${pred?.toFixed(2) || '--'}</td>
                    <td className={`py-2 px-3 ${err >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {err >= 0 ? '+' : ''}${err.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-slate-300">{errPct.toFixed(2)}%</td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center gap-1 ${isMatch ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {isMatch ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {isMatch ? 'Aligned' : 'Divergent'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'architecture' && (
        <div className="p-4 bg-slate-950/60 rounded-md font-mono text-xs text-slate-300 space-y-2">
          <div className="text-slate-400 font-semibold mb-2">Mathematical Formulation & Layer Graph:</div>
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded text-slate-200 space-y-1">
            <div>Input Sequence: x(t) ∈ ℝ¹ (MinMax Scaled OHLCV Sequence, Window = {hyperparams.lookbackDays})</div>
            <div className="text-emerald-400 mt-1">Forget Gate: f(t) = σ(W_f · x(t) + U_f · h(t-1) + b_f)</div>
            <div className="text-sky-400">Input Gate: i(t) = σ(W_i · x(t) + U_i · h(t-1) + b_i)</div>
            <div className="text-purple-400">Candidate State: C̃(t) = tanh(W_c · x(t) + U_c · h(t-1) + b_c)</div>
            <div className="text-amber-400">Cell Memory Update: C(t) = f(t) ⊙ C(t-1) + i(t) ⊙ C̃(t)</div>
            <div className="text-teal-400">Output Gate: o(t) = σ(W_o · x(t) + U_o · h(t-1) + b_o)</div>
            <div className="text-slate-300">Hidden Output: h(t) = o(t) ⊙ tanh(C(t)) [dim = {hyperparams.hiddenUnits}]</div>
            <div className="text-slate-400 mt-1">Dense Projection: ŷ = W_y · h(L) + b_y → InverseMinMax(ŷ)</div>
          </div>
        </div>
      )}
    </div>
  );
};
