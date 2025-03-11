import {useCallback} from "react";
import {useAppStore} from "../store/use-app.store";
import {Message} from "../models/chat-models";
import {CHAT_EVENT_NAME} from "../constants/api-configs";
import {useFetchData} from "../api/fetch-data";

export const UseSocketIo = () => {
    const {user, socket, subscriptions, setIsConnected, setIsConnecting, setSubscriptions} = useAppStore();
    const {handleApiCall} = useFetchData();
    const userId = user?.id;

    const emit = useCallback(({eventName, data}: {eventName: string; data: Message}) => {
        socket.emit(eventName, data);
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

    const subscribe = useCallback(({eventName, roomIds, callback}: {eventName: string; roomIds: number[], callback: (message: Message) => void}) => {
        subscriptions[eventName] = subscriptions[eventName] || [];
        roomIds.forEach(roomId => {
            subscriptions[eventName].push({roomId, callback})
        });

        // Update the app subscriptions store
        setSubscriptions({subscriptions})

        // Join the chat room
        return handleApiCall({
            path: 'chat',
            action: 'subscribe',
            data: {eventName, roomIds, userId}
        });
    }, [subscriptions]);

    // A user can have multiple subscriptions to the same event but with different callbacks
    // Make sure to unsubscribe only to the specified room with the same callback
    const unsubscribe = useCallback(({eventName, roomIds, callback}: {eventName: string; roomIds: number[], callback: (message: Message) => void}) => {
        roomIds.forEach(roomId => {
            subscriptions[eventName] = (subscriptions[eventName] || []).filter(sub => {
                const {callback: cb, roomId: rid} = sub;
                return !(cb === callback && rid === roomId)
            });
        });

        return Promise.resolve({success: true});
    }, [subscriptions]);

    return {
        emit,
        onConnect,
        onDisconnect,
        onChat,
        subscribe,
        unsubscribe
    }
}
