
import React, { useEffect, useState } from 'react';
import { NarrativeIntelligence } from '../types';
import { Radar, Users, Briefcase, TrendingUp, Sparkles } from 'lucide-react';
import { marketDataStore } from '../services/storageService';

interface Props {
  data: NarrativeIntelligence;
  symbol: string;
}

export const NarrativePanel: React.FC<Props> = ({ data, symbol }) => {
  const [history, setHistory] = useState<number[]>([]);

  useEffect(() => {
    if (symbol) {
      marketDataStore.getNarrativeHistory(symbol, 20).then(h => {
        if (Array.isArray(h)) {
          setHistory(h.map(entry => entry?.sentimentIndex || 0));
        }
      });
    }
  }, [symbol, data]);

  if (!data) return null;

  const renderSentimentBar = (label: string, value: number, color: string) => (
    <div className="space-y-1">
      <div className="flex justify-between text-[8px] uppercase font-bold text-zinc-500">
        <span>{label}</span>
        <span>{value || 0}%</span>
      </div>
      <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-1000`} 
          style={{ width: `${value || 0}%` }} 
        />
      </div>
    </div>
  );

  const entities = data.entities || { companies: [], persons: [], products: [] };
  const breakdown = data.sentimentBreakdown || { positive: 0, neutral: 0, negative: 0 };

  return (
    <section className="bg-zinc-900/30 p-5 rounded-xl border border-zinc-800/50 space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2 text-blue-400">
          <Radar size={18} />
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-100">Narrative Intelligence</h3>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[8px] font-black text-zinc-500 uppercase">Velocity</span>
           <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter ${
             data.narrativeVelocity === 'Accelerating' ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-500'
           }`}>
             {data.narrativeVelocity || 'Stable'}
           </span>
        </div>
      </div>

      {/* Narrative Archetype */}
      <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg flex items-start gap-3">
         <Sparkles className="text-blue-400 mt-0.5 shrink-0" size={16} />
         <div>
            <span className="text-[8px] text-zinc-500 uppercase font-black block mb-1">Prevailing Archetype</span>
            <p className="text-sm font-bold text-blue-300 leading-tight italic">"{data.narrativeArchetype || 'Data Driven Regime'}"</p>
         </div>
      </div>

      {/* Sentiment Breakdown */}
      <div className="grid grid-cols-1 gap-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-zinc-400 font-bold uppercase">Sentiment Distribution</span>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-black ${ (data.sentimentIndex || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              IDX: { (data.sentimentIndex || 0) > 0 ? '+' : ''}{ (data.sentimentIndex || 0) }
            </span>
          </div>
        </div>
        {renderSentimentBar('Positive Bias', breakdown.positive, 'bg-emerald-500')}
        {renderSentimentBar('Institutional Neutral', breakdown.neutral, 'bg-zinc-500')}
        {renderSentimentBar('Risk/Negative Payload', breakdown.negative, 'bg-rose-500')}
      </div>

      {/* Entities Cluster */}
      <div className="space-y-4 pt-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-zinc-500">
            <Briefcase size={12} />
            <span className="text-[9px] font-black uppercase tracking-widest">Company Entities</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {entities.companies?.length > 0 ? entities.companies.map((e, i) => (
              <span key={i} className="px-2 py-0.5 bg-zinc-800/80 text-zinc-300 rounded text-[9px] mono border border-zinc-700/50">{e}</span>
            )) : <span className="text-[9px] text-zinc-700 italic">None Extracted</span>}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-zinc-500">
            <Users size={12} />
            <span className="text-[9px] font-black uppercase tracking-widest">Key Figures</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {entities.persons?.length > 0 ? entities.persons.map((e, i) => (
              <span key={i} className="px-2 py-0.5 bg-blue-900/10 text-blue-400 rounded text-[9px] mono border border-blue-500/10">{e}</span>
            )) : <span className="text-[9px] text-zinc-700 italic">None Extracted</span>}
          </div>
        </div>
      </div>

      {/* Themes Sparkline */}
      <div className="pt-4 border-t border-zinc-800">
        <div className="flex justify-between items-center mb-2">
           <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-2">
             <TrendingUp size={10} /> Sentiment Momentum
           </span>
        </div>
        <div className="h-10 w-full flex items-end gap-1 px-1">
          {history.length > 0 ? history.map((val, i) => {
            const h = ((val + 100) / 200) * 100;
            return (
              <div 
                key={i} 
                className={`flex-1 rounded-t-[1px] transition-all duration-500 ${val > 0 ? 'bg-emerald-500/30' : 'bg-rose-500/30'}`} 
                style={{ height: `${Math.max(5, h)}%` }}
              />
            );
          }) : (
            <div className="w-full text-center text-[9px] text-zinc-700 italic">No historical drift data</div>
          )}
        </div>
      </div>
    </section>
  );
};
