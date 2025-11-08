/**
 * IndexedDB Manager
 * 
 * Handles database initialization, upgrades, and provides low-level database access.
 */

import { DB_NAME, DB_VERSION, OBJECT_STORES, type ObjectStoreConfig } from './indexeddb-schema';

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initialize the IndexedDB database
   */
  async init(): Promise<IDBDatabase> {
    // Return existing promise if initialization is in progress
    if (this.initPromise) {
      return this.initPromise;
    }

    // Return existing database if already initialized
    if (this.db) {
      return Promise.resolve(this.db);
    }

    this.initPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB initialization error:', request.error);
        this.initPromise = null;
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log(`Upgrading IndexedDB from version ${event.oldVersion} to ${event.newVersion}`);

        // Create object stores
        OBJECT_STORES.forEach((storeConfig: ObjectStoreConfig) => {
          // Delete existing store if it exists (for clean upgrade)
          if (db.objectStoreNames.contains(storeConfig.name)) {
            db.deleteObjectStore(storeConfig.name);
          }

          // Create object store
          const objectStore = db.createObjectStore(storeConfig.name, {
            keyPath: storeConfig.keyPath,
            autoIncrement: storeConfig.autoIncrement,
          });

          // Create indexes
          storeConfig.indexes.forEach((index) => {
            objectStore.createIndex(index.name, index.keyPath, index.options);
          });

          console.log(`Created object store: ${storeConfig.name} with ${storeConfig.indexes.length} indexes`);
        });
      };
    });

    return this.initPromise;
  }

  /**
   * Get the database instance
   */
  async getDB(): Promise<IDBDatabase> {
    if (!this.db) {
      return this.init();
    }
    return this.db;
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
      console.log('IndexedDB connection closed');
    }
  }

  /**
   * Delete the entire database (use with caution!)
   */
  async deleteDatabase(): Promise<void> {
    this.close();
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      
      request.onsuccess = () => {
        console.log('IndexedDB database deleted successfully');
        resolve();
      };
      
      request.onerror = () => {
        console.error('Error deleting IndexedDB database:', request.error);
        reject(request.error);
      };
      
      request.onblocked = () => {
        console.warn('IndexedDB deletion blocked - close all tabs using this database');
      };
    });
  }

  /**
   * Clear all data from a specific object store
   */
  async clearObjectStore(storeName: string): Promise<void> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => {
        console.log(`Cleared object store: ${storeName}`);
        resolve();
      };
      
      request.onerror = () => {
        console.error(`Error clearing object store ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all data from a specific object store
   */
  async getAllFromStore<T>(storeName: string): Promise<T[]> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result as T[]);
      };
      
      request.onerror = () => {
        console.error(`Error getting all from ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get a single item by ID from a specific object store
   */
  async getFromStore<T>(storeName: string, id: string): Promise<T | undefined> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result as T | undefined);
      };
      
      request.onerror = () => {
        console.error(`Error getting item from ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Add or update an item in a specific object store
   */
  async putInStore<T>(storeName: string, item: T): Promise<void> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        console.error(`Error putting item in ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete an item from a specific object store
   */
  async deleteFromStore(storeName: string, id: string): Promise<void> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        console.error(`Error deleting item from ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Query items by index
   */
  async queryByIndex<T>(
    storeName: string,
    indexName: string,
    query: IDBValidKey | IDBKeyRange
  ): Promise<T[]> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(query);
      
      request.onsuccess = () => {
        resolve(request.result as T[]);
      };
      
      request.onerror = () => {
        console.error(`Error querying ${storeName} by index ${indexName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Count items in an object store
   */
  async countInStore(storeName: string): Promise<number> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        console.error(`Error counting items in ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Batch operations - add/update multiple items in a single transaction
   */
  async batchPut<T>(storeName: string, items: T[]): Promise<void> {
    const db = await this.getDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      let completed = 0;
      const total = items.length;
      
      items.forEach((item) => {
        const request = store.put(item);
        
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
        
        request.onerror = () => {
          console.error(`Error in batch put for ${storeName}:`, request.error);
          reject(request.error);
        };
      });
      
      // Handle empty array case
      if (items.length === 0) {
        resolve();
      }
    });
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<Record<string, number>> {
    const stats: Record<string, number> = {};
    
    for (const store of OBJECT_STORES) {
      try {
        stats[store.name] = await this.countInStore(store.name);
      } catch (error) {
        console.error(`Error getting stats for ${store.name}:`, error);
        stats[store.name] = -1;
      }
    }
    
    return stats;
  }
}

// Export singleton instance
export const indexedDBManager = new IndexedDBManager();

// Export class for testing
export { IndexedDBManager };
