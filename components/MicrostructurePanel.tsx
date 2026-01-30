
import React, { useEffect, useState } from 'react';
import { MicrostructureData } from '../types';
import { Activity, BarChart2, Zap, History } from 'lucide-react';
import { MicrostructureHistoryModal } from './MicrostructureHistoryModal';

interface Props {
  data: MicrostructureData;
  symbol: string;
  isLive?: boolean;
}

export const MicrostructurePanel: React.FC<Props> = ({ data, symbol, isLive = false }) => {
  const [history, setHistory] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Local sparkline tracking for spread volatility
  useEffect(() => {
    setHistory(prev => [...prev.slice(-19), data.spread]);
  }, [data.spread]);

  const bids = data.depthLevels.filter(l => l.side === 'bid').sort((a, b) => b.price - a.price);
  const asks = data.depthLevels.filter(l => l.side === 'ask').sort((a, b) => a.price - b.price);
  const maxSize = Math.max(...data.depthLevels.map(l => l.size));

  return (
    <>
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-4 relative overflow-hidden">
        {isLive && (
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <span className="text-[8px] font-black text-blue-400 animate-pulse">LIVE FEED</span>
            <Zap size={8} className="text-blue-400 fill-blue-400" />
          </div>
        )}

        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <div className="flex items-center gap-2 text-blue-400">
            <Activity size={16} />
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">Microstructure L2</h3>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-blue-400 transition-colors"
            title="View Historical Microstructure"
          >
            <History size={14} />
          </button>
        </div>

        {/* Spread Volatility Sparkline */}
        <div className="h-8 w-full flex items-end gap-[2px] px-1 opacity-50">
          {history.map((val, i) => {
            const min = Math.min(...history);
            const max = Math.max(...history);
            const height = max === min ? 50 : ((val - min) / (max - min)) * 100;
            return (
              <div 
                key={i} 
                className="flex-1 bg-blue-500/40 rounded-t-[1px]" 
                style={{ height: `${Math.max(10, height)}%` }}
              />
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-px bg-zinc-800/50 text-[10px] mono">
          <div className="col-span-2 space-y-1 py-1">
            {asks.slice().reverse().map((level, i) => (
              <div key={`ask-${i}`} className="flex justify-between items-center px-2 relative h-4">
                <div 
                  className="absolute right-0 top-0 bottom-0 bg-rose-500/10 transition-all duration-700" 
                  style={{ width: `${(level.size / maxSize) * 100}%` }}
                />
                <span className="text-rose-400 z-10">{level.price.toFixed(2)}</span>
                <span className="text-zinc-500 z-10">{level.size.toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="col-span-2 py-1 bg-zinc-900/80 border-y border-zinc-800 flex justify-between px-2 items-center italic">
            <span className="text-zinc-500 text-[8px]">SPREAD VOL</span>
            <span className="text-blue-400 font-bold">{data.spread.toFixed(4)}</span>
          </div>

          <div className="col-span-2 space-y-1 py-1">
            {bids.map((level, i) => (
              <div key={`bid-${i}`} className="flex justify-between items-center px-2 relative h-4">
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-emerald-500/10 transition-all duration-700" 
                  style={{ width: `${(level.size / maxSize) * 100}%` }}
                />
                <span className="text-emerald-400 z-10">{level.price.toFixed(2)}</span>
                <span className="text-zinc-500 z-10">{level.size.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 flex justify-between items-center border-t border-zinc-800">
           <div className="flex flex-col">
             <span className="text-[8px] text-zinc-500 uppercase">Liquidity Score</span>
             <span className="text-[10px] text-blue-300 font-bold">{data.liquidityScore}/100</span>
           </div>
           <div className="text-right">
             <span className="text-[8px] text-zinc-500 uppercase block">Flow Bias</span>
             <span className={`text-[10px] font-bold uppercase ${
               data.orderFlowBias === 'Bullish' ? 'text-emerald-400' :
               data.orderFlowBias === 'Bearish' ? 'text-rose-400' : 'text-zinc-400'
             }`}>{data.orderFlowBias}</span>
           </div>
        </div>
      </div>

      <MicrostructureHistoryModal 
        symbol={symbol} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};
