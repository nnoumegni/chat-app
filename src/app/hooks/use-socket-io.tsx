import {useCallback, useEffect} from "react";
import {useAppStore} from "../store/use-app.store";
import {JoinRoomPayload, Message, RoomUser, User} from "../models/chat-models";
import {CHAT_EVENT_NAME} from "../constants/api-configs";
import {useFetchData} from "../api/fetch-data";
import {Utils} from "../helpers/utils";

export const UseSocketIo = () => {
    const {user, socket, selectedRoom, addRoom, setSocket, subscriptions, addMessage, setIsConnected, setIsConnecting, setSubscriptions} = useAppStore();
    const {handleApiCall} = useFetchData();
    const userId = user?.id;

    const emit = useCallback(({eventName, data}: {eventName: string; data: Message | JoinRoomPayload}) => {
        if(socket) {
            socket.emit('broadcast', {
                eventName,
                payload: data
            });
        }

        return Promise.resolve({success: true});
    }, [socket]);

    const onConnect = (socket) => {
        setIsConnected({isConnected: true});
        setIsConnecting({isConnecting: false});
        setSocket({socket});
        subscribe({eventName: CHAT_EVENT_NAME, callback: newMessageCallback}).then();
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
        const {roomUri, sender, receiver, type} = message;
        let room; // = rooms.find(room => room.uri === roomUri);
        // Append the message to the message list
        // Make sure to handle duplicate from the chat event handler
        if(sender && sender.userId !== user.id) {
            addMessage({message});

            if(type === 'dm') {
                const {userId: senderId, fullname: senderFullName, thumb: senderThumb} = sender;
                const {userId: receiverId, fullname: receiverFullName, thumb: receiverThumb} = receiver;
                const room = Utils.roomUserMapper({
                    currentUser: {
                        id: receiverId,
                        fullname: receiverFullName,
                        thumb: receiverThumb
                    },
                    user: {
                        id: senderId,
                        fullname: senderFullName,
                        thumb: senderThumb
                    }
                });

                addRoom({room});

                Promise.all([
                    handleApiCall({path: 'chat', action: 'addMessage', data: {message}}),
                    handleApiCall({path: 'chat', action: 'addRoom', data: room}),
                ]).then(() => {
                    // move the new room to the top
                    if(room.roomUri !== (selectedRoom || {}).roomUri) {
                        // const count = (room.unreadMessageCount || 0) + 1;
                        // setUnreadMessageCount({roomUri, count});
                    }
                });
            }
        }

        /*


        // Immediately broadcast the message
        // Persist the message to the DB
        Promise.all([
            handleApiCall({path: 'chat', action: 'addMessage', data: {message: newMessage}}),
            handleApiCall({path: 'chat', action: 'addRoom', data: selectedRoom}),
            emit({eventName: CHAT_EVENT_NAME, data: newMessage}),
        ]).then(() => {
            // move the new room to the top
        });

        if(room) {
            const count = (room.unreadMessageCount || 0) + 1;
            // setUnreadMessageCount({roomUri, count});
        }
         */
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
