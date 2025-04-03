import * as storage from '../../../public/assets/static/store.everything.min';

export class StorageService {
  constructor() {}

  /**
   * Get the value associated with the given name.
   * @param name the name to identify this value
   * @returns Returns a promise with the value of the given name
   */
  get(name: string): Promise<any> {
    const value = storage.get(name);
    return Promise.resolve(value);
  }

  /**
   * Set the value for the given name.
   * @param name the name to identify this value
   * @param value the value for this name
   * @returns Returns a promise that resolves when the name and value are set
   */
  set(name: string, value: any): Promise<any> {
    storage.set(name, value);
    return Promise.resolve();
  }

  /**
   * Remove any value associated with this name.
   * @param name the name to identify this value
   * @returns Returns a promise that resolves when the value is removed
   */
  remove(name: string): Promise<any> {
    storage.remove(name);
    return Promise.resolve();
  }

  /**
   * Clear the entire name value store. WARNING: HOT!
   * @returns Returns a promise that resolves when the store is cleared
   */
  clear(): Promise<void> {
    storage.clearAll();
    return Promise.resolve();
  }

  /**
   * @returns Returns a promise that resolves with the number of names stored.
   */
  length(): Promise<number> {
    return Promise.resolve(0);
  }

  /**
   * @returns Returns a promise that resolves with the names in the store.
   */
  keys(): Promise<string[]> {
    return Promise.resolve([]);
  }
}
