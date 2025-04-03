import React, {useCallback, useEffect} from "react";
import {useFetchData} from "../api/fetch-data";
import {useAppStore} from "../store/use-app.store";
import {Message, Room} from "../models/chat-models";
import {Loader} from "./Loader";
import {UseSocketIo} from "../hooks/use-socket-io";
import {CHAT_EVENT_NAME} from "../constants/api-configs";
import {Utils} from "../helpers/utils";
import {IconUsers} from "./Icons";
import {ProfileAvatar} from "./MainChatBox/ProfileAvatar";

export const RoomList = () => {
    const {loading,  handleApiCall} = useFetchData();
    const {subscribe, unsubscribe} = UseSocketIo();
    const {user, isConnected, rooms, selectedRoom, setRooms, setSelectedRoom} = useAppStore();

    const newMessageCallback = useCallback((message: Message) => {
        const {roomUri} = message;
        const room = rooms.find(room => room.uri === roomUri);

        if(room) {
            const count = (room.unreadMessageCount || 0) + 1;
            setUnreadMessageCount({roomUri, count});
        }
    }, [rooms]);

    useEffect(() => {
        const {id: userId, token} = user;
        handleApiCall({
            path: 'chat',
            action: 'getUserRooms',
            token,
            data: {userId}
        }).then((rooms: Room[]) => {
            if(rooms && rooms[0]) {
                rooms = rooms.map(room => Utils.formattedRoom({room, currentUser: user}));
                console.log(rooms)
                setRooms({rooms});
            }
        });
    }, [isConnected, user]);

    useEffect(() => {
        const roomUris = rooms.map(room => room.uri);
        if(isConnected) {
            // Subscribe to user rooms
            subscribe({eventName: CHAT_EVENT_NAME, roomUris, callback: newMessageCallback});
        }

        return () => {
            unsubscribe({eventName: CHAT_EVENT_NAME, roomUris, callback: newMessageCallback});
        }
    }, [rooms]);

    const setUnreadMessageCount = ({roomUri, count}) => {
        const room = rooms.find(room => room.uri === roomUri);
        if(room) {
            room.unreadMessageCount  = count;
            setRooms({rooms});
        }
    }

    const handleClick = ({room}) => {
        const {uri: roomUri} = room;

        setUnreadMessageCount({roomUri, count: 0});
        setSelectedRoom({room});
    };

    if(loading) {
        return <Loader/>
    }

    return (
        <ul>
            {rooms.map((room, idx) => {
                const {name, uri, unreadMessageCount, type, thumb} = room;
                const selected = selectedRoom?.uri && selectedRoom?.uri === uri;
                const style = selected ? {
                    background: 'aliceblue',
                    border: 'solid thin',
                    borderColor: 'lightsteelblue'
                } : undefined;

                return (
                    <li key={idx} onClick={() => handleClick({room})}>
                        <div
                            className="text-gray-800 text-sm flex items-center cursor-pointer hover:underline rounded-md px-0 py-2.5 transition-all duration-300" style={style}>
                            <div className="inline-flex items-center justify-start mr-1">
                                <div className="w-[30px] h-[30px] rounded-full border border-gray-200 p-1 flex items-center justify-center">
                                    {type === 'dm' && (
                                        <ProfileAvatar thumb={thumb} fullname={name} width={'w-14'} height={'h-14'} className={'rounded-full'}/>
                                    )}
                                    {type !== 'dm' && (
                                        <IconUsers/>
                                    )}
                                </div>
                            </div>
                            <span className="overflow-hidden text-ellipsis whitespace-nowrap inline-block max-w-[200px]">
                                {name}
                            </span>
                            <div className="flex flex-1 items-center justify-end">
                                <div className="flex">
                                    {unreadMessageCount > 0 && <span className="mr-2 font-bold">({unreadMessageCount})</span>}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="arrowIcon w-3 fill-current -rotate-90 ml-auto transition-all duration-500" viewBox="0 0 451.847 451.847">
                                        <path d="M225.923 354.706c-8.098 0-16.195-3.092-22.369-9.263L9.27 151.157c-12.359-12.359-12.359-32.397 0-44.751 12.354-12.354 32.388-12.354 44.748 0l171.905 171.915 171.906-171.909c12.359-12.354 32.391-12.354 44.744 0 12.365 12.354 12.365 32.392 0 44.751L248.292 345.449c-6.177 6.172-14.274 9.257-22.369 9.257z" data-original="#000000"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </li>
                )
            })}
            {rooms.length === 0 && (
                <>
                    <div className="flex items-start justify-center mt-6 text-gray-500">
                        Create or join a room to start
                    </div>
                </>
            )}
        </ul>
    )
}
