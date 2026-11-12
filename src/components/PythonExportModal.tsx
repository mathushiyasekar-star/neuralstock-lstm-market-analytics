import React, { useState } from 'react';
import { LSTMHyperparameters } from '../types/market';
import { generatePyTorchScript, generateRequirementsTxt, generateStreamlitScript } from '../services/pythonExporter';
import { X, Copy, Check, Download, Terminal, FileCode, Play } from 'lucide-react';

interface PythonExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  hyperparams: LSTMHyperparameters;
}

export const PythonExportModal: React.FC<PythonExportModalProps> = ({
  isOpen,
  onClose,
  symbol,
  hyperparams,
}) => {
  const [activeTab, setActiveTab] = useState<'streamlit' | 'pytorch' | 'requirements'>('streamlit');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const streamlitCode = generateStreamlitScript(symbol, hyperparams);
  const pytorchCode = generatePyTorchScript(symbol);
  const requirementsCode = generateRequirementsTxt();

  const currentCode =
    activeTab === 'streamlit'
      ? streamlitCode
      : activeTab === 'pytorch'
      ? pytorchCode
      : requirementsCode;

  const currentFilename =
    activeTab === 'streamlit'
      ? 'app_streamlit.py'
      : activeTab === 'pytorch'
      ? 'train_lstm_pytorch.py'
      : 'requirements.txt';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([currentCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="flex flex-col w-full max-w-4xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Python & Streamlit ML Export Studio</h3>
              <p className="text-xs text-slate-400">
                Executable Python scripts with PyTorch LSTM neural networks and Plotly interactive dashboard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Strip & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 border-b border-slate-800 bg-slate-950/30 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('streamlit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'streamlit'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" /> app_streamlit.py
            </button>

            <button
              onClick={() => setActiveTab('pytorch')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'pytorch'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Play className="w-3.5 h-3.5" /> train_lstm_pytorch.py
            </button>

            <button
              onClick={() => setActiveTab('requirements')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'requirements'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" /> requirements.txt
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied to Clipboard' : 'Copy Code'}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-md transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download {currentFilename}
            </button>
          </div>
        </div>

        {/* Code Content View */}
        <div className="flex-1 p-6 overflow-auto bg-slate-950 font-mono text-xs leading-relaxed text-slate-300 selection:bg-emerald-500/30">
          <pre className="whitespace-pre">{currentCode}</pre>
        </div>

        {/* Footer instruction note */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-400 flex items-center justify-between">
          <span>Run locally: <code className="text-emerald-400">streamlit run app_streamlit.py</code></span>
          <span>Configured for: <strong className="text-slate-200">{symbol}</strong> with lookback={hyperparams.lookbackDays}d, forecast={hyperparams.forecastDays}d</span>
        </div>
      </div>
    </div>
  );
};
