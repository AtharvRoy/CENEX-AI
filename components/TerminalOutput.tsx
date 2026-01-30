
import React from 'react';
import { AnalysisResponse } from '../types';
import { ProbabilityGauge } from './ProbabilityGauge';
import { MicrostructurePanel } from './MicrostructurePanel';
import { RegimeIndicator } from './RegimeIndicator';
import { 
  ShieldAlert, 
  TrendingUp, 
  Globe, 
  Zap, 
  Target, 
  BrainCircuit, 
  ExternalLink,
  ChevronRight,
  Info,
  Radar,
  Scale
} from 'lucide-react';

interface Props {
  data: AnalysisResponse | null;
  loading: boolean;
  isLive?: boolean;
}

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className="flex items-center gap-2 mb-4 border-b border-zinc-800 pb-2">
    <div className="text-blue-400">{icon}</div>
    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100">{title}</h3>
  </div>
);

export const TerminalOutput: React.FC<Props> = ({ data, loading, isLive = false }) => {
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-zinc-500 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <div className="animate-pulse font-mono text-sm tracking-widest uppercase">
          Synthesizing Multi-Source Intelligence...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-600 p-8 text-center">
        <div className="max-w-md">
          <BrainCircuit className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-light italic">Select an instrument or initiate a query to begin institutional research.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 animate-in fade-in duration-500">
      {/* Top Banner: Asset & Confidence */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase">
              {data.assetName} <span className="text-zinc-500">[{data.symbol}]</span>
            </h1>
            <RegimeIndicator regime={data.marketRegime} />
          </div>
          <p className="text-xs text-zinc-500 mono mt-1 flex items-center gap-2">
            TERMINAL SESSION: {new Date(data.timestamp).toLocaleString()}
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
          <div className="text-right">
            <div className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Confidence Score</div>
            <div className={`text-lg font-black uppercase ${
              data.confidenceScore === 'High' ? 'text-emerald-400' : 
              data.confidenceScore === 'Medium' ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {data.confidenceScore}
            </div>
          </div>
          <div className={`w-2 h-10 rounded-full ${
              data.confidenceScore === 'High' ? 'bg-emerald-500' : 
              data.confidenceScore === 'Medium' ? 'bg-amber-500' : 'bg-rose-500'
            }`} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Microstructure & Bias */}
        <div className="lg:col-span-1 space-y-6">
          <MicrostructurePanel data={data.microstructure} symbol={data.symbol} isLive={isLive} />
          
          <section>
            <SectionHeader icon={<Zap size={18} />} title="Directional Bias" />
            <div className="space-y-3">
              <ProbabilityGauge data={data.directionalAssessment.shortTerm.probability} label="Intraday (1D)" />
              <ProbabilityGauge data={data.directionalAssessment.mediumTerm.probability} label="Swing (1W-1M)" />
            </div>
          </section>

          {/* New Confidence Rationale Section */}
          <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
            <SectionHeader icon={<Scale size={18} />} title="Confidence Analysis" />
            <div className="space-y-3">
              <p className="text-[11px] text-zinc-400 leading-relaxed italic">
                {data.uncertaintyExplanation}
              </p>
              <ul className="space-y-2">
                {data.confidenceRationale?.map((point, i) => (
                  <li key={i} className="flex gap-2 text-[10px] text-zinc-300">
                    <span className="text-blue-500 font-bold mt-0.5">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {/* Center Columns: Narrative & Context */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50">
              <SectionHeader icon={<Radar size={18} />} title="Narrative Intelligence" />
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                   <span className="text-[10px] text-zinc-500 uppercase">Velocity</span>
                   <span className={`text-xs font-bold ${
                     data.narrativeIntelligence.narrativeVelocity === 'Accelerating' ? 'text-blue-400' : 'text-zinc-400'
                   }`}>{data.narrativeIntelligence.narrativeVelocity}</span>
                </div>
                <div>
                   <span className="text-[10px] text-zinc-500 uppercase block mb-2">Sentiment Index</span>
                   <div className="h-2 w-full bg-zinc-800 rounded-full relative">
                      <div 
                        className={`absolute top-0 bottom-0 rounded-full ${data.narrativeIntelligence.sentimentIndex > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{ 
                          left: '50%', 
                          width: `${Math.abs(data.narrativeIntelligence.sentimentIndex / 2)}%`,
                          marginLeft: data.narrativeIntelligence.sentimentIndex < 0 ? `-${Math.abs(data.narrativeIntelligence.sentimentIndex / 2)}%` : '0'
                        }}
                      />
                   </div>
                   <div className="flex justify-between text-[8px] mono text-zinc-600 mt-1">
                     <span>-100</span>
                     <span>0</span>
                     <span>+100</span>
                   </div>
                </div>
                <div className="pt-2">
                   <span className="text-[10px] text-zinc-500 uppercase block mb-2">Key Entities</span>
                   <div className="flex flex-wrap gap-1">
                      {data.narrativeIntelligence.topEntities.map((e, i) => (
                        <span key={i} className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-[10px] mono border border-zinc-700">{e}</span>
                      ))}
                   </div>
                </div>
              </div>
            </section>

            <section className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50">
              <SectionHeader icon={<Globe size={18} />} title="Macro Snapshot" />
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-zinc-500 uppercase text-[9px]">Interest Rates</span>
                  <p className="text-zinc-300 mt-0.5">{data.macroContext.interestRateEnv}</p>
                </div>
                <div>
                  <span className="text-zinc-500 uppercase text-[9px]">Liquidity</span>
                  <p className="text-zinc-300 mt-0.5">{data.macroContext.liquidityConditions}</p>
                </div>
              </div>
            </section>
          </div>

          <section>
            <SectionHeader icon={<Target size={18} />} title="Institutional Strategy" />
            <div className="bg-gradient-to-br from-blue-900/20 to-zinc-900 p-6 rounded-xl border border-blue-500/20 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                <Target size={120} />
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                  data.strategicPositioning.bias.toLowerCase().includes('long') ? 'bg-emerald-500 text-zinc-950' : 
                  data.strategicPositioning.bias.toLowerCase().includes('short') ? 'bg-rose-500 text-zinc-950' : 'bg-zinc-100 text-zinc-950'
                }`}>
                  {data.strategicPositioning.bias}
                </div>
                <div className="h-px flex-1 bg-zinc-800" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm relative z-10">
                <div className="space-y-4">
                  <div>
                    <span className="text-zinc-500 block uppercase text-[10px] font-bold mb-1">Thesis Rationale</span>
                    <p className="text-zinc-200 leading-relaxed">{data.strategicPositioning.logic}</p>
                  </div>
                </div>
                <div className="space-y-4 border-l border-zinc-800 pl-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-zinc-500 block uppercase text-[10px] font-bold mb-1">Execution Zone</span>
                      <p className="text-zinc-100 mono font-medium">{data.strategicPositioning.entryZones}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500 block uppercase text-[10px] font-bold mb-1">Invalidation</span>
                      <p className="text-rose-400 mono font-medium">{data.strategicPositioning.stopZones}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-500 block uppercase text-[10px] font-bold mb-1">Capital Allocation (Risk-Adj)</span>
                    <p className="text-blue-400 font-bold text-xl">{data.strategicPositioning.positionSizing}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Risks & Technicals */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50">
            <SectionHeader icon={<TrendingUp size={18} />} title="Technical Profile" />
            <div className="space-y-3 text-[11px]">
              <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                <span className="text-zinc-500">Momentum</span>
                <span className="text-zinc-100">{data.technicalStructure.momentum}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                <span className="text-zinc-500">Trend</span>
                <span className="text-zinc-100">{data.technicalStructure.trend}</span>
              </div>
              <div>
                <span className="text-zinc-500 uppercase text-[9px] block mb-1">Resistance</span>
                <div className="flex flex-wrap gap-1">
                  {data.technicalStructure.resistanceZones.map((z, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-rose-500/10 text-rose-400 rounded text-[9px] mono border border-rose-500/20">{z}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section>
            <SectionHeader icon={<ShieldAlert size={18} />} title="Risk Intelligence" />
            <div className="space-y-3">
              {data.riskFactors.slice(0, 3).map((risk, i) => (
                <div key={i} className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-lg text-[11px] text-rose-200 italic leading-snug">
                  {risk}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Grounding Sources */}
      {data.groundingSources && data.groundingSources.length > 0 && (
        <section className="pt-4 border-t border-zinc-900">
          <div className="text-[10px] uppercase text-zinc-500 font-bold mb-3 tracking-widest flex items-center gap-2">
            <ExternalLink size={12} /> Supporting Evidence & Data Sources
          </div>
          <div className="flex flex-wrap gap-2">
            {data.groundingSources.map((source, i) => (
              <a 
                key={i} 
                href={source.uri} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
              >
                {source.title.length > 30 ? source.title.substring(0, 30) + '...' : source.title}
                <ChevronRight size={10} />
              </a>
            ))}
          </div>
        </section>
      )}

      <footer className="pt-12 pb-6 flex flex-col items-center gap-2 text-[10px] text-zinc-600 font-medium uppercase tracking-[0.2em] text-center">
        <p>Institutional Market Intelligence Terminal v5.0.0-PRO (Goldman Stack)</p>
        <p className="max-w-3xl opacity-60">
          DISCLAIMER: This analysis is for informational and research purposes only and does not constitute financial advice. 
          All trading involves risk. System uses high-frequency microstructure simulation and multi-source NLP.
        </p>
      </footer>
    </div>
  );
};
