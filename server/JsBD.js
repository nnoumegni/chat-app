const path = require('path');
const {exec, execSync} = require('child_process');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const cacheRootDir = __dirname;
const DbDirLocation = path.join(cacheRootDir, 'databases');
const fs = require("fs");
const { isEqual, findIndex, shuffle } = require('lodash');

// Using function keyword is important here
Array.prototype.move =  function (old_index, new_index) {
  if (new_index >= this.length) {
    let k = new_index - this.length;
    while (k-- + 1) {
      this.push(undefined);
    }
  }
  this.splice(new_index, 0, this.splice(old_index, 1)[0]);
  return this;
};

class JsBD {

  constructor(dirLocation) {
    this.dirLocation = dirLocation || DbDirLocation;

    this.indexes = {};
    this.documents = {};
    this.searchOptions = {
      shouldSort: true,
      threshold: 0.6,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: [
        "word",
      ]
    };

    this.queue = {};
    this.locks = {};
    this.writeTm = {};
  }

  async lockWrite(dbName, tableName, items) {
    const refName = `${dbName}_${tableName}`;

    // Add the the queue table if not exist
    if(!this.queue[refName]) {
      this.queue[refName] = [];
    }

    // Append to queue
    this.queue[refName] = [...this.queue[refName], ...[{dbName, tableName, items}]];

    const that = this;
    (await async function processWrite() {
      // Check if operation already in progress and return if so
      if (that.locks[refName]) {
        return;
      }

      // get the first item from the queue
      const item = that.queue[refName].shift();
      if (item) {
        // Lock the table while writinng to it
        that.locks[refName] = true;

        // Process with the write operation
        const {dbName, tableName, items} = item;
        const db = await that.getItemJsonDb(dbName, tableName);
        db.set(tableName, items).write();

        // Unluck the table
        that.writeTm[refName] && clearTimeout(that.writeTm[refName]);
        that.writeTm[refName] = setTimeout(() => {
          that.locks[refName] = false;

          // Check if there are more items to process
          processWrite();
        }, 100);
      }
    }())
  }

  async addItem(itemBbName, itemTableName, data = {}) {

    const items = await this.getItems(itemBbName, itemTableName, 0, 0);
    const newItems = items.concat([data]);
    const lockKey = `addItem_${itemBbName}_${itemTableName}`;

    await this.lockSetData(lockKey, itemBbName, itemTableName, newItems);

    return [];
  }

  async lockAddItem(itemBbName, itemTableName, data = {}) {

    const db = await this.getItemJsonDb(itemBbName, itemTableName);
    let items = db.get(itemTableName).value() || [];
    const tableExist = items && items.length > 0;
    if(!tableExist) {
      let defaultData = {};
      defaultData[itemTableName] = [];
      db.defaults(defaultData).write();
    }

    const newItems = db.get(itemTableName).concat([data]).value() || [];
    await this.lockWrite(itemBbName, itemTableName, newItems);

    return [];
  }

  async bulkAddItems(itemDbName, itemTableName, dataItems = []) {

    const db = await this.getItemJsonDb(itemDbName, itemTableName);
    let items = db.get(itemTableName).value() || [];
    const tableExist = items && items.length > 0;
    if(!tableExist) {
      let defaultData = {};
      defaultData[itemTableName] = [];
      db.defaults(defaultData).write();
    }

    const newItems = db.get(itemTableName).concat(dataItems).value() || [];
    db.set(itemTableName, newItems).write();

    return db.get(itemTableName).value() || [];
  }

  doExecSync(cmd){
    try {
        execSync(cmd);
    } catch(e) {
        console.log(`${cmd}`, e);
    }
  }

  async getItemJsonDb(itemDbName, itemTableName) {
    if(!itemDbName) {
      throw new Error('Oops. No db name specified !');
    }

    if(isNaN(itemTableName) && !itemTableName) {
      throw new Error('Oops. No table name specified !');
    }

    this.doExecSync(`sudo chown -R $USER:$USER ${cacheRootDir}`);
    this.doExecSync(`sudo chmod -R 755 ${cacheRootDir}`);

    const dbDir = `${this.dirLocation}/${itemDbName}`;

    if (!fs.existsSync(dbDir)){
      try{
        fs.mkdirSync(dbDir, {recursive:true});
      }catch(e){
        console.log(e);
        return;
      }
    }

    this.doExecSync(`sudo chown -R $USER:$USER ${dbDir}`);
    this.doExecSync(`sudo chmod -R 755 ${dbDir}`);

    const dbFile = `${dbDir}/${itemTableName}.json`;
    console.log({dbFile});
    const adapter = new FileSync(dbFile);
    return low(adapter);
  }

  async getItems(itemDbName, itemTableName, page=0, itemPerPage=200, reverse=false, shuffle=false) {
    const db = await this.getItemJsonDb(itemDbName, itemTableName);
    let media = db.get(itemTableName).value() || [];
    if(shuffle) {
      media = shuffle(media);
    }

    if(media && media.length > 0) {
      if(reverse) {
        media = media.reverse();
      }

      // return media.filter(x => x && parseInt(x.status, 10) < 3);
      if(itemPerPage === 0) {
        return media.filter(x => x);
      } else {
        return media.filter(x => x).slice(page, itemPerPage);
      }

    } else if(media) {
      return media;
    } else {
      return [];
    }
  }

