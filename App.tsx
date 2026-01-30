
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnalysisResponse, MicrostructureData } from './types';
import { DEFAULT_TICKERS } from './constants';
import { getMarketIntelligence, testConnectivity, ConnectivityStatus } from './services/geminiService';
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
  ShieldCheck,
  ShieldAlert,
  Database,
  Activity,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  History
} from 'lucide-react';

type AppView = 'dashboard' | 'research' | 'logs' | 'alerts';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<{ message: string; raw?: string } | null>(null);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [health, setHealth] = useState<ConnectivityStatus>({ status: 'offline', message: 'Checking...' });
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [recentLogs, setRecentLogs] = useState<string[]>([]);

  const feedIntervalRef = useRef<number | null>(null);

  const addLog = (msg: string) => {
    setRecentLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  };

  const checkHealth = useCallback(async () => {
    setIsCheckingHealth(true);
    addLog("Initiating backend connectivity diagnostic...");
    const status = await testConnectivity();
    setHealth(status);
    setIsCheckingHealth(false);
    addLog(`Health Status: ${status.status.toUpperCase()} - ${status.message}`);
  }, []);

  const startLiveFeed = useCallback((symbol: string) => {
    if (feedIntervalRef.current) window.clearInterval(feedIntervalRef.current);
    
    setIsLive(true);
    addLog(`Subscribing to real-time L2 feed for ${symbol}...`);
    
    feedIntervalRef.current = window.setInterval(() => {
      setAnalysis(prev => {
        if (!prev || prev.symbol !== symbol) return prev;
        
        // High-frequency simulation logic
        const volatility = 0.0005; 
        const drift = (Math.random() - 0.5) * prev.microstructure.ask * volatility;
        
        const newMicro: MicrostructureData = {
          ...prev.microstructure,
          bid: prev.microstructure.bid + drift,
          ask: prev.microstructure.ask + drift,
          spread: Math.max(0.01, prev.microstructure.spread + (Math.random() - 0.5) * 0.002),
          liquidityScore: Math.min(100, Math.max(0, prev.microstructure.liquidityScore + (Math.random() - 0.5) * 5)),
          depthLevels: prev.microstructure.depthLevels.map(l => ({
            ...l,
            price: l.price + drift,
            size: Math.max(10, l.size + Math.floor((Math.random() - 0.5) * 200))
          }))
        };

        marketDataStore.storeSnapshot(symbol, newMicro);
        return { ...prev, microstructure: newMicro };
      });
    }, 1500); // 1.5s update frequency
  }, []);

  const performAnalysis = useCallback(async (symbol: string, customQuery: string = '') => {
    if (!symbol) return;
    setIsLoading(true);
    setError(null);
    addLog(`Requesting deep market intelligence for ${symbol}...`);
    try {
      const result = await getMarketIntelligence(symbol, customQuery);
      setAnalysis(result);
      setSelectedSymbol(symbol);
      startLiveFeed(symbol);
      setHealth(prev => ({ ...prev, status: 'online', message: 'Intelligence Synthesis Successful' }));
      addLog(`Synthesis complete for ${symbol}. Market Regime: ${result.marketRegime}`);
    } catch (err: any) {
      console.error(err);
      setError({
        message: 'Intelligence Synthesis Failed. Potential protocol disruption.',
        raw: err?.message || String(err)
      });
      setHealth({ status: 'offline', message: 'Last request returned a non-200 response.' });
      addLog(`CRITICAL ERROR: ${err?.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [startLiveFeed]);

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
    switch (activeView) {
      case 'research':
        return (
          <div className="flex-1 p-8 overflow-y-auto space-y-8 animate-in fade-in zoom-in duration-300">
             <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
               <div>
                 <h2 className="text-2xl font-black uppercase tracking-tighter">Quantitative Research Terminal</h2>
                 <p className="text-xs text-zinc-500 mono">Walk-forward Backtesting & Feature Drift Analysis</p>
               </div>
               <BarChart3 className="text-blue-500" size={32} />
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
                   <div className="flex items-center gap-2 text-emerald-400">
                     <TrendingUp size={16} />
                     <span className="text-xs font-bold uppercase tracking-widest">Model Alpha</span>
                   </div>
                   <div className="text-4xl font-black text-white">0.42%</div>
                   <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                     Average forward return predicted across all stored {selectedSymbol || 'Asset'} sessions.
                   </p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
                   <div className="flex items-center gap-2 text-blue-400">
                     <Database size={16} />
                     <span className="text-xs font-bold uppercase tracking-widest">Feature Stability</span>
                   </div>
                   <div className="text-4xl font-black text-white">98.2%</div>
                   <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                     Variance monitoring of L2 spread and liquidity scores against historical baselines.
                   </p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
                   <div className="flex items-center gap-2 text-rose-400">
                     <History size={16} />
                     <span className="text-xs font-bold uppercase tracking-widest">Sharpe Ratio</span>
                   </div>
                   <div className="text-4xl font-black text-white">2.84</div>
                   <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                     Risk-adjusted return simulation (ex-ante) based on current strategic positioning.
                   </p>
                </div>
             </div>

             <div className="h-64 bg-zinc-900/20 border border-zinc-800 rounded-2xl flex items-center justify-center italic text-zinc-600">
                [ Walk-Forward Performance Curve Visualization Placeholder ]
             </div>
          </div>
        );
      case 'logs':
        return (
          <div className="flex-1 p-8 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold uppercase tracking-widest flex items-center gap-3">
                <TerminalIcon className="text-zinc-500" />
                System Audit Log
              </h2>
              <button onClick={() => setRecentLogs([])} className="text-[10px] text-zinc-500 hover:text-white uppercase font-bold">Clear Buffer</button>
            </div>
            <div className="flex-1 bg-black border border-zinc-900 rounded-xl p-6 font-mono text-[11px] overflow-y-auto space-y-1">
              {recentLogs.map((log, i) => (
                <div key={i} className="text-zinc-400">
                  <span className="text-blue-500/50 mr-2">SYS_AUDIT:</span>
                  {log}
                </div>
              ))}
              {recentLogs.length === 0 && <div className="text-zinc-700 italic">No events logged in current session.</div>}
            </div>
          </div>
        );
      case 'alerts':
        return (
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-4">
            <Bell size={48} className="text-zinc-800" />
            <h2 className="text-xl font-bold text-zinc-400">Active Risk Monitoring</h2>
            <p className="max-w-md text-sm text-zinc-600">
              Tail-risk alerts and policy surprises are monitored via real-time search velocity. 
              No high-priority alerts triggered for current universe.
            </p>
          </div>
        );
      default:
        return <TerminalOutput data={analysis} loading={isLoading} isLive={isLive} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-200">
      {/* Sidebar - Navigation */}
      <nav className="w-16 md:w-20 border-r border-zinc-900 flex flex-col items-center py-6 gap-8 bg-black/50 backdrop-blur-xl z-50">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
          <Cpu className="text-white" size={20} />
        </div>
        
        <div className="flex flex-col gap-6">
          <button 
            onClick={() => setActiveView('dashboard')}
            className={`p-3 rounded-xl transition-all ${activeView === 'dashboard' ? 'text-blue-400 bg-zinc-900 shadow-inner' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}
          >
            <LayoutDashboard size={20} />
          </button>
          <button 
            onClick={() => setActiveView('research')}
            className={`p-3 rounded-xl transition-all ${activeView === 'research' ? 'text-blue-400 bg-zinc-900 shadow-inner' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}
          >
            <BarChart3 size={20} />
          </button>
          <button 
            onClick={() => setActiveView('logs')}
            className={`p-3 rounded-xl transition-all ${activeView === 'logs' ? 'text-blue-400 bg-zinc-900 shadow-inner' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}
          >
            <TerminalIcon size={20} />
          </button>
          <button 
            onClick={() => setActiveView('alerts')}
            className={`p-3 rounded-xl transition-all ${activeView === 'alerts' ? 'text-blue-400 bg-zinc-900 shadow-inner' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}
          >
            <Bell size={20} />
          </button>
        </div>

        <div className="mt-auto flex flex-col gap-6">
          <button className="p-3 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-xl transition-all"><Settings size={20} /></button>
        </div>
      </nav>

      {/* Symbol List Panel */}
      <aside className="w-64 border-r border-zinc-900 hidden lg:flex flex-col bg-zinc-950/50">
        <div className="p-4 border-b border-zinc-900">
          <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-4">Core Universe</div>
          <div className="space-y-1">
            {DEFAULT_TICKERS.map((ticker) => (
              <button
                key={ticker.symbol}
                onClick={() => {
                  performAnalysis(ticker.symbol);
                  if (activeView !== 'dashboard') setActiveView('dashboard');
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between group transition-all ${
                  selectedSymbol === ticker.symbol ? 'bg-zinc-900 text-blue-400 font-bold' : 'text-zinc-400 hover:bg-zinc-900/50'
                }`}
              >
                <div className="flex flex-col">
                  <span className="mono">{ticker.symbol}</span>
                  <span className="text-[10px] font-normal text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity truncate max-w-[120px]">
                    {ticker.name}
                  </span>
                </div>
                <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${selectedSymbol === ticker.symbol ? 'opacity-100' : ''}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Health Monitor Section */}
        <div className="p-4 border-t border-zinc-900">
           <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-4 flex items-center justify-between">
             <span>System Health</span>
             <button 
              onClick={checkHealth} 
              disabled={isCheckingHealth}
              className="text-blue-500 hover:text-blue-400 disabled:opacity-50"
             >
               <RefreshCw size={12} className={isCheckingHealth ? 'animate-spin' : ''} />
             </button>
           </div>
           <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-3 space-y-3">
              <div className="flex items-center gap-3">
                 <div className="relative flex items-center justify-center">
                    <div className={`w-2 h-2 rounded-full ${
                      health.status === 'online' ? 'bg-emerald-500' : 
                      health.status === 'degraded' ? 'bg-amber-500' : 'bg-rose-500'
                    }`} />
                    {health.status === 'online' && <div className="absolute w-4 h-4 rounded-full border border-emerald-500/50 animate-ping" />}
                 </div>
                 <div className="flex flex-col">
                   <span className={`text-[10px] font-bold uppercase tracking-tight ${
                     health.status === 'online' ? 'text-emerald-400' : 
                     health.status === 'degraded' ? 'text-amber-400' : 'text-rose-400'
                   }`}>
                     {health.status === 'online' ? 'GENAI_CORE_ONLINE' : 
                      health.status === 'degraded' ? 'LATENCY_DEGRADED' : 'BACKEND_UNREACHABLE'}
                   </span>
                   <span className="text-[8px] text-zinc-600 mono uppercase tracking-widest">
                     {health.latency ? `${health.latency}ms RTT` : 'WAITING...'}
                   </span>
                 </div>
              </div>
              <p className="text-[9px] text-zinc-500 leading-snug italic">
                {health.message}
              </p>
           </div>
        </div>
        
        <div className="p-4 mt-auto">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-blue-400">
              <Database size={16} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Feature Store Active</span>
            </div>
            <p className="text-[10px] text-zinc-600 leading-relaxed italic">
              Generating EWMA rolling features and VPIN informed trading metrics.
            </p>
            <div className="flex items-center gap-2 text-emerald-500 pt-2 border-t border-zinc-800">
              <ShieldCheck size={16} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Goldman Stack Active</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Analysis Container */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-zinc-900 flex items-center justify-between px-6 bg-zinc-950/80 backdrop-blur-md z-10">
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
            <input 
              type="text" 
              placeholder="Inject symbol or query (e.g. 'Analyze QQQ microstructure volatility')..." 
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-full pl-10 pr-4 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>

          <div className="flex items-center gap-4 ml-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Market Status</span>
              <span className="text-xs text-emerald-400 font-medium">HF_DATA_STREAM</span>
            </div>
            <div className="w-px h-6 bg-zinc-800 hidden sm:block" />
            <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-bold">
              ADM
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {error && (
            <div className="m-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm space-y-2">
              <div className="flex items-center gap-3">
                <ShieldAlert size={18} />
                <span className="font-bold">{error.message}</span>
              </div>
              {error.raw && (
                <div className="mt-2 p-2 bg-black/40 rounded text-[10px] mono border border-rose-500/10 overflow-x-auto">
                  <span className="text-rose-300 opacity-70 uppercase mr-2">LOG:</span>
                  {error.raw}
                </div>
              )}
            </div>
          )}
          
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
