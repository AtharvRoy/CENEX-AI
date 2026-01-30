
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnalysisResponse, MicrostructureData } from './types';
import { DEFAULT_TICKERS } from './constants';
import { getMarketIntelligence, testConnectivity, ConnectivityStatus, parseErrorMessage } from './services/geminiService';
import { marketDataStore } from './services/storageService';
import { TerminalOutput } from './components/TerminalOutput';
import { 
  LayoutDashboard, 
  BarChart3, 
  Settings, 
  Bell, 
  Cpu, 
  Terminal as TerminalIcon,
  Search as SearchIcon,
  ChevronRight,
  Database,
  RefreshCw,
  TrendingUp,
  History,
  Key,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

type AppView = 'dashboard' | 'research' | 'logs' | 'alerts';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<{ message: string; raw?: string; isQuota?: boolean; isNotFound?: boolean } | null>(null);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [health, setHealth] = useState<ConnectivityStatus>({ status: 'offline', message: 'Checking...' });
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [recentLogs, setRecentLogs] = useState<string[]>([]);
  const [hasUserKey, setHasUserKey] = useState<boolean>(false);

  const feedIntervalRef = useRef<number | null>(null);
  const lastRequestTimeRef = useRef<number>(0);

  const addLog = (msg: string) => {
    setRecentLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  };

  const startLiveFeed = useCallback((symbol: string) => {
    if (feedIntervalRef.current) window.clearInterval(feedIntervalRef.current);
    
    setIsLive(true);
    addLog(`Feed: ${symbol} simulation stabilized.`);
    
    feedIntervalRef.current = window.setInterval(() => {
      setAnalysis(prev => {
        if (!prev || prev.symbol !== symbol || !prev.microstructure) return prev;
        
        const volatility = 0.00025; 
        const drift = (Math.random() - 0.5) * (prev.microstructure.ask || 100) * volatility;
        
        const newMicro: MicrostructureData = {
          ...prev.microstructure,
          bid: (prev.microstructure.bid || 0) + drift,
          ask: (prev.microstructure.ask || 0) + drift,
          spread: Math.max(0.0015, (prev.microstructure.spread || 0) + (Math.random() - 0.5) * 0.0003),
          liquidityScore: Math.min(100, Math.max(0, (prev.microstructure.liquidityScore || 50) + (Math.random() - 0.5) * 1.5)),
          depthLevels: (prev.microstructure.depthLevels || []).map(l => ({
            ...l,
            price: (l.price || 0) + drift,
            size: Math.max(5, (l.size || 0) + Math.floor((Math.random() - 0.5) * 25))
          }))
        };

        marketDataStore.storeSnapshot(symbol, newMicro);
        return { ...prev, microstructure: newMicro };
      });
    }, 15000);
  }, []);

  const performAnalysis = useCallback(async (symbol: string, customQuery: string = '') => {
    if (!symbol) return;
    
    const now = Date.now();
    if (now - lastRequestTimeRef.current < 2000) {
      addLog("Analysis request throttled. Cooling down...");
      return;
    }
    lastRequestTimeRef.current = now;

    setIsLoading(true);
    setError(null);
    addLog(`Requesting deep analysis for ${symbol}...`);
    
    try {
      const result = await getMarketIntelligence(symbol, customQuery);
      setAnalysis(result);
      setSelectedSymbol(symbol);
      startLiveFeed(symbol);
      
      if (result.narrativeIntelligence) {
        marketDataStore.storeNarrative(symbol, result.narrativeIntelligence);
      }
      
      setHealth(prev => ({ ...prev, status: 'online', message: 'Operational' }));
      addLog(`Analysis complete: ${symbol}.`);
    } catch (err: any) {
      console.error("Critical Fault:", err);
      const errMsg = parseErrorMessage(err);
      const isQuota = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.toLowerCase().includes('quota');
      const isNotFound = errMsg.includes('Requested entity was not found');
      
      setError({
        message: isQuota ? 'Institutional Allocation Exhausted' : isNotFound ? 'API Protocol Error' : 'System Exception',
        raw: errMsg,
        isQuota: isQuota,
        isNotFound: isNotFound
      });

      if (isNotFound && window.aistudio) {
        addLog("Key identity missing. Re-authenticating...");
        window.aistudio.openSelectKey();
      }
      
      setHealth({ status: 'offline', message: 'Protocol Interrupted' });
      addLog(`CRITICAL: ${errMsg}`);
    } finally {
      setIsLoading(false);
    }
  }, [startLiveFeed]);

  const checkHealth = useCallback(async () => {
    setIsCheckingHealth(true);
    const status = await testConnectivity();
    setHealth(status);
    setIsCheckingHealth(false);
    
    if (status.isQuota) {
      setError({
        message: 'Institutional Allocation Exhausted',
        raw: status.message,
        isQuota: true
      });
    }

    if (window.aistudio) {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasUserKey(selected);
    }
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      addLog("Launching credential configuration...");
      await window.aistudio.openSelectKey();
      
      setHasUserKey(true);
      setError(null);
      addLog("Credentials updated. Resuming session...");
      
      if (selectedSymbol) {
        performAnalysis(selectedSymbol, query);
      } else {
        checkHealth();
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      performAnalysis(query);
    }
  };

  useEffect(() => {
    marketDataStore.init();
    checkHealth();
    return () => {
      if (feedIntervalRef.current) window.clearInterval(feedIntervalRef.current);
    };
  }, [checkHealth]); 

  const renderView = () => {
    if (error?.isQuota || error?.isNotFound) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-500">
          <div className="max-w-md w-full bg-zinc-900 border border-amber-500/20 rounded-2xl p-8 space-y-6 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none rounded-2xl" />
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
              <AlertTriangle className="text-amber-500" size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                {error.isNotFound ? 'Credential Validation Fault' : 'Quota Allocation Exhausted'}
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed italic">
                {error.isNotFound 
                  ? 'The terminal protocol was unable to verify your API identity. Please re-authenticate via the secure select key portal.'
                  : 'The shared institutional data tier has reached its rate limit. To restore real-time analysis, please connect a billing-enabled personal key from a paid GCP project.'}
              </p>
            </div>
            <div className="space-y-4">
              <button 
                onClick={handleSelectKey}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/40 active:scale-95 group"
              >
                <Key size={18} className="group-hover:rotate-12 transition-transform" />
                {error.isNotFound ? 'Resolve Authentication' : 'Activate Personal Key'}
              </button>
              
              <button 
                onClick={() => { setError(null); checkHealth(); }}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Retry Connection
              </button>

              <div className="flex flex-col gap-2 items-center">
                <a 
                  href="https://ai.google.dev/gemini-api/docs/billing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[10px] text-zinc-600 hover:text-zinc-300 uppercase font-black tracking-widest transition-colors"
                >
                  Quota Documentation <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    switch (activeView) {
      case 'research':
        return (
          <div className="flex-1 p-8 overflow-y-auto space-y-8 animate-in fade-in zoom-in duration-300">
             <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
               <div>
                 <h2 className="text-2xl font-black uppercase tracking-tighter">Institutional Alpha Engine</h2>
                 <p className="text-xs text-zinc-500 mono uppercase tracking-[0.2em]">Strategy Sandbox v1.0.4</p>
               </div>
               <BarChart3 className="text-blue-500 opacity-30" size={48} />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity"><TrendingUp size={48} /></div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 block mb-2">Synthetic Alpha</span>
                   <div className="text-4xl font-black text-emerald-500">+0.42%</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity"><Database size={48} /></div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 block mb-2">Protocol State</span>
                   <div className="text-4xl font-black text-blue-500">STABLE</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity"><History size={48} /></div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 block mb-2">Backtest Sharpe</span>
                   <div className="text-4xl font-black text-white italic">2.14</div>
                </div>
             </div>
          </div>
        );
      case 'logs':
        return (
          <div className="flex-1 p-8 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold uppercase tracking-widest flex items-center gap-3">
                <TerminalIcon className="text-blue-500" />
                Terminal Audit Pipeline
              </h2>
              <button onClick={() => setRecentLogs([])} className="text-[10px] text-zinc-500 hover:text-white uppercase font-black px-4 py-2 bg-zinc-900 rounded-md border border-zinc-800 transition-colors">Purge Logs</button>
            </div>
            <div className="flex-1 bg-black border border-zinc-900 rounded-xl p-6 font-mono text-[11px] overflow-y-auto space-y-1 shadow-[inset_0_2px_20px_rgba(0,0,0,0.8)] custom-scrollbar">
              {recentLogs.map((log, i) => (
                <div key={i} className="text-zinc-500 py-1 border-l border-zinc-900 pl-4 hover:bg-zinc-900/20 transition-colors flex gap-4">
                  <span className="text-blue-500/40 shrink-0 select-none">[{new Date().toLocaleTimeString()}]</span>
                  <span className="text-zinc-400">{log}</span>
                </div>
              ))}
              {recentLogs.length === 0 && <div className="text-zinc-800 italic uppercase tracking-[0.3em] text-center py-40">No activity in current buffer</div>}
            </div>
          </div>
        );
      case 'alerts':
        return (
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-1000">
            <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800 shadow-2xl relative">
              <div className="absolute inset-0 rounded-full border border-blue-500/20 animate-ping" />
              <Bell size={40} className="text-zinc-700" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-black text-zinc-400 uppercase tracking-[0.3em]">Risk Surveillance</h2>
              <p className="text-zinc-600 max-w-md text-sm italic leading-relaxed mx-auto">Active monitoring of tail-risk clusters and narrative pivots. All background threads are operating at nominal capacity.</p>
            </div>
          </div>
        );
      default:
        return <TerminalOutput data={analysis} loading={isLoading} isLive={isLive} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-200 selection:bg-blue-600/40">
      <nav className="w-16 md:w-20 border-r border-zinc-900 flex flex-col items-center py-8 gap-10 bg-black/90 backdrop-blur-3xl z-50">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.4)] transform hover:scale-110 transition-transform cursor-pointer">
          <Cpu className="text-white" size={28} />
        </div>
        <div className="flex flex-col gap-10">
          <button onClick={() => setActiveView('dashboard')} className={`p-4 rounded-2xl transition-all duration-300 ${activeView === 'dashboard' ? 'text-blue-400 bg-zinc-900 shadow-inner scale-110' : 'text-zinc-600 hover:text-white hover:bg-zinc-900'}`}><LayoutDashboard size={24} /></button>
          <button onClick={() => setActiveView('research')} className={`p-4 rounded-2xl transition-all duration-300 ${activeView === 'research' ? 'text-blue-400 bg-zinc-900 shadow-inner scale-110' : 'text-zinc-600 hover:text-white hover:bg-zinc-900'}`}><BarChart3 size={24} /></button>
          <button onClick={() => setActiveView('logs')} className={`p-4 rounded-2xl transition-all duration-300 ${activeView === 'logs' ? 'text-blue-400 bg-zinc-900 shadow-inner scale-110' : 'text-zinc-600 hover:text-white hover:bg-zinc-900'}`}><TerminalIcon size={24} /></button>
          <button onClick={() => setActiveView('alerts')} className={`p-4 rounded-2xl transition-all duration-300 ${activeView === 'alerts' ? 'text-blue-400 bg-zinc-900 shadow-inner scale-110' : 'text-zinc-600 hover:text-white hover:bg-zinc-900'}`}><Bell size={24} /></button>
        </div>
        <div className="mt-auto flex flex-col gap-10">
          <button 
            onClick={handleSelectKey} 
            title="Update Protocol Credentials"
            className={`p-4 rounded-2xl transition-all duration-300 ${hasUserKey ? 'text-emerald-400 bg-emerald-500/5 shadow-inner' : 'text-zinc-600 hover:text-white hover:bg-zinc-900'}`}
          >
            <Key size={24} />
          </button>
          <button className="p-4 text-zinc-600 hover:text-white hover:bg-zinc-900 rounded-2xl transition-all duration-300"><Settings size={24} /></button>
        </div>
      </nav>

      <aside className="w-80 border-r border-zinc-900 hidden lg:flex flex-col bg-zinc-950/60 backdrop-blur-xl">
        <div className="p-8 border-b border-zinc-900">
          <div className="text-[11px] font-black text-zinc-600 tracking-[0.4em] mb-8 uppercase">Asset Coverage</div>
          <div className="space-y-3">
            {DEFAULT_TICKERS.map((ticker) => (
              <button
                key={ticker.symbol}
                onClick={() => {
                  performAnalysis(ticker.symbol);
                  if (activeView !== 'dashboard') setActiveView('dashboard');
                }}
                disabled={isLoading}
                className={`w-full text-left px-5 py-4 rounded-2xl text-sm flex items-center justify-between group transition-all duration-300 ${selectedSymbol === ticker.symbol ? 'bg-zinc-900 text-blue-400 font-black shadow-xl border border-zinc-800' : 'text-zinc-500 hover:bg-zinc-900/40 hover:text-zinc-300 border border-transparent'} disabled:opacity-50`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="mono tracking-tighter uppercase font-bold">{ticker.symbol}</span>
                  <span className="text-[10px] font-medium text-zinc-600 opacity-60 group-hover:opacity-100 transition-opacity uppercase">{ticker.name}</span>
                </div>
                <ChevronRight size={16} className={`opacity-0 group-hover:opacity-40 transition-opacity ${selectedSymbol === ticker.symbol ? 'opacity-100 text-blue-500' : ''}`} />
              </button>
            ))}
          </div>
        </div>
        <div className="p-8 border-t border-zinc-900">
           <div className="text-[11px] font-black text-zinc-600 tracking-[0.4em] mb-8 flex items-center justify-between uppercase">
             <span>Protocol Diagnostic</span>
             <button onClick={checkHealth} disabled={isCheckingHealth || !!error} className="text-blue-500 disabled:opacity-20 hover:rotate-180 transition-all duration-500">
               <RefreshCw size={14} className={isCheckingHealth ? 'animate-spin' : ''} />
             </button>
           </div>
           <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-3 shadow-inner">
              <div className="flex items-center gap-4">
                 <div className={`w-3 h-3 rounded-full ${health.status === 'online' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-rose-500'} transition-colors`} />
                 <span className="text-[11px] font-black uppercase text-zinc-400 tracking-[0.2em]">{health.status}</span>
              </div>
              <p className="text-[11px] text-zinc-700 italic font-medium leading-relaxed">{health.message}</p>
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.05)_0%,transparent_70%)]">
        <header className="h-20 border-b border-zinc-900 flex items-center justify-between px-10 bg-zinc-950/70 backdrop-blur-2xl z-10">
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-3xl relative group">
            <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Inject command vector or asset symbol (e.g. BTC/USD)..." 
              className="w-full bg-zinc-900/40 border border-zinc-800/50 rounded-full pl-14 pr-8 py-3.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/40 focus:bg-zinc-900/90 transition-all placeholder:text-zinc-700 tracking-wide font-medium shadow-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
            />
          </form>
          <div className="ml-10 flex items-center gap-8">
             <div className="flex flex-col items-end gap-0.5">
               <span className="text-[10px] font-black uppercase text-zinc-700 tracking-[0.4em]">Protocol Operator</span>
               <span className="text-xs font-black text-zinc-300 tracking-tighter">CENEX_CORE_01</span>
             </div>
             <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[13px] font-black text-zinc-500 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
               ADM
             </div>
          </div>
        </header>
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {error && !error.isQuota && !error.isNotFound && (
            <div className="mx-10 mt-8 p-5 bg-rose-500/5 border border-rose-500/20 rounded-2xl text-rose-400 text-sm flex items-center gap-5 animate-in slide-in-from-top-8 duration-500 shadow-lg">
              <div className="p-3 bg-rose-500/10 rounded-xl"><AlertTriangle size={20} className="shrink-0" /></div>
              <div className="flex flex-col gap-1">
                <span className="font-black uppercase tracking-[0.3em] text-[10px] text-rose-300">Operational Anomaly Detected</span>
                <span className="text-[12px] font-medium opacity-90 leading-relaxed">{error.message}</span>
              </div>
            </div>
          )}
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
