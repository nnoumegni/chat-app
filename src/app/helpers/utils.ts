import {DmRoom, Room, RoomUser, User} from "../models/chat-models";
import * as CryptoJS from 'crypto-js';
import {Storage} from "../api/storage";
import {findIndex} from 'lodash';

export class Utils {
    static browserDeviceIdStorageKey = 'buuid' ;

    static platform = {
        is: (type = '') => false
    }

    static formattedRoom({room, currentUser}: {room: Room; currentUser: User}) {
        const userData = room.users;
        const keys = Object.keys(userData).map(key => parseInt(key, 10));
        const isDm = room.type === 'dm';

        if(isDm) {
            let dmUser;
            // If Im DM myself
            if (keys.length === 1) {
                if (userData) {
                    dmUser = userData[currentUser.id];
                }
            } else if (keys.length === 2) {
                const index = keys.findIndex(key => key !== currentUser.id);
                if (index !== -1) {
                    const userKey = keys[index];
                    if (userData) {
                        dmUser = userData[userKey];
                    }
                }
            }

            room.name = dmUser.fullname;
        }

        return room;
    }

    static md5(str) {
        return CryptoJS.MD5(str).toString();
    }

    static aes(params) {
        const token = params.token || `${new Date().getTime()}`;
        return CryptoJS.AES.encrypt(JSON.stringify(params), token, {}).toString();
    }

    static loadScripts({urls = [], replaceIfExists = true, callback, docElt = null}) {
        const that = this;
        (function loadScript() {
            const url = urls.shift();
            if (!url) {
                if (typeof callback === 'function') {
                    callback();
                }
                return;
            }

            const startDate = new Date();

            const id = that.md5(url);

            // Adding the script tag to the head as suggested before
            const doc = docElt || (document as any);
            const elt = doc.getElementById(id);
            if (elt) {
                if (replaceIfExists) {
                    elt.parentNode.removeChild(doc.getElementById(id));
                } else {
                    // Load next script
                    return loadScript();
                }
            }
            const head = doc.body;
            const script = doc.createElement('script') as any;
            script.type = 'text/javascript';
            script.src = url;
            if (id) { script.id = id; }

            // Then bind the event to the callback function.
            // There are several events for cross browser compatibility.
            script.onreadystatechange = callback;
            script.onload = () => {
                loadScript();
            };

            script.onerror = () => {
                loadScript();
            };

            // Fire the loading
            head.appendChild(script);
        }());
    }

    static unLoadScript(id, callback) {
        // Adding the script tag to the head as suggested before
        const doc = (document as any);
        const elt = doc.getElementById(id);
        if (elt) { elt.parentNode.removeChild(doc.getElementById(id)); }
        if (typeof callback === 'function') {
            callback();
        }
    }

    static getUserDataMap(users: RoomUser[]) {
        const userMap = {};
        users.map((user: RoomUser) => {
            const {userId} = user;
            userMap[userId] = user;
        });

        return userMap;
    }

    static async setBrowserDeviceId(backendStoredValue = null) {
        return new Promise(async (resolve) => {
            const storage = new Storage();

            if (!this.platform.is('hybrid')) {
                const global = window as any;
                const setDeviceId = (id) => {
                    (window as any).device = {
                        ...this.getWebFallback(),
                        ...{uuid: id}
                    };

                    storage.set(this.browserDeviceIdStorageKey, id).then(() => {
                        resolve(id);
                    })
                };

                // Important for consistency across browsers and devices
                if (backendStoredValue) {
                    return setDeviceId(backendStoredValue);
                }

                const storedBrowserId = await storage.get(this.browserDeviceIdStorageKey);

                if (storedBrowserId) {
                    return setDeviceId(storedBrowserId);
                }

                this.loadScripts({urls: ['/assets/static/fp.min.js'], callback: () => {
                        const fpPromise = global.FingerprintJS.load();
                        fpPromise.then(fp => fp.get()).then(result => {
                            const visitorId = result.visitorId;
                            console.log(visitorId)
                            setDeviceId(visitorId);
                        });
                    }
                });
            } else {
                this.deviceInfo();
            }
        })
    }

    // TODO: implement this on the native app version
    static deviceInfo() {
        return {};
    }

    // Fallback method for web platforms
    static getWebFallback(): { model: string; platform: string; manufacturer: string } {
        const userAgent = navigator.userAgent;
        const platform = navigator.platform;

        let model = 'Unknown Model';
        let manufacturer = 'Unknown Manufacturer';

        if (/Android/.test(userAgent)) {
            model = 'Android Device';
            manufacturer = 'Google';
        } else if (/iPhone|iPad|iPod/.test(userAgent)) {
            model = 'Apple Device';
            manufacturer = 'Apple';
        } else if (/Win/.test(platform)) {
            model = 'Windows PC';
            manufacturer = 'Microsoft';
        } else if (/Mac/.test(platform)) {
            model = 'Mac Device';
            manufacturer = 'Apple';
        } else if (/Linux/.test(platform)) {
            model = 'Linux Device';
            manufacturer = 'Unknown';
        }

        return {
            model,
            platform: platform || 'web',
            manufacturer,
        };
    }

    static roomUserMapper({user, currentUser}: {user: User, currentUser: User}): DmRoom & {uri: string} {
            const {id, fullname} = user;
            const dmUserId = id as number;
            const currentUserId = currentUser.id as number;
            const dmUser = {
                userId: dmUserId,
                fullname
            };

            const me = {
                userId: currentUser.id as number,
                fullname: currentUser.fullname
            }

            const uri = this.getDmRoomUri({dmUser, currentUser: me});

            return {
                name: fullname,
                uri,
                roomUri: uri,
                users: [dmUser, me],
                addedBy: currentUserId,
                type: 'dm'
            }
    }

    static getDmRoomUri({dmUser, currentUser}) {
        if(!dmUser) {
            debugger;
        }
        const sortedIds = [dmUser.userId, currentUser.userId].sort();
        const uniqueDmRoomUri = parseInt(sortedIds.join(''), 10);
        return `${uniqueDmRoomUri}`;
    }

    static addOrMoveArrayItem({arr, matchData, new_index, item}) {
        const old_index = findIndex(arr, matchData);
        console.log(arr, matchData, item, old_index)
        if (old_index !== -1) {
            arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
        } else {
            arr.splice(new_index, 0, item);
        }

        return arr;
    };
}
