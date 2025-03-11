import {useEffect, useRef, useState} from "react";
import {RoomList} from "../components/RoomList";
import {ChatMessages} from "../components/ChatMessages";
import {useAppStore} from "../store/use-app.store";
import {useFetchData} from "../api/fetch-data";
import {io} from "socket.io-client";
import {BACKEND_URL, CHAT_EVENT_NAME} from "../constants/api-configs";
import {UseSocketIo} from "../hooks/use-socket-io";

export const AuthLayout = () => {
    const [showAddNewRoomForm, setShowAddNewRoomForm] = useState(false);
    const {user, addRoom, setSocket, isConnected} = useAppStore();
    const {onConnect, onDisconnect, onChat} = UseSocketIo();
    const { handleApiCall } = useFetchData();
    const roomNameInputRef = useRef();
    const userId = user?.id;

    const handleAddRoom = (evt) => {
        evt.preventDefault();
        const {value: name} = roomNameInputRef.current;
        if(name && name.trim()) {
            handleApiCall({
                path: 'chat',
                action: 'addRoom',
                token: `${new Date().getTime()}`,
                data: {name, user}
            }).then((resp) => {
                const {room, success} = resp;
                if(success) {
                    // let's prepend the new room to the current list of rooms
                    addRoom({room});
                    evt.target.reset();
                }
            }, err => console.log(err));
        }
    };

    useEffect(() => {
        const socket: any = io(BACKEND_URL, {query: {userId}});

        // Set socket event callbacks
        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on(CHAT_EVENT_NAME, onChat);

        if(isConnected) {
            setSocket({socket});
        }

        // Clean up when unmounted
        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off(CHAT_EVENT_NAME, onChat);
        };
    }, [isConnected]);

    return <div className="relative bg-white h-full min-h-screen font-[sans-serif]">
            <div className="flex h-full items-start p-0 m-0">
                <nav id="sidebar" className="lg:min-w-[300px] w-max max-lg:min-w-8">
                    <div id="sidebar-collapse-menu" className="bg-white shadow-lg h-full absolute top-0 left-0 overflow-auto z-[99] lg:min-w-[300px] lg:w-max max-lg:w-0 max-lg:invisible transition-all duration-500">
                        <div className="flex items-center gap-2 pt-6 pb-2 px-4 sticky top-0 bg-white min-h-[64px] z-[100]">
                            {!showAddNewRoomForm && (
                                <div className="w-full flex items-center justify-between px-3">
                                    <div className="flex items-center justify-start font-bold capitalize">
                                        {isConnected && (
                                            <label htmlFor="radio2" className="relative flex items-center justify-center mr-1 w-3 h-3 cursor-pointer border-2 border-teal-500 rounded-full overflow-hidden peer-checked:before:hidden p-0.5">
                                                <span className="w-full h-full border-[6px] border-teal-500 rounded-full"/>
                                            </label>
                                        )}
                                        <span>{user.fullName}</span>
                                    </div>
                                    <button
                                        type="button"
                                        className="w-6 h-6 text-white inline-flex items-center justify-center rounded-full border-none outline-none bg-purple-600 hover:bg-purple-700 active:bg-purple-600"
                                        onClick={() => setShowAddNewRoomForm(true)}
                                    >
                                        +
                                    </button>
                                </div>
                            )}
                            {showAddNewRoomForm && (
                                <form className="w-full" onSubmit={handleAddRoom}>
                                    <label className="mb-2 text-sm block cursor-pointer" onClick={() => setShowAddNewRoomForm(false)}>
                                        &larr; Return
                                    </label>
                                    <div className="flex items-center justify-between">
                                        <input ref={roomNameInputRef} type="text" placeholder="Room name..." className="px-4 py-1.5 text-sm rounded-md bg-white border border-gray-400 w-full outline-blue-500"/>
                                        <button
                                            type="submit"
                                            className="px-2 ml-2 py-1.5 text-sm border-none outline-none text-green-600 bg-green-100 hover:bg-green-200 rounded"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                        <div className="py-4 px-4 pt-0">
                            <RoomList/>
                        </div>
                    </div>
                </nav>
                <section className="h-full w-full min-h-screen">
                    <ChatMessages/>
                </section>
            </div>
        </div>
}
