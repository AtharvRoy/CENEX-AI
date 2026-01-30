
import React from 'react';
import { ProbabilityDistribution } from '../types';

interface Props {
  data: ProbabilityDistribution;
  label: string;
}

export const ProbabilityGauge: React.FC<Props> = ({ data, label }) => {
  const total = data.bullish + data.neutral + data.bearish;
  const bullishPct = (data.bullish / total) * 100;
  const neutralPct = (data.neutral / total) * 100;
  const bearishPct = (data.bearish / total) * 100;

  return (
    <div className="flex flex-col gap-2 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
      <div className="flex justify-between items-center text-xs font-semibold uppercase text-zinc-400">
        <span>{label}</span>
      </div>
      <div className="h-4 w-full flex rounded-full overflow-hidden bg-zinc-800">
        <div 
          className="h-full bg-emerald-500 transition-all duration-1000" 
          style={{ width: `${bullishPct}%` }} 
          title={`Bullish: ${data.bullish}%`}
        />
        <div 
          className="h-full bg-zinc-500 transition-all duration-1000" 
          style={{ width: `${neutralPct}%` }} 
          title={`Neutral: ${data.neutral}%`}
        />
        <div 
          className="h-full bg-rose-500 transition-all duration-1000" 
          style={{ width: `${bearishPct}%` }} 
          title={`Bearish: ${data.bearish}%`}
        />
      </div>
      <div className="flex justify-between text-[10px] mono text-zinc-500">
        <span className="text-emerald-400">BULL: {data.bullish}%</span>
        <span>NEU: {data.neutral}%</span>
        <span className="text-rose-400">BEAR: {data.bearish}%</span>
      </div>
    </div>
  );
};
