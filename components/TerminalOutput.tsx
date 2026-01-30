
import React from 'react';
import { AnalysisResponse } from '../types';
import { ProbabilityGauge } from './ProbabilityGauge';
import { MicrostructurePanel } from './MicrostructurePanel';
import { RegimeIndicator } from './RegimeIndicator';
import { NarrativePanel } from './NarrativePanel';
import { 
  ShieldAlert, 
  TrendingUp, 
  Globe, 
  Zap, 
  Target, 
  BrainCircuit, 
  ExternalLink,
  ChevronRight,
  Scale,
  Radar
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
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase">
              {data.assetName || 'UNIDENTIFIED ASSET'} <span className="text-zinc-500">[{data.symbol}]</span>
            </h1>
            <RegimeIndicator regime={data.marketRegime} />
          </div>
          <p className="text-xs text-zinc-500 mono mt-1 flex items-center gap-2">
            TERMINAL SESSION: {new Date(data.timestamp || Date.now()).toLocaleString()}
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
              {data.confidenceScore || 'N/A'}
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
        <div className="lg:col-span-1 space-y-6">
          {data.microstructure && <MicrostructurePanel data={data.microstructure} symbol={data.symbol} isLive={isLive} />}
          
          <section>
            <SectionHeader icon={<Zap size={18} />} title="Directional Bias" />
            <div className="space-y-3">
              {data.directionalAssessment?.shortTerm?.probability && (
                <ProbabilityGauge data={data.directionalAssessment.shortTerm.probability} label="Intraday (1D)" />
              )}
              {data.directionalAssessment?.mediumTerm?.probability && (
                <ProbabilityGauge data={data.directionalAssessment.mediumTerm.probability} label="Swing (1W-1M)" />
              )}
              {!data.directionalAssessment && (
                <div className="text-[10px] text-zinc-600 italic p-3 border border-zinc-800/50 rounded-lg">
                  Directional bias data unavailable for this session.
                </div>
              )}
            </div>
          </section>

          <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
            <SectionHeader icon={<Scale size={18} />} title="Confidence Analysis" />
            <div className="space-y-3">
              <p className="text-[11px] text-zinc-400 leading-relaxed italic">{data.uncertaintyExplanation || 'No uncertainty profile provided.'}</p>
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

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.narrativeIntelligence && <NarrativePanel data={data.narrativeIntelligence} symbol={data.symbol} />}

            <section className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50">
              <SectionHeader icon={<Globe size={18} />} title="Macro Snapshot" />
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-zinc-500 uppercase text-[9px]">Interest Rates</span>
                  <p className="text-zinc-300 mt-0.5">{data.macroContext?.interestRateEnv || 'Stable/Unchecked'}</p>
                </div>
                <div>
                  <span className="text-zinc-500 uppercase text-[9px]">Liquidity</span>
                  <p className="text-zinc-300 mt-0.5">{data.macroContext?.liquidityConditions || 'Nominal'}</p>
                </div>
                <div className="pt-2">
                  <span className="text-zinc-500 uppercase text-[9px]">Sector Rotation</span>
                  <p className="text-zinc-300 mt-0.5 leading-relaxed italic">{data.macroContext?.sectorRotation || 'No significant rotation detected.'}</p>
                </div>
              </div>
            </section>
          </div>

          <section>
            <SectionHeader icon={<Target size={18} />} title="Institutional Strategy" />
            <div className="bg-gradient-to-br from-blue-900/20 to-zinc-900 p-6 rounded-xl border border-blue-500/20 shadow-2xl relative overflow-hidden">
              {data.strategicPositioning ? (
                <>
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
                        <span className="text-zinc-500 block uppercase text-[10px] font-bold mb-1">Capital Allocation</span>
                        <p className="text-blue-400 font-bold text-xl">{data.strategicPositioning.positionSizing}</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-zinc-600 italic">No specific strategy generated for this regime.</div>
              )}
            </div>
          </section>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <section className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50">
            <SectionHeader icon={<TrendingUp size={18} />} title="Technical Profile" />
            <div className="space-y-3 text-[11px]">
              <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                <span className="text-zinc-500">Momentum</span>
                <span className="text-zinc-100">{data.technicalStructure?.momentum || 'Neutral'}</span>
              </div>
              <div>
                <span className="text-zinc-500 uppercase text-[9px] block mb-1">Resistance</span>
                <div className="flex flex-wrap gap-1">
                  {data.technicalStructure?.resistanceZones?.map((z, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-rose-500/10 text-rose-400 rounded text-[9px] mono border border-rose-500/20">{z}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>
          <section>
            <SectionHeader icon={<ShieldAlert size={18} />} title="Risk Intelligence" />
            <div className="space-y-3">
              {data.riskFactors?.length ? data.riskFactors.map((risk, i) => (
                <div key={i} className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-lg text-[11px] text-rose-200 italic leading-snug">
                  {risk}
                </div>
              )) : (
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-[11px] text-zinc-600">No elevated risk factors detected.</div>
              )}
            </div>
          </section>
        </div>
      </div>

      {data.groundingSources && data.groundingSources.length > 0 && (
        <section className="pt-4 border-t border-zinc-900">
          <div className="text-[10px] uppercase text-zinc-500 font-bold mb-3 tracking-widest flex items-center gap-2">
            <ExternalLink size={12} /> Supporting Evidence & Grounding
          </div>
          <div className="flex flex-wrap gap-2">
            {data.groundingSources.map((source, i) => (
              <a 
                key={i} 
                href={source.uri} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-zinc-400 hover:text-white transition-colors"
              >
                {source.title.length > 30 ? source.title.substring(0, 30) + '...' : source.title}
                <ChevronRight size={10} />
              </a>
            ))}
          </div>
        </section>
      )}

      <footer className="pt-12 pb-6 flex flex-col items-center gap-2 text-[10px] text-zinc-600 font-medium uppercase tracking-[0.2em] text-center">
        <p>Institutional Market Intelligence Terminal v5.0.1-LITE (Fault Tolerant)</p>
      </footer>
    </div>
  );
};
