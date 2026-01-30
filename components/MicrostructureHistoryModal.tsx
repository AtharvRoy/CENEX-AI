
import React, { useEffect, useState } from 'react';
// Added Zap to the import list
import { X, TrendingUp, Droplets, Activity, Zap } from 'lucide-react';
import { marketDataStore } from '../services/storageService';

interface Props {
  symbol: string;
  isOpen: boolean;
  onClose: () => void;
}

interface HistoryEntry {
  timestamp: number;
  bid: number;
  ask: number;
  spread: number;
  liquidityScore: number;
}

export const MicrostructureHistoryModal: React.FC<Props> = ({ symbol, isOpen, onClose }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      marketDataStore.getRecentHistory(symbol, 100).then((data) => {
        setHistory(data as HistoryEntry[]);
        setLoading(false);
      });
    }
  }, [isOpen, symbol]);

  if (!isOpen) return null;

  const renderChart = (
    data: number[], 
    color: string, 
    height: number = 80,
    areaColor?: string
  ) => {
    if (data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const points = data.map((val, i) => ({
      x: (i / (data.length - 1)) * 100,
      y: height - ((val - min) / range) * height
    }));

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = `${pathD} L 100 ${height} L 0 ${height} Z`;

    return (
      <svg viewBox={`0 0 100 ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
        {areaColor && <path d={areaD} fill={areaColor} opacity="0.1" />}
        <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-900">
          <div>
            <h2 className="text-xl font-black tracking-tight text-white uppercase flex items-center gap-3">
              <Activity className="text-blue-500" />
              Microstructure Time-Series: {symbol}
            </h2>
            <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-medium">Historical Order Flow Dynamics • Local Index Store</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-4">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-zinc-500 uppercase tracking-widest">Querying Local Store...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-zinc-600 italic">
              Insufficient data points in local storage for time-series analysis.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {/* Bid/Ask Price History */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={12} className="text-emerald-500" /> Bid/Ask Variance
                  </span>
                  <div className="flex gap-4 text-[10px] mono">
                    <span className="text-rose-400">ASK: {history[history.length-1].ask.toFixed(2)}</span>
                    <span className="text-emerald-400">BID: {history[history.length-1].bid.toFixed(2)}</span>
                  </div>
                </div>
                <div className="h-40 bg-zinc-900/30 border border-zinc-900 rounded-xl p-4 relative">
                  <div className="absolute inset-x-4 inset-y-4">
                    {renderChart(history.map(h => h.ask), '#fb7185', 100)}
                    {renderChart(history.map(h => h.bid), '#10b981', 100)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Spread Trends */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <Zap size={12} className="text-blue-500" /> Spread Compression
                    </span>
                    <span className="text-[10px] mono text-blue-400">CUR: {history[history.length-1].spread.toFixed(4)}</span>
                  </div>
                  <div className="h-32 bg-zinc-900/30 border border-zinc-900 rounded-xl p-4 relative">
                    <div className="absolute inset-x-4 inset-y-4">
                      {renderChart(history.map(h => h.spread), '#3b82f6', 60, '#3b82f6')}
                    </div>
                  </div>
                </div>

                {/* Liquidity Scores */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <Droplets size={12} className="text-cyan-500" /> Depth Intensity
                    </span>
                    <span className="text-[10px] mono text-cyan-400">IDX: {history[history.length-1].liquidityScore}</span>
                  </div>
                  <div className="h-32 bg-zinc-900/30 border border-zinc-900 rounded-xl p-4 relative">
                    <div className="absolute inset-x-4 inset-y-4">
                      {renderChart(history.map(h => h.liquidityScore), '#06b6d4', 60, '#06b6d4')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-900 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-colors"
          >
            Acknowledge Session
          </button>
        </div>
      </div>
    </div>
  );
};
