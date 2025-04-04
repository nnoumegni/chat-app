import {DmRoom, Room, RoomUser, User} from "../models/chat-models";
import * as CryptoJS from 'crypto-js';
import {Storage} from "../api/storage";
import ColorHash from './../../../public/assets/static/color-hash';
import {findIndex} from 'lodash';
import {IconUsers} from "../components/Icons";
import {StorageService} from "./storage.service";

export class Utils {
    static browserDeviceIdStorageKey = 'buuid' ;
    static storageService = new StorageService();
    static BREAK_POINT = 768;

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
            room.thumb = dmUser.thumb;
        } else {
            room.thumb = IconUsers({type: 'string'}) as string;
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
            const {id, fullname, thumb} = user;
            const dmUserId = id as number;
            const currentUserId = currentUser.id as number;
            const dmUser = {
                userId: dmUserId,
                fullname,
                thumb
            };

            const me = {
                userId: currentUser.id as number,
                fullname: currentUser.fullname,
                thumb: currentUser.thumb
            }

            const users: any = {
                [currentUser.id]: me,
                [dmUserId]: dmUser
            }

            const uri = this.getDmRoomUri({dmUser, currentUser: me});

            return {
                name: fullname,
                uri,
                roomUri: uri,
                users,
                addedBy: currentUserId,
                type: 'dm',
                thumb
            }
    }

    static getDmRoomUri({dmUser, currentUser}) {
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

    static async getSessionData() {
        return Promise.all([
            this.storageService.get('sessionInfoStr'),
            this.storageService.get('selectedOrg')
        ]).then(([sessionInfoStr, selectedOrg]) => {
            if(!sessionInfoStr) {
                return {};
            }

            const sessionInfo = !!sessionInfoStr ? JSON.parse(sessionInfoStr) : {};
            const {id, profileImage: thumb, fullname} = sessionInfo;
            const memberID = !!sessionInfo ? parseInt(sessionInfo.id, 10) : 0;
            const token = !!sessionInfo ? sessionInfo.token : '';
            return {
                memberID,
                user: {id, thumb, fullname},
                token,
                orgSettings: selectedOrg
            };
        });
    }

    static async setSessionData({account}) {
        return this.storageService.set('sessionInfoStr', JSON.stringify(account))
    }

    static getTextToColor = (str) => {
        const colorHash = new ColorHash({
            lightness: 0.4, saturation: 0.9
        });
        return colorHash.hex(`${str}`);
    }

    static thumbFromInitials({fullName = ''} = {}) {

        const thumbSize = 50;
        const splits = fullName.split(' ').filter(x => !!x && !!x.trim());
        if (!(splits && splits[0])) { return; }
        const initials = splits.length > 1 ? `${splits[0][0]}${splits[1][0]}` : `${splits[0][0]}${splits[0][1] || splits[0][0]}`;

        const svg = `<svg width="${thumbSize}" height="${thumbSize}">
            <rect x="0" y="0" width="${thumbSize}" height="${thumbSize}" fill="${this.getTextToColor(fullName)}"/>
            <text
              x="50%"
              y="50%"
              dominant-baseline="middle"
              text-anchor="middle"
              fill="#ffffff"
              style="text-align: center;border-radius: 100%;text-transform: uppercase;color: rgb(255, 255, 255);background-color: rgb(231, 76, 60);font: 1.3em / 40px Helvetica, Arial, sans-serif;font-weight: bold;"
            >${initials.toUpperCase()}</text>
        </svg>`;

        const encodeSvg = (svgString) => {
            return 'data:image/svg+xml,' + svgString.replace('<svg', (~svgString.indexOf('xmlns') ? '<svg' : '<svg xmlns="http://www.w3.org/2000/svg"'))

                .replace(/"/g, '\'')
                .replace(/%/g, '%25')
                .replace(/#/g, '%23')
                .replace(/{/g, '%7B')
                .replace(/}/g, '%7D')
                .replace(/</g, '%3C')
                .replace(/>/g, '%3E')

                .replace(/\s+/g, ' ');
        };

        return encodeSvg(svg);
    }

    static toggleSideNav(evt: any) {
        const item = evt.target;
        let isOption = item.closest('.tyn-aside-item-option');
        !isOption && item.classList.add('active');
        !isOption && document.getElementById('tynMain').classList.toggle('main-shown');
    }
}
