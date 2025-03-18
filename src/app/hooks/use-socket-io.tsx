import {useCallback} from "react";
import {useAppStore} from "../store/use-app.store";
import {JoinRoomPayload, Message, RoomUser, User} from "../models/chat-models";
import {CHAT_EVENT_NAME} from "../constants/api-configs";
import {useFetchData} from "../api/fetch-data";

export const UseSocketIo = () => {
    const {user, socket, subscriptions, addMessage, setIsConnected, setIsConnecting, setSubscriptions} = useAppStore();
    const {handleApiCall} = useFetchData();
    const userId = user?.id;

    const emit = useCallback(({eventName, data}: {eventName: string; data: Message | JoinRoomPayload}) => {
        if(socket) {
            socket.emit(eventName, data);
        }
        return Promise.resolve({success: true});
    }, [socket]);

    const onConnect = () => {
        setIsConnected({isConnected: true});
        setIsConnecting({isConnecting: false});
    }

    const onDisconnect = () => {
        setIsConnected({isConnected: false});
    }

    const onChat = (message: Message) => {
        const {roomId} = message;
        (subscriptions[CHAT_EVENT_NAME] || []).forEach((sub) => {
            const {callback, roomId: rid} = sub;
            if(roomId === rid && typeof callback === 'function') {
                callback(message);
            }
        });
    }

    const onRoomJoin = ({user, roomUri}: {user: RoomUser; roomUri: string;}) => {
        return handleApiCall({
            path: 'chat',
            action: 'addRoomUser',
            data: {roomUri, user}
        });
    }

    const newMessageCallback = (message: Message) => {
        console.log(message)
        const {roomUri} = message;
        let room; // = rooms.find(room => room.uri === roomUri);

        addMessage({message});

        if(room) {
            const count = (room.unreadMessageCount || 0) + 1;
            // setUnreadMessageCount({roomUri, count});
        }
    };

    const subscribe = useCallback(({eventName, callback}: {eventName: string; callback: (payload: Message | User | JoinRoomPayload) => void}) => {
        subscriptions[eventName] = subscriptions[eventName] || [];
        subscriptions[eventName].push({callback})

        // Update the app subscriptions store
        setSubscriptions({subscriptions})

        // Join the chat room
        return handleApiCall({
            path: 'chat',
            action: 'subscribe',
            data: {eventName, userId}
        });
    }, [subscriptions]);

    // A user can have multiple subscriptions to the same event but with different callbacks
    // Make sure to unsubscribe only to the specified room with the same callback
    const unsubscribe = useCallback(({eventName, callback}: {eventName: string; callback: (payload: Message | User | JoinRoomPayload) => void}) => {
        subscriptions[eventName] = (subscriptions[eventName] || []).filter(sub => {
            const {callback: cb} = sub;
            return cb !== callback;
        });

        return Promise.resolve({success: true});
    }, [subscriptions]);

    return {
        emit,
        onConnect,
        onDisconnect,
        onChat,
        onRoomJoin,
        newMessageCallback,
        subscribe,
        unsubscribe
    }
}
