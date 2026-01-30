
import { MicrostructureData } from '../types';

/**
 * Institutional Market Data Store
 * Simulates a high-performance columnar storage for tick data and microstructure snapshots.
 */
class MarketDataStore {
  private dbName = 'CenexMarketData';
  private storeName = 'microstructure_history';
  private db: IDBDatabase | null = null;

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
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
    const transaction = this.db!.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    const entry = {
      symbol,
      timestamp: Date.now(),
      bid: data.bid,
      ask: data.ask,
      spread: data.spread,
      liquidityScore: data.liquidityScore,
    };
    store.add(entry);

    // Keep only last 1000 records per symbol to simulate buffer management
    this.cleanup(symbol);
  }

  private async cleanup(symbol: string) {
    // Conceptual: In a real app, we'd delete older records here to maintain efficiency
  }

  async getRecentHistory(symbol: string, limit: number = 60): Promise<any[]> {
    if (!this.db) await this.init();
    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('symbol');
      const request = index.getAll(IDBKeyRange.only(symbol), limit);
      request.onsuccess = () => resolve(request.result);
    });
  }
}

export const marketDataStore = new MarketDataStore();
