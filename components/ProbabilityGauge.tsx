
import React from 'react';
import { ProbabilityDistribution } from '../types';

interface Props {
  data: ProbabilityDistribution;
  label: string;
}

export const ProbabilityGauge: React.FC<Props> = ({ data, label }) => {
  if (!data) return null;

  const bullish = data.bullish || 0;
  const neutral = data.neutral || 0;
  const bearish = data.bearish || 0;
  
  const total = bullish + neutral + bearish || 1; // Prevent div by 0
  const bullishPct = (bullish / total) * 100;
  const neutralPct = (neutral / total) * 100;
  const bearishPct = (bearish / total) * 100;

  return (
    <div className="flex flex-col gap-2 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
      <div className="flex justify-between items-center text-xs font-semibold uppercase text-zinc-400">
        <span>{label}</span>
      </div>
      <div className="h-4 w-full flex rounded-full overflow-hidden bg-zinc-800">
        <div 
          className="h-full bg-emerald-500 transition-all duration-1000" 
          style={{ width: `${bullishPct}%` }} 
          title={`Bullish: ${bullish}%`}
        />
        <div 
          className="h-full bg-zinc-500 transition-all duration-1000" 
          style={{ width: `${neutralPct}%` }} 
          title={`Neutral: ${neutral}%`}
        />
        <div 
          className="h-full bg-rose-500 transition-all duration-1000" 
          style={{ width: `${bearishPct}%` }} 
          title={`Bearish: ${bearish}%`}
        />
      </div>
      <div className="flex justify-between text-[10px] mono text-zinc-500">
        <span className="text-emerald-400">BULL: {bullish}%</span>
        <span>NEU: {neutral}%</span>
        <span className="text-rose-400">BEAR: {bearish}%</span>
      </div>
    </div>
  );
};
