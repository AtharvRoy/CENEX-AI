
import React from 'react';
import { MarketRegime } from '../types';
import { Layers } from 'lucide-react';

interface Props {
  regime: MarketRegime;
}

export const RegimeIndicator: React.FC<Props> = ({ regime }) => {
  const getRegimeColor = (r: string) => {
    if (r.includes('Risk-on')) return 'border-emerald-500 text-emerald-400 bg-emerald-500/5';
    if (r.includes('Risk-off')) return 'border-rose-500 text-rose-400 bg-rose-500/5';
    if (r.includes('High volatility')) return 'border-amber-500 text-amber-400 bg-amber-500/5';
    return 'border-blue-500 text-blue-400 bg-blue-500/5';
  };

  return (
    <div className={`px-4 py-2 border rounded-full flex items-center gap-3 transition-all duration-500 ${getRegimeColor(regime)}`}>
      <Layers size={14} className="animate-pulse" />
      <div className="flex flex-col">
        <span className="text-[8px] uppercase font-black tracking-[0.2em] opacity-60">Market Regime</span>
        <span className="text-xs font-bold uppercase tracking-wider">{regime}</span>
      </div>
    </div>
  );
};