  async getCount(itemDbName, itemTableName) {
    const db = await this.getItemJsonDb(itemDbName, itemTableName);
    return (db.get(itemTableName).value() || []).length;
  }

  async findItems(itemDbName, itemTableName, data) {
    const db = await this.getItemJsonDb(itemDbName, itemTableName);
    const media = db.get(itemTableName).value() || [];
    const keys = Object.keys(data);
    if(media && media.length > 0 && keys && keys.length > 0) {
      return media.filter((item) => {
        if(!item) { return false; }
        let match = false;
        keys.forEach((key) => {
          if(isEqual(String(item[key]), String(data[key]))) {
            match = true;
          }
        });

        return match;
      });
    } else {
      return [];
    }
  }

  // This return an object and not an array
  async getItem(itemDbName, itemTableName, data) {
    const db = await this.getItemJsonDb(itemDbName, itemTableName);
    return db.get(itemTableName)
        .find(data)
        .value() || [];
  }

  async updateItemById(itemDbName, itemTableName, data) {
    const id = data.id;
    return await this.updateItem(itemDbName, itemTableName, {id}, data);
  }

  async updateItem(itemDbName, itemTableName, matchData, newObjdata) {
    const media = await this.getItems(itemDbName, itemTableName, 0, 0);
    const keys = Object.keys(matchData);

    let newItems = media;
    if(keys && keys.length > 0) {
      newItems = media.map((item) => {
        let match = false;
        keys.forEach((key) => {
          if(isEqual(String(item[key]), String(matchData[key]))) {
            match = true;
          }
        });

        if(match) {
          console.log('match: ', {...item, ...newObjdata});
          return {...item, ...newObjdata};
        } else {
          return item;
        }
      });
    }

    const lockKey = `updateItem_${itemDbName}_${itemTableName}`;
    await this.lockSetData(lockKey, itemDbName, itemTableName, newItems);

    return newItems;
  }

  async lockSetData(lockKey, itemDbName, itemTableName, data) {
    const db = await this.getItemJsonDb(itemDbName, itemTableName);
    (() => {
      this.writeTm[lockKey] && clearTimeout(this.writeTm[lockKey]);
      this.writeTm[lockKey] = setTimeout(() => {
        db.set(itemTableName, data).write();
      }, 100);
    })();
  }

  async lockUpdateItem(itemDbName, itemTableName, matchData, newObjdata) {
    const db = await this.getItemJsonDb(itemDbName, itemTableName);
    let media = db.get(itemTableName).value() || [];
    const keys = Object.keys(matchData);

    let newItems = media;
    if(keys && keys.length > 0) {
      newItems = media.map((item) => {
        let match = false;
        keys.forEach((key) => {
          if(isEqual(String(item[key]), String(matchData[key]))) {
            match = true;
          }
        });

        if(match) {
          return {...item, ...newObjdata};
        } else {
          return item;
        }
      });
    }

    await this.lockWrite(itemDbName, itemTableName, newItems);

    return newItems;
  }

  async updateAll(itemDbName, itemTableName, newObjdata) {
    const db = await this.getItemJsonDb(itemDbName, itemTableName);
    let media = db.get(itemTableName).value() || [];

    const newItems = media.map((item) => {
      return {...item, ...newObjdata};
    });

    const resp = db.set(itemTableName, newItems).write();

    return newItems;
  }

  async addOrUpdateItem(itemDbName, itemTableName, matchData, newObjdata) {
    const items = await this.findItems(itemDbName, itemTableName, matchData);
    if(items && items.length > 0) {
      return await this.updateItem(itemDbName, itemTableName, matchData, newObjdata);
    } else {
      return await this.addItem(itemDbName, itemTableName, newObjdata);
    }
  }

  async lockAddOrUpdateItem(itemDbName, itemTableName, matchData, newObjdata) {
    const items = await this.findItems(itemDbName, itemTableName, matchData);
    if(items && items.length > 0) {
      return await this.lockUpdateItem(itemDbName, itemTableName, matchData, newObjdata);
    } else {
      return await this.lockAddItem(itemDbName, itemTableName, newObjdata);
    }
  }

  async addOrUpdateItemById(itemDbName, itemTableName, data) {
    const items = await this.findItems(itemDbName, itemTableName, {id: data.id});
    if(items[0]) {
      return await this.updateItemById(itemDbName, itemTableName, data);
    }

    return await this.addItem(itemDbName, itemTableName, data);
  }

