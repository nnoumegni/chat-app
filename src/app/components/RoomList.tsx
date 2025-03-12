import {useCallback, useEffect} from "react";
import {useFetchData} from "../api/fetch-data";
import {useAppStore} from "../store/use-app.store";
import {Message, Room} from "../models/chat-models";
import {Loader} from "./Loader";
import {UseSocketIo} from "../hooks/use-socket-io";
import {CHAT_EVENT_NAME} from "../constants/api-configs";

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
            action: 'getRooms',
            token,
            data: {userId}
        }).then((rooms: Room[]) => {
            if(rooms && rooms[0]) {
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
                const {name, id, unreadMessageCount} = room;
                return (
                    <li key={idx} onClick={() => handleClick({room})}>
                        <div
                            className="text-gray-800 text-sm flex items-center cursor-pointer hover:underline rounded-md px-0 py-2.5 transition-all duration-300">
                            <div className="inline-flex items-center mr-1">
                                <input id="checkbox3" type="checkbox" className="hidden peer" checked={selectedRoom?.id === id} readOnly={true}/>
                                <label className="relative flex items-center justify-center p-1 peer-checked:before:hidden before:block before:absolute before:w-full before:h-full before:bg-white w-6 h-6 cursor-pointer bg-blue-500 border rounded-full overflow-hidden">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-full fill-white" viewBox="0 0 520 520">
                                        <path d="M79.423 240.755a47.529 47.529 0 0 0-36.737 77.522l120.73 147.894a43.136 43.136 0 0 0 36.066 16.009c14.654-.787 27.884-8.626 36.319-21.515L486.588 56.773a6.13 6.13 0 0 1 .128-.2c2.353-3.613 1.59-10.773-3.267-15.271a13.321 13.321 0 0 0-19.362 1.343q-.135.166-.278.327L210.887 328.736a10.961 10.961 0 0 1-15.585.843l-83.94-76.386a47.319 47.319 0 0 0-31.939-12.438z" data-name="7-Check" data-original="#000000"/>
                                    </svg>
                                </label>
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
