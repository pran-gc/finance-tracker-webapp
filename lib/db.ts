import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface FinanceDB extends DBSchema {
  local_currencies: {
    key: number;
    value: {
      id?: number;
      code: string;
      name: string;
      symbol: string;
      is_active: boolean;
      created_at?: string;
    };
  };
  local_categories: {
    key: number;
    value: {
      id?: number;
      name: string;
      type: 'income' | 'expense';
      is_default: boolean;
      is_active: boolean;
      created_at?: string;
    };
  };
  local_app_settings: {
    key: number;
    value: {
      id: number;
      default_currency_id: number;
      created_at?: string;
      updated_at?: string;
    };
  };
  local_transactions_recent: {
    key: number;
    value: {
      id?: number;
      category_id: number;
      amount: number;
      description?: string;
      transaction_date: string;
      type: 'income' | 'expense';
      created_at?: string;
      updated_at?: string;
    };
  };
}

let db: IDBPDatabase<FinanceDB>;

export async function initDB() {
  // Open without specifying a version to avoid requesting a lower version than the live DB.
  // store creation/upgrades are handled in getDB() which will bump the version when needed.
  db = await openDB<FinanceDB>('finance-tracker');
  return db;
}

export { db };

// Return an initialized DB instance and ensure expected stores exist.
export async function getDB() {
  if (db) {
    // Verify stores exist; if so, return.
    const expected: Array<keyof FinanceDB> = ['local_currencies', 'local_categories', 'local_app_settings', 'local_transactions_recent'];
  const missing = expected.filter((s) => !db.objectStoreNames.contains(s as any));
    if (missing.length === 0) return db;
  }

  // Initialize if not already done
  db = await initDB();

  // If stores are still missing (older DB schema), reopen with a bumped version and create them.
  const expected: Array<keyof FinanceDB> = ['local_currencies', 'local_categories', 'local_app_settings', 'local_transactions_recent'];
  const missing = expected.filter((s) => !db.objectStoreNames.contains(s as any));
  if (missing.length === 0) return db;

  const newVersion = (db.version || 1) + 1;
  // Close existing connection before performing version change
  try {
    if (db && typeof db.close === 'function') db.close();
  } catch (e) {
    // ignore
  }

  db = await openDB<FinanceDB>('finance-tracker', newVersion, {
    upgrade(upgradeDb) {
      for (const name of expected) {
        if (!upgradeDb.objectStoreNames.contains(name as any)) {
          if (name === 'local_app_settings') {
            upgradeDb.createObjectStore(name as any, { keyPath: 'id' });
          } else {
            upgradeDb.createObjectStore(name as any, { keyPath: 'id', autoIncrement: true });
          }
        }
      }
    },
  });

  return db;
}

export async function clearDB() {
  try {
    // Close existing DB connection if open
    try {
      if (db && typeof db.close === 'function') {
        db.close()
      }
    } catch (e) {
      // ignore
    }

    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase('finance-tracker')
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
      req.onblocked = () => {
        console.warn('deleteDatabase blocked')
        resolve()
      }
    })
  } catch (err) {
    console.warn('clearDB failed', err)
    throw err
  }
}