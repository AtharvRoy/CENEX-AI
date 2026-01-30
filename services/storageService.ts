
import { MicrostructureData, NarrativeIntelligence } from '../types';

/**
 * Institutional Market Data Store
 * High-performance storage for tick data, microstructure, and narrative intelligence.
 */
class MarketDataStore {
  private dbName = 'CenexMarketData';
  private msStore = 'microstructure_history';
  private narrativeStore = 'narrative_history';
  private db: IDBDatabase | null = null;

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 2); // Version 2 for new stores
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.msStore)) {
          const store = db.createObjectStore(this.msStore, { keyPath: 'id', autoIncrement: true });
          store.createIndex('symbol', 'symbol', { unique: false });
        }
        if (!db.objectStoreNames.contains(this.narrativeStore)) {
          const store = db.createObjectStore(this.narrativeStore, { keyPath: 'id', autoIncrement: true });
          store.createIndex('symbol', 'symbol', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
      request.onsuccess = () => {
        this.db = request.result;
        resolve(true);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async storeSnapshot(symbol: string, data: MicrostructureData) {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction([this.msStore], 'readwrite');
    const store = transaction.objectStore(this.msStore);
    store.add({
      symbol,
      timestamp: Date.now(),
      bid: data.bid,
      ask: data.ask,
      spread: data.spread,
      liquidityScore: data.liquidityScore,
    });
  }

  async storeNarrative(symbol: string, data: NarrativeIntelligence) {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction([this.narrativeStore], 'readwrite');
    const store = transaction.objectStore(this.narrativeStore);
    store.add({
      symbol,
      timestamp: Date.now(),
      sentimentIndex: data.sentimentIndex,
      archetype: data.narrativeArchetype,
      entities: data.entities
    });
  }

  async getRecentHistory(symbol: string, limit: number = 60): Promise<any[]> {
    if (!this.db) await this.init();
    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.msStore], 'readonly');
      const store = transaction.objectStore(this.msStore);
      const index = store.index('symbol');
      const request = index.getAll(IDBKeyRange.only(symbol), limit);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getNarrativeHistory(symbol: string, limit: number = 20): Promise<any[]> {
    if (!this.db) await this.init();
    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.narrativeStore], 'readonly');
      const store = transaction.objectStore(this.narrativeStore);
      const index = store.index('symbol');
      const request = index.getAll(IDBKeyRange.only(symbol), limit);
      request.onsuccess = () => resolve(request.result);
    });
  }
}

export const marketDataStore = new MarketDataStore();
