
import React, { useEffect, useState, useMemo } from 'react';
import { MicrostructureData } from '../types';
import { Activity, Zap, History, Download, Info } from 'lucide-react';
import { MicrostructureHistoryModal } from './MicrostructureHistoryModal';

interface Props {
  data: MicrostructureData;
  symbol: string;
  isLive?: boolean;
}

/**
 * Interactive Depth Chart Component
 * Visualizes cumulative volume for Bids and Asks
 */
const CumulativeDepthChart: React.FC<{ bids: any[], asks: any[], maxSize: number }> = ({ bids, asks, maxSize }) => {
  const [hoverData, setHoverData] = useState<{ price: number; volume: number; side: 'bid' | 'ask' } | null>(null);

  const processedBids = useMemo(() => {
    let cumulative = 0;
    return bids.map(b => {
      cumulative += b.size;
      return { ...b, cumulative };
    });
  }, [bids]);

  const processedAsks = useMemo(() => {
    let cumulative = 0;
    return asks.map(a => {
      cumulative += a.size;
      return { ...a, cumulative };
    });
  }, [asks]);

  const maxCumulative = Math.max(
    processedBids[processedBids.length - 1]?.cumulative || 0,
    processedAsks[processedAsks.length - 1]?.cumulative || 0,
    1
  );

  return (
    <div className="space-y-2 pt-2 border-t border-zinc-800/50">
      <div className="flex justify-between items-center px-1">
        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Aggregated Depth</span>
        {hoverData && (
          <span className={`text-[8px] font-mono font-bold ${hoverData.side === 'bid' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {hoverData.side.toUpperCase()}: {hoverData.price.toFixed(2)} @ Σ{hoverData.volume.toLocaleString()}
          </span>
        )}
      </div>
      <div className="h-16 w-full flex gap-px relative bg-zinc-950/50 rounded overflow-hidden border border-zinc-900">
        {/* Bid Side (Left) */}
        <div className="flex-1 flex flex-row-reverse items-end">
          {processedBids.map((b, i) => (
            <div
              key={`depth-bid-${i}`}
              className="h-full group relative flex-1"
              onMouseEnter={() => setHoverData({ price: b.price, volume: b.cumulative, side: 'bid' })}
              onMouseLeave={() => setHoverData(null)}
            >
              <div 
                className="absolute bottom-0 left-0 right-0 bg-emerald-500/20 group-hover:bg-emerald-500/40 transition-all border-t border-emerald-500/30"
                style={{ height: `${(b.cumulative / maxCumulative) * 100}%` }}
              />
            </div>
          ))}
        </div>
        {/* Ask Side (Right) */}
        <div className="flex-1 flex items-end">
          {processedAsks.map((a, i) => (
            <div
              key={`depth-ask-${i}`}
              className="h-full group relative flex-1"
              onMouseEnter={() => setHoverData({ price: a.price, volume: a.cumulative, side: 'ask' })}
              onMouseLeave={() => setHoverData(null)}
            >
              <div 
                className="absolute bottom-0 left-0 right-0 bg-rose-500/20 group-hover:bg-rose-500/40 transition-all border-t border-rose-500/30"
                style={{ height: `${(a.cumulative / maxCumulative) * 100}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const MicrostructurePanel: React.FC<Props> = ({ data, symbol, isLive = false }) => {
  const [history, setHistory] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  useEffect(() => {
    if (data?.spread !== undefined) {
      setHistory(prev => [...prev.slice(-19), data.spread]);
    }
  }, [data?.spread]);

  const exportCSV = () => {
    const headers = ["Timestamp", "Side", "Price", "Size"];
    const rows = (data.depthLevels || []).map(l => [
      new Date().toISOString(),
      l.side.toUpperCase(),
      l.price.toFixed(4),
      l.size
    ]);
    
    const csvContent = [
      ["Symbol", symbol],
      ["Spread", data.spread],
      ["Liquidity Score", data.liquidityScore],
      [],
      headers,
      ...rows
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CENEX_L2_${symbol}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!data) return null;

  const depthLevels = data.depthLevels || [];
  const bids = depthLevels.filter(l => l?.side === 'bid').sort((a, b) => b.price - a.price);
  const asks = depthLevels.filter(l => l?.side === 'ask').sort((a, b) => a.price - b.price);
  
  const sizes = depthLevels.map(l => l?.size || 0);
  const maxSize = sizes.length > 0 ? Math.max(...sizes) : 1;

  // Visual bias glow calculation
  const biasGlowClass = data.orderFlowBias === 'Bullish' 
    ? 'shadow-[inset_0_0_20px_rgba(16,185,129,0.05)] border-emerald-500/20' 
    : data.orderFlowBias === 'Bearish' 
      ? 'shadow-[inset_0_0_20px_rgba(244,63,94,0.05)] border-rose-500/20' 
      : 'border-zinc-800';

  return (
    <>
      <div className={`bg-zinc-900/40 border rounded-xl p-4 space-y-4 relative overflow-hidden transition-all duration-700 ${biasGlowClass}`}>
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
          <div className="flex items-center gap-1">
            <button 
              onClick={exportCSV}
              className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-emerald-400 transition-colors"
              title="Export Snapshot (CSV)"
            >
              <Download size={14} />
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-blue-400 transition-colors"
              title="View Historical Microstructure"
            >
              <History size={14} />
            </button>
          </div>
        </div>

        {/* Spread Volatility Sparkline */}
        <div className="h-8 w-full flex items-end gap-[2px] px-1 opacity-50">
          {history.length > 0 ? history.map((val, i) => {
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
          }) : (
            <div className="w-full h-full border-b border-dashed border-zinc-800" />
          )}
        </div>

        <div className="grid grid-cols-2 gap-px bg-zinc-800/50 text-[10px] mono">
          <div className="col-span-2 space-y-1 py-1">
            {asks.length > 0 ? asks.slice().reverse().map((level, i) => (
              <div key={`ask-${i}`} className="flex justify-between items-center px-2 relative h-4 group">
                <div 
                  className="absolute right-0 top-0 bottom-0 bg-rose-500/10 group-hover:bg-rose-500/20 transition-all duration-300 border-r-2 border-rose-500/40" 
                  style={{ width: `${((level.size || 0) / maxSize) * 100}%` }}
                />
                <span className="text-rose-400 z-10 font-bold">{(level.price || 0).toFixed(2)}</span>
                <span className="text-zinc-500 z-10">{(level.size || 0).toLocaleString()}</span>
              </div>
            )) : <div className="text-center py-2 text-zinc-700 italic">No Ask Liquidity</div>}
          </div>

          <div className="col-span-2 py-1 bg-zinc-900/80 border-y border-zinc-800 flex justify-between px-2 items-center italic">
            <span className="text-zinc-500 text-[8px] font-bold">MID-SPREAD PRICE</span>
            <span className="text-blue-400 font-bold">{(data.spread || 0).toFixed(4)}</span>
          </div>

          <div className="col-span-2 space-y-1 py-1">
            {bids.length > 0 ? bids.map((level, i) => (
              <div key={`bid-${i}`} className="flex justify-between items-center px-2 relative h-4 group">
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-all duration-300 border-l-2 border-emerald-500/40" 
                  style={{ width: `${((level.size || 0) / maxSize) * 100}%` }}
                />
                <span className="text-emerald-400 z-10 font-bold">{(level.price || 0).toFixed(2)}</span>
                <span className="text-zinc-500 z-10">{(level.size || 0).toLocaleString()}</span>
              </div>
            )) : <div className="text-center py-2 text-zinc-700 italic">No Bid Liquidity</div>}
          </div>
        </div>

        {/* Aggregated Depth Chart */}
        <CumulativeDepthChart bids={bids} asks={asks} maxSize={maxSize} />

        <div className="pt-2 flex justify-between items-center border-t border-zinc-800">
           <div className="flex flex-col">
             <span className="text-[8px] text-zinc-500 uppercase font-bold">Liquidity Score</span>
             <span className="text-[10px] text-blue-300 font-black">{(data.liquidityScore || 0)}/100</span>
           </div>
           <div className="text-right flex flex-col items-end">
             <span className="text-[8px] text-zinc-500 uppercase font-bold block">Order Flow Bias</span>
             <div className="flex items-center gap-1.5">
               {data.orderFlowBias !== 'Neutral' && (
                 <div className={`w-1 h-1 rounded-full animate-ping ${data.orderFlowBias === 'Bullish' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
               )}
               <span className={`text-[10px] font-black uppercase ${
                 data.orderFlowBias === 'Bullish' ? 'text-emerald-400' :
                 data.orderFlowBias === 'Bearish' ? 'text-rose-400' : 'text-zinc-400'
               }`}>{data.orderFlowBias || 'Neutral'}</span>
             </div>
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
