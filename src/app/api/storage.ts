import {IndexedDB} from "./indexedbd";
import {DB_NAME, FULL_NAME_INDEX_FIELDS, LOCAL_STORAGE_TABLE_NAME} from "../constants/api-configs";

export class Storage {
  indexedDB;

  constructor() {
    this.indexedDB = new IndexedDB(DB_NAME);
  }

  /**
   * Get the value associated with the given name.
   * @param name the name to identify this value
   * @returns Returns a promise with the value of the given name
   */
  async get(name: string) {
    await this.indexedDB.setup(LOCAL_STORAGE_TABLE_NAME, [FULL_NAME_INDEX_FIELDS]);
    const item = (await this.indexedDB.getItem({name})) || {};
    return item.value;
  }

  /**
   * Set the value for the given name.
   * @param name the name to identify this value
   * @param value the value for this name
   * @returns Returns a promise that resolves when the name and value are set
   */
  async set(name: string, value: any) {
    await this.indexedDB.setup(LOCAL_STORAGE_TABLE_NAME, [FULL_NAME_INDEX_FIELDS]);
    return await this.indexedDB.addOrUpdate({name}, {name, value});
  }

  /**
   * Remove any value associated with this name.
   * @param name the name to identify this value
   * @returns Returns a promise that resolves when the value is removed
   */
  async remove(name: string) {
    await this.indexedDB.setup(LOCAL_STORAGE_TABLE_NAME, [FULL_NAME_INDEX_FIELDS]);
    return await this.indexedDB.deleteItem({name});
  }

  /**
   * Clear the entire name value store. WARNING: HOT!
   * @returns Returns a promise that resolves when the store is cleared
   */
  async clear() {}

  /**
   * @returns Returns a promise that resolves with the number of names stored.
   */
  async length() {}

  /**
   * @returns Returns a promise that resolves with the names in the store.
   */
  async keys() {}
}
