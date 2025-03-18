import {useEffect} from "react";
import {useAppStore} from "../store/use-app.store";
import {io} from "socket.io-client";
import {BACKEND_URL, CHAT_EVENT_NAME, CHAT_ROOM_JOIN_EVENT_NAME} from "../constants/api-configs";
import {UseSocketIo} from "../hooks/use-socket-io";
import {MainChatBox} from "../components/MainChatBox";

export const AuthLayout = () => {
    const {user, setSocket, isConnected, deviceId, setThemeMode} = useAppStore();
    const {onConnect, onDisconnect, onChat, onRoomJoin, newMessageCallback, subscribe, unsubscribe} = UseSocketIo();
    const userId = user?.id;

    // Very important: web socket initialisation should always happen ones at bootstrap
    // To prevent unexpected server overload
    useEffect(() => {
        if(deviceId) {
            const socket: any = io(BACKEND_URL, {query: {userId, deviceId}});

            // Set socket event callbacks
            socket.on('connect', onConnect);
            socket.on('disconnect', onDisconnect);
            socket.on(CHAT_EVENT_NAME, onChat);
            socket.on(CHAT_ROOM_JOIN_EVENT_NAME, onRoomJoin);

            if (isConnected) {
                setSocket({socket});
                subscribe({eventName: CHAT_EVENT_NAME, callback: newMessageCallback}).then();
            }

            // Clean up when unmounted
            return () => {
                socket.off('connect', onConnect);
                socket.off('disconnect', onDisconnect);
                socket.off(CHAT_EVENT_NAME, onChat);
                socket.off(CHAT_ROOM_JOIN_EVENT_NAME, onRoomJoin);
                unsubscribe({eventName: CHAT_EVENT_NAME, callback: newMessageCallback}).then();
            };
        }

        const themeMode = localStorage.getItem('connectme-html');
        if(themeMode) {
            document.documentElement.setAttribute("data-bs-theme", themeMode);
            setThemeMode({themeMode});
        }
    }, [isConnected, deviceId]);

    return <MainChatBox/>
}
