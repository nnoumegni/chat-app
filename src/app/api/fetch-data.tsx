import {useState} from "react";
import axios from "axios";
import {HmacSHA256, enc} from "crypto-js";
import {ApiRequest, ApiResponse, Message, Room, User} from "../models/chat-models";
import {IndexedDB} from "./indexedbd";
import {
    BACKEND_URL,
    DB_NAME,
    FULL_NAME_INDEX_FIELDS,
    NAME_INDEX_FIELDS,
    ROOM_MESSAGES_DB_NAME,
    ROOM_USERS_DB_NAME, ROOMS_TABLE_NAME,
    TEXT_INDEX_FIELDS, USERS_TABLE_NAME
} from "../constants/api-configs";

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
                addRoomUser,
                getRoomUsers,
                addMessage,
                getMessages,
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

    const getRooms = async (filters) => {
        // Set the table name and the search index field
        await indexedDB.setup(ROOMS_TABLE_NAME, [NAME_INDEX_FIELDS]);
        return await indexedDB.findItems({filters});
    }

    const addRoom = async ({name, user}: {room: Room; user: User}) => {
        const {id: addedBy} = user;
        const uri = `${crypto.randomUUID()}-${addedBy}`;
        const newRoomData = {name, addedBy, uri};
        // Set the table name and the search index field
        await indexedDB.setup(ROOMS_TABLE_NAME, [NAME_INDEX_FIELDS]);
        const {success} = await indexedDB.setItems([newRoomData]);

        // If we successfully added the room, then let's add the owner as the first room user
        let newRoom;
        if(success) {
            newRoom = await indexedDB.getItem({uri});
            const {id: roomId} = newRoom;
            await addRoomUser({roomId, user});
        }

        return {success, room: newRoom};
    }

    const getRoomUsers = async ({roomId, userIds}: {roomId: number; userIds: number[]}) => {
        await indexedDB.setup(USERS_TABLE_NAME, [FULL_NAME_INDEX_FIELDS]);
        const filters = {id: {operator: 'in', value: userIds}};
        return await indexedDB.findItems({filters});
    }

    // Important: we should ideally save the userId only and use it later to retrieve
    // the latest user info from the users table to be up to date as it will constantly change
    const addRoomUser = async ({roomId, user}: {roomId: number; user: User}) => {
        const idb = new IndexedDB(ROOM_USERS_DB_NAME);
        const tableName = `${roomId}`;

        // Set the table name and the search index field
        await idb.setup(tableName, [FULL_NAME_INDEX_FIELDS]);

        // Let's add the user to the room
        // Note: if the user is already part of the room, his data will be updated to match the latest
        const {id: userId, fullName} = user;
        return await idb.addOrUpdate({userId}, {userId, fullName});
    }

    const getMessages = async ({roomId}: {roomId: number}) => {
        const idb = new IndexedDB(ROOM_MESSAGES_DB_NAME);
        const tableName = `${roomId}`;

        // Set the table name and the search index field
        await idb.setup(tableName, [TEXT_INDEX_FIELDS]);
        const m = await idb.findItems({sortOrder: 'asc'});
        console.log(m);
        return m;
    }

    const addMessage = async ({message}: {message: Message;}) => {
        const {roomId} = message;
        const idb = new IndexedDB(ROOM_MESSAGES_DB_NAME);
        const tableName = `${roomId}`;

        // Set the table name and the search index field
        await idb.setup(tableName, [TEXT_INDEX_FIELDS]);
        return idb.setItems([message]);
    }

    const generateToken = ({username, password}) => {
        const data = `${username}:${password}`;
        return HmacSHA256(data, `${password}`).toString(enc.Hex);
    };

    const doRegister = async (user: {username: string; password: string; fullName: string}) => {
        await indexedDB.setup(USERS_TABLE_NAME, [FULL_NAME_INDEX_FIELDS]);
        const {username, password, fullName} = user;
        const token = generateToken({username, password});

        // Important: never save user plain password. Instead using as part of the encryption salt
        const {success} = await indexedDB.addItem({username, token, fullName});
        if(success) {
            return doLogin(user);
        }

        return {success};
    }

    const doLogin = async ({username, password, token}: {username: string; password: string}) => {
        await indexedDB.setup(USERS_TABLE_NAME, [FULL_NAME_INDEX_FIELDS]);

        if(!token) {
            token = generateToken({username, password});
        }

        const user = await indexedDB.getItem({username, token});

        if(user) {
            const authData = JSON.stringify({username, token});
            localStorage.setItem("authData", authData);
        }

        return {success: !!user, user};
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