  async deleteItem(itemDbName, itemTableName, data) {
    // Remove from json DB
    const db = await this.getItemJsonDb(`${itemDbName}`, `${itemTableName}`);

    const currentItems = db.get(`${itemTableName}`).value() || [];
    if(currentItems && currentItems.length > 0) {
      const keys = Object.keys(data);
      const newItems = currentItems.filter((item) => {
        if(!item) { return false; }
        let match = [];
        keys.forEach((key) => {
          if(isEqual(String(item[key]), String(data[key]))) {
            match.push(key);
          }
        });

        return match.length !== keys.length;
      });

      db.set(`${itemTableName}`, newItems).write();
    }

    return await this.getItems(`${itemDbName}`, `${itemTableName}`);
  }

  async deleteItemAt(itemDbName, itemTableName, index) {
    let arr = await this.getItems(itemDbName, itemTableName, 0, 0) || [];
    const initCount = arr.length;
    if(arr && arr.length && index < arr.length && index >= 0) {
      arr.splice(index, 1);
    }

    await this.setItems(itemDbName, itemTableName, arr);

    return { items: arr, success: initCount !== arr.length };
  }

  async setItems(itemDbName, itemTableName, dataItems = []) {
    const db = await this.getItemJsonDb(itemDbName, itemTableName);
    db.set(itemTableName, dataItems).write();

    return dataItems; //db.get(this.itemTableName).value();
  }

  async assignData(itemDbName, itemTableName, data) {
    const id = data.id;
    const db = await this.getItemJsonDb(itemDbName, itemTableName);
    db.get(itemTableName)
        .assign(data)
        .write();

    return await this.getItems(itemDbName, itemTableName);
  }

  async searchItem(itemDbName, itemTableName, q, key='title') {
    const db = await this.getItemJsonDb(itemDbName, itemTableName);
    const search = this.makeSortString(q);
    const items = db.get(itemTableName).value() || [];
    return items.filter((item) => {
      if(item[key]) {
        const str = this.makeSortString(item[key]);
        return str.indexOf(search) !== -1;
      }

      return false;
    });
  }

  searchInArray(items = [], q, key='title') {
    const search = this.makeSortString(q);
    return items.filter((item) => {
      if(item[key]) {
        const str = this.makeSortString(item[key]);
        return str.indexOf(search) !== -1;
      }

      return false;
    });
  }

  makeSortString(str = '') {
    const s = str.toLowerCase();
    if(!this.makeSortString.translate_re) this.makeSortString.translate_re = /[öäüÖÄÜàâçèéêîôùû]/g;
    const translate = {
      "à": "a", "â":"a", "ç":"c", "è":"e", "é":"e", "ê":"e", "î":"i", "ô":"o", "ù":"u", "û":"u", "ä": "a", "ö": "o", "ü": "u", "Ä": "a", "Ö": "o", "Ü": "u"   // probably more to come
    };
    return ( s.replace(this.makeSortString.translate_re, (match) => {
      return translate[match];
    }));
  }

  sortByNumberParam(data = [], param, order = 'desc') {
    return data.sort((a, b) => {
      if (order === 'desc') {
        return parseFloat(String(b[param])) - parseFloat(String(a[param]));
      }

      return parseFloat(String(a[param])) - parseFloat(String(b[param]));
    });
  }

  async rotateTableItems(itemDbName, itemTableName, reverse) {
    const arr = await this.getItems(itemDbName, itemTableName, 0, 0);
    if (reverse) arr.unshift(arr.pop());
    else arr.push(arr.shift());

    return await this.setItems(itemDbName, itemTableName, arr);
  }

  async insertItemAt(itemDbName, itemTableName, item, position=0) {
    let arr = await this.getItems(itemDbName, itemTableName, 0, 0) || [];
    if(arr && arr.length) {
      const pos = findIndex(arr, (e) => (e.uri === item.uri || e.id === item.id));
      if (pos > 0) {
        let newPos = position;
        if(newPos < 0) {
          newPos = arr.length - 1;
        }

        arr.move(pos, newPos);
      }
    }

    await this.setItems(itemDbName, itemTableName, arr);

    // Pass null for item if you just want to move it
    if(item) {
      if(item.uri)  {
        await this.addOrUpdateItem(itemDbName, itemTableName, {uri: item.uri}, item);
      } else if(item.id)  {
        await this.addOrUpdateItem(itemDbName, itemTableName, {id: item.id}, item);
      }
    }

  }

  async addItemAt(itemDbName, itemTableName, item, index=0) {
    let arr = await this.getItems(itemDbName, itemTableName, 0, 0) || [];
    if(index === 0 || (index < arr.length && index > 0)) {
      arr.splice(index, 0, item);
    }

    await this.setItems(itemDbName, itemTableName, arr);
  }

  async moveItem(itemDbName, itemTableName, from=0, to=0) {
    let arr = await this.getItems(itemDbName, itemTableName, 0, 0) || [];
    if(arr && arr.length && from < arr.length && to < arr.length && from >= 0 && to >= 0) {
      arr.move(from, to);
    }

    await this.setItems(itemDbName, itemTableName, arr);
  }

  async getRawData(itemDbName, itemTableName) {
    const db = await this.getItemJsonDb(itemDbName, itemTableName);
    return db.value();
  }

  async getInstance(itemDbName, itemTableName) {
    return await this.getItemJsonDb(itemDbName, itemTableName);
  }
}

module.exports = JsBD;

