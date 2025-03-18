// This class is used to persist data on the client side
// It's better than the native localStorage which has lots on limitations
export class IndexedDB {
  dbName: string;
  initDbName: string;
  storeName: string;
  compositeIndexes: string[];
  relevanceWeights: { contains: number; fieldWeights: {}; exact: number; startsWith: number };
  db = null;
  static objectStoreNames = [];
  static version = 1;
  queue: Promise<void>;
  keyPath = 'id';

  constructor(dbName) {
    this.initDbName = dbName;
  }

  async setup(
      storeName,
      compositeIndexes = [],
      fieldWeights = {}
  ) {
    this.storeName = storeName;
    this.dbName = `${this.initDbName}-${this.storeName}`;
    this.compositeIndexes = compositeIndexes;
    this.relevanceWeights = {...this.relevanceWeights, ...{fieldWeights}};
    this.queue = Promise.resolve();
    return this.initDB();
  }

  async initDB({ keyPath = this.keyPath, autoIncrement = true } = {}) {
    this.keyPath = keyPath;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, IndexedDB.version); // Increment version for new indexes
      request.onupgradeneeded = (event) => {
        this.db = event.target.result;
        let store;
        if (!this.db.objectStoreNames.contains(this.storeName)) {
          store = this.db.createObjectStore(this.storeName, { keyPath, autoIncrement });
        } else {
          store = event.currentTarget.transaction.objectStore(this.storeName);
        }

        this.compositeIndexes.forEach((fields) => {
          const indexName = (fields as string[]).join('_');
          if (!store.indexNames.contains(indexName)) {
            store.createIndex(indexName, fields, { unique: false });
          }
        });
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        reject({success: false, message: new Error(`Failed to open IndexedDB ${this.storeName}`)});
      };
    });
  }

  async enqueue(operation) {
    this.queue = this.queue.then(() => operation()).catch((err) => {
      console.error('Queue operation failed:', err);
    });
    return this.queue;
  }

  // Normalize text for search (removes accents & converts to lowercase)
  normalizeText(text) {
    return text
            .toString()
            .normalize('NFD') // Decomposes letters with accents (e.g., é → e)
            .replace(/[\u0300-\u036f]/g, '') // Removes diacritical marks
            .toLowerCase();
  }

  async addOrUpdate(matchData, data) {
    const filters = {};
    Object.keys(matchData).forEach((key) => {
      filters[key] = {value: matchData[key], operator: '='};
    });

    // 🔎 Search based on any field using filterItems
    const results = await this.findItems({filters});
    const existingData = results[0] || {};
    return await this.setItems([{...existingData, ...data}]);
  }

  async addIfNotExist(matchData, data) {
    const filters = {};
    Object.keys(matchData).forEach((key) => {
      filters[key] = {value: matchData[key], operator: '='};
    });

    // 🔎 Search based on any field using filterItems
    const results = await this.findItems({filters});
    const exists = !!(results && results[0]);
    if(!exists) {
      const existingData = results[0] || {};
      return await this.setItems([{...existingData, ...data}]);
    }

    return {success: true, exists };
  }

  async addItem(data) {
    return this.setItems([data]);
  }

  async deleteItem(matchData) {
    const {id: key} = (await this.getItem(matchData)) || {};
    if(key) {
      return this.removeItem(key);
    }

    return {success: false};
  }

  async removeItem(key) {
    return this.enqueue(async () => {
      try {
        return new Promise((resolve, reject) => {
          const tx = this.db.transaction(this.storeName, 'readwrite');
          const store = tx.objectStore(this.storeName);
          store.delete(key);

          tx.oncomplete = () => resolve(true);
          tx.onerror = (event) => {
            reject({success: false, message: new Error('Failed to remove item from IndexedDB')});
          };
        });
      } catch (error) {
        return {success: false};
      }
    });
  }

  // Batch operation to add multiple items at once
  async setItems(items) {
    return this.enqueue(() => {
      try {
        return new Promise((resolve, reject) => {
          const process = (store) => {
            const records = items.slice(0);

            const addItems = () => {
              let i = 0;

              putNext();

              function putNext() {
                if (i < records.length) {
                  const request = store.put(records[i]);
                  request.onsuccess = ((res) => {
                    ++i;
                    putNext();
                  });

                  request.onerror = ((e) => {
                    ++i;
                    putNext();
                  });
                } else {
                  resolve({success: true});
                }
              }
            };

            addItems();
          }

          const tx = this.db.transaction(this.storeName, 'readwrite');
          const store = tx.objectStore(this.storeName);
          process(store);
          tx.onerror = (event) => {
            reject({success: false, message: new Error('Failed to store batch in IndexedDB')});
          };
        });
      } catch (error) {
        return {success: false};
      }
    });
  }

  async getItem(matchData) {
    const filters = {};
    for(const key in matchData) {
      if(matchData.hasOwnProperty(key)) {
        filters[key] = {operator: '=', value: matchData[key]};
      }
    }

    return (await this.findItems({filters}))[0];
  }

  async searchItems({q = '', searchFields = []}) {
    return (await this.findItems({searchFields, query: q}));
  }

  getValue(key, item) {
    const cleanKey = `${key}`.split('.').map(k => `['${k}']`).join('');
    try {
      return eval(`item${cleanKey}`);
    } catch (e) {
      return undefined;
    }
  }

  async findItems({
    filters = null,
    sortField = this.keyPath,
    searchFields = [],
    query = '',
    sortOrder = 'desc',
    limit = null,
    offset = 0
  }: any) {
    return this.enqueue(async () => {
      try {
        return new Promise((resolve, reject) => {
          const tx = this.db.transaction(this.storeName, 'readonly');
          const store = tx.objectStore(this.storeName);
          const results = [];
          let count = 0;
          const request = store.openCursor();

          const sendResponse = (results) => {
            if (sortField) {
              results.sort((a, b) => {
                    return sortOrder === 'asc' ?
                        a[sortField] - b[sortField] : b[sortField] - a[sortField]
                  }
              );
            }
            resolve(results);
          }

          request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
              const item = cursor.value;
              let matchSearch = true, rank = 0;
              const hasSearch = query  && query.trim();
              if (hasSearch) {
                matchSearch = false;
                const normalizedQuery = this.normalizeText(query);

                for (const field of searchFields) {
                  if (item && item[field]) {
                    const normalizedValue = this.normalizeText(item[field]);
                    const fieldWeight = this.relevanceWeights.fieldWeights[field] || 1;

                    if (normalizedValue === normalizedQuery) {
                      rank += this.relevanceWeights.exact * fieldWeight;
                    } else if (normalizedValue.startsWith(normalizedQuery)) {
                      rank += this.relevanceWeights.startsWith * fieldWeight;
                    } else if (normalizedValue.includes(normalizedQuery)) {
                      rank += this.relevanceWeights.contains * fieldWeight;
                    }
                  }
                }

                matchSearch = rank > 0;
              }

              // Apply filters
              let isMatch = true;
              if (filters) {
                const checkIsMatch = (matchFilters) => {
                  let matches = true;
                  for (const [key, condition] of Object.entries(matchFilters)) {
                    const cond: any = condition;
                    const value = this.getValue(key, item) || item[key];

                    if (cond.operator === '=' && value !== cond.value) {
                      matches = false;
                    } else if (cond.operator === '>' && value <= cond.value) {
                      matches = false;
                    } else if (cond.operator === '<' && value >= cond.value) {
                      matches = false;
                    } else if (cond.operator === 'contains' &&
                        !value.toLowerCase().includes(cond.value.toLowerCase())) {
                      matches = false;
                    } else if (cond.operator === 'range') {
                      if (value < cond.value[0] || value > cond.value[1]) {
                        matches = false;
                      }
                    } else if (cond.operator === '$in') {
                      if (Array.isArray(value)) {
                        if (!value.some(val => cond.value.includes(val))) {
                          matches = false;
                        }
                      } else if (!cond.value.includes(value)) {
                        matches = false;
                      }
                    } else if (cond.operator === '$not' && value === cond.value) {
                      matches = false;
                    }
                  }

                  return matches;
                }

                for (const [key, condition] of Object.entries(filters)) {
                  if(key === '$or') {
                    const res = [];
                    for(const subFilters of condition) {
                      res.push(checkIsMatch(subFilters));
                    }

                    const areAllFalse = res.filter(bool => bool === true).length === 0;
                    if(areAllFalse) {
                      isMatch = false;
                    }
                  } else {
                     if(!checkIsMatch({[key]: condition})) {
                       isMatch = false;
                     }
                  }
                }
              }

              if (isMatch && matchSearch) {
                if (count >= offset) {
                  results.push(item);
                }
                count++;
              }

              if (!limit || results.length < limit) {
                cursor.continue();
              } else {
                sendResponse(results);
              }
            } else {
              sendResponse(results);
            }
          };

          request.onerror = (event) => {
            reject({success: false, message: new Error('Failed to filter IndexedDB')});
          };
        });
      } catch (error) {
        return {success: false};
      }
    });
  }
}

