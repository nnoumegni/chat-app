import {useState} from "react";
import axios from "axios";
import {HmacSHA256, enc, AES} from "crypto-js";
import {AddRoom, ApiRequest, ApiResponse, Message, Room, RoomUser, UpdateRoom, User} from "../models/chat-models";
import {IndexedDB} from "./indexedbd";
import {
    BACKEND_URL,
    DB_NAME,
    FULL_NAME_INDEX_FIELDS,
    NAME_INDEX_FIELDS,
    ROOM_MESSAGES_DB_NAME,
    ROOMS_DB_NAME,
    ROOMS_TABLE_NAME,
    TEXT_INDEX_FIELDS,
    USERS_TABLE_NAME
} from "../constants/api-configs";
import {Utils} from "../helpers/utils";

// The main purpose of this hook is to persist data using IndexesDB and handle api calls
export const useFetchData = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const indexedDB = new IndexedDB(DB_NAME);

    const handleApiCall = (params: ApiRequest): Promise<ApiResponse | unknown>  => {
        const handler = {
            chat: {
                addRoom,
                getRooms,
                getUserRooms,
                addRoomUser,
                getRoomUsers,
                addMessage,
                getMessages,
                searchUsers,
                subscribe: (data) => {
                    return runChatAction({path: 'subscribe', data})
                },
                unsubscribe: (data) => {
                    return runChatAction({path: 'unsubscribe', data})
                },
                emit: ({eventName, message}: {eventName: string; message: Message}) => {
                    return runChatAction({path: 'emit', data: {eventName, payload: message}})
                }
            },
            account: {
                doLogin,
                doRegister
            }
        }

        // token can be used for pre-fetch auth
        const {path, action, token, data} = params;

        setLoading(true);

        // Each API method should be a promise that returns an object of the type ApiResponse
        return handler[path][action](data).then((resp) => {
            setLoading(false);
            setData(resp);
            return resp;
        }, (error) => {
            setLoading(false);
            setError(error);
        });

    };

    const getUserRooms = async ({userId}) => {
        const idb = new IndexedDB(ROOMS_DB_NAME);
        // Set the table name and the search index field
        await idb.setup(ROOMS_TABLE_NAME, [NAME_INDEX_FIELDS]);

        const filters = {
            active: {value: 0, operator: '$not'},
            $or: [
                {[`users.${userId}.userId`]: {value: userId, operator: '='}},
                {type: {value: 'dm', operator: '$not'}}
            ],
        };

        return await idb.findItems({filters});
    }

    const getRooms = async (filters): Promise<Room[]> => {
        const idb = new IndexedDB(ROOMS_DB_NAME);
        // Important: this prevent from listing all the rooms in the DB
        if(!(filters && Object.keys(filters).length)) {
            return []
        }

        // Set the table name and the search index field
        await idb.setup(ROOMS_TABLE_NAME, [NAME_INDEX_FIELDS]);
        return (await idb.findItems({filters})) as Room[];
    }

    const addRoom = async ({name, addedBy, users: roomUsers, roomUri, type}: AddRoom) => {
        const idb = new IndexedDB(ROOMS_DB_NAME);
        const uri = roomUri || `${crypto.randomUUID()}-${addedBy}`;


        // Note: saving users as hashMap will perform well during lookup
        const users = {};
        if (roomUsers && roomUsers[0]) {
            for (let i = 0; i < roomUsers.length; i++) {
                const user = roomUsers[i];
                users[user.userId] = user;
            }
        }

        const newRoomData = {name, addedBy, uri, type, users};

        // Set the table name and the search index field
        await idb.setup(ROOMS_TABLE_NAME, [NAME_INDEX_FIELDS]);
        const {success, exists} = await idb.addIfNotExist({uri}, newRoomData);

        if(success) {
            return {success, exists, room: newRoomData};
        }

        return {success: false};
    }

    const updateRoom = async ({roomUri, data}: {roomUri: string; data: UpdateRoom}) => {
        const idb = new IndexedDB(ROOMS_DB_NAME);
        // Set the table name and the search index field
        await idb.setup(ROOMS_TABLE_NAME, [NAME_INDEX_FIELDS]);
        return await idb.addOrUpdate({uri: roomUri}, data);
    }

    const getRoomUsers = async ({roomUri, userIds, callback}: {roomUri: string; userIds?: number[], callback?: (connectedUsers: number[]) => void}) => {
        const roomUsers = [];

        const filters = {
            uri: {value: roomUri, operator: '='},
        };

        const rooms: Room[] = await getRooms(filters);
        if(rooms && rooms.length === 1) {
            const allUsers = rooms[0].users || {};
            const currentUserIds = Object.keys(allUsers);

            const hasFilter = userIds && userIds[0];
            while(currentUserIds.length) {
                const userId = currentUserIds.shift() as string;
                if(!hasFilter || hasFilter && userIds.includes(parseInt(userId, 10))) {
                    roomUsers.push(allUsers[userId]);
                }
            }
        }

        // Get connected user list
        // For a better user experience, let's not wait for this backend call to complete before giving the user a feedback
        // The callback function will be used to decorate the user object afterward
        // Note: Ideally we should only run this when bootstrapping the app and have an event listener to update the list when users join/leave a room
        runChatAction({path: 'get-room-users', data: {roomUri}}).then((resp) => {
            const {success, users} = resp || {};
            if(typeof callback === 'function' && success) {
                callback(users);
            }
        });

        return roomUsers;
    }

    // Important: we should ideally save the userId only and use it later to retrieve
    // the latest user info from the users table to be up to date as it will constantly change
    const addRoomUser = async ({roomUri, user}: {roomUri: string; user: RoomUser}) => {
        const filters = {
            uri: {value: roomUri, operator: '='},
        };

        const rooms: Room[] = await getRooms(filters);
        if(rooms && rooms.length === 1) {
            const users: any = rooms[0].users || {};
            users[user.userId] = user;
            return await updateRoom({roomUri, data: {users}});
        }

        return {success: false};

    }

    const getMessages = async ({roomUri}: {roomUri: string}) => {
        const idb = new IndexedDB(ROOM_MESSAGES_DB_NAME);
        const tableName = `${roomUri}`;

        // Set the table name and the search index field
        await idb.setup(tableName, [TEXT_INDEX_FIELDS]);
        return await idb.findItems({sortOrder: 'desc'});
    }

    const addMessage = async ({message}: {message: Message;}) => {
        const {roomUri} = message;
        const idb = new IndexedDB(ROOM_MESSAGES_DB_NAME);
        const tableName = `${roomUri}`;

        // Set the table name and the search index field
        await idb.setup(tableName, [TEXT_INDEX_FIELDS]);

        const {success} = idb.setItems([message]);
        if(success) {
            return updateRoom({roomUri, data: {active: 1}})
        }

        return {success: false};
    }

    const generateToken = ({username, password}) => {
        const data = `${username}:${password}`;
        return HmacSHA256(data, `${password}`).toString(enc.Hex);
    };

    const doRegister = async (user: {username: string; password: string; fullname: string}) => {
        await indexedDB.setup(USERS_TABLE_NAME, [FULL_NAME_INDEX_FIELDS]);
        const {username, password, fullname} = user;
        const token = generateToken({username, password});

        // Important: never save user plain password. Instead using as part of the encryption salt
        const {success} = await indexedDB.addItem({username, token, fullname});
        if(success) {
            return doLogin(user);
        }

        return {success};
    }

    const doLogin = async ({username, password, token}: {username: string; password: string}) => {
        token = token ? token : `${new Date().getTime()}`;
        const params = {
            path: 'account',
            action: 'doProxyAuth',
            token,
            data: {doLogin: 1, username, password, token}
        };

        const encryptedData =  Utils.aes(params); //  CryptoJS.AES.encrypt(JSON.stringify(params), params.token, {}).toString();
        const reqData = {
            data: encryptedData,
            token
        };

        return runChatAction({path: 'auth', data: reqData}).then(resp => {
            const {success, user} = resp || {};
            if(user) {
                const authData = JSON.stringify({username, token, user});
                localStorage.setItem("authData", authData);
            }
            return resp;
        });

        /*
        await indexedDB.setup(USERS_TABLE_NAME, [FULL_NAME_INDEX_FIELDS]);

        if(!token) {
            token = generateToken({username, password});
        }

        const user = await indexedDB.getItem({username, token});

        if(user) {
            const authData = JSON.stringify({username, token, user});
            localStorage.setItem("authData", authData);
        }

        return {success: !!user, user};
        */
    }

    const searchUsers = async ({q = ''}) => {
        if(!(q && q.trim())) {
            return []
        }

        const token = `${new Date().getTime()}`;
        const params = {
            path: 'account',
            action: 'searchSocialProfile',
            token,
            data: {matchStr: q, exactMatch: true}
        };

        const encryptedData =  Utils.aes(params);
        const reqData = {
            data: encryptedData,
            token
        };

        return runChatAction({path: 'scrud', data: reqData}).then(resp => {
            const {data} = resp;
            const users = (data || []).map(p => {
                const {profileImage: thumb, City: city, Country: country, FirstName: firstname, LastName: lastname, ID: id, FullName: fullname} = p;
                return { id, firstname, lastname, fullname, city, country, thumb};
            });

            return users;
        });
    }

    const runChatAction = ({path, data}: {path: string; data: unknown}) => {
        setLoading(true);

        return axios({
            method: 'post',
            url: `${BACKEND_URL}/${path}`,
            data
        }).then(resp => {
            const {data} = resp;
            setLoading(false);
            setData(data);
            return data;
        }, (error) => {
            setLoading(false);
            setError(error);
        });
    }

    return {
        loading,
        data,
        error,
        handleApiCall
    }
}
