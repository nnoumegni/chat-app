import {useCallback, useEffect, useRef, useState} from "react";
import {useFetchData} from "../api/fetch-data";
import {JoinRoomPayload, Message, User} from "../models/chat-models";
import {useAppStore} from "../store/use-app.store";
import {UseSocketIo} from "../hooks/use-socket-io";
import {CHAT_EVENT_NAME, CHAT_ROOM_JOIN_EVENT_NAME} from "../constants/api-configs";
import {IconUsers} from "./Icons";

export const ChatMessages = () => {
    const [isRoomUser, setIsRoomUser] = useState(false);
    const {handleApiCall} = useFetchData();
    const {user, selectedRoom, messages, addMessage, setMessages} = useAppStore();
    const {emit, subscribe, unsubscribe} = UseSocketIo();
    const messageInputRef = useRef();
    const messageContainerRef = useRef();
    const filterInputRef = useRef();

    const roomId = selectedRoom?.id;

    const handleSendMessage = useCallback((evt) => {
        evt.preventDefault();

        const {id} = user;
        const date = new Date().toISOString();
        const {value: text} = messageInputRef.current;

        if(text && text.trim()) {
            const message: Message = {text, userId: id, roomId, date};

            const newMessage = {...message, ...{sender: user}};

            // Immediately broadcast the message
            // Persist the message to the DB
            Promise.all([
                handleApiCall({path: 'chat', action: 'addMessage', data: {message: newMessage}}),
                emit({eventName: CHAT_EVENT_NAME, data: newMessage})
            ]).then(() => {
                evt.target.reset();
            });
        }
    }, [selectedRoom]);

    const handleFilterMessage = useCallback(() => {
        const {value} = filterInputRef.current;
        console.log(value);
    }, [])

    const handleJoinRoomCTA = useCallback((evt) => {
        evt.preventDefault();

        const {id: roomId} = selectedRoom;
        return Promise.all([
            handleApiCall({path: 'chat', action: 'addRoomUser', data: {roomId, user}}),
            emit({eventName: CHAT_ROOM_JOIN_EVENT_NAME, data: {user, roomId}}),
        ]).then(([{success}]) => {
            setIsRoomUser(success);
        });
    }, [selectedRoom]);

    useEffect(() => {
        if(roomId && user) {
            getRoomMessages().then(async (messages) => {
                // For performance, let's only get the the users which messages are in the viewport
                const userIdMap = {};
                messages.forEach((message) => {
                    userIdMap[message.userId] = message.userId
                });

                const userIds = Object.keys(userIdMap).map(uid => parseInt(uid, 10));
                const userMap = await getRoomUsers(userIds);

                // Then let's set the sender data for each message
                const roomMessages: Message[] = messages.map(message => {
                    const {userId} = message;
                    return {
                        ...message,
                        sender: userMap[userId] // saving the room users is important because lookup is O(1)
                    };
                });

                setMessages({messages: roomMessages});
                scrollToBottom();
            });

            subscribe({eventName: CHAT_EVENT_NAME, roomIds: [roomId], callback: newMessageCallback});
            subscribe({eventName: CHAT_ROOM_JOIN_EVENT_NAME, roomIds: [roomId], callback: newUserJoinCallback});
        }

        // Clean up event listeners
        return () => {
            unsubscribe({eventName: CHAT_EVENT_NAME, roomIds: [roomId], callback: newMessageCallback});
            unsubscribe({eventName: CHAT_ROOM_JOIN_EVENT_NAME, roomIds: [roomId], callback: newUserJoinCallback});
        }
    }, [selectedRoom, user]);

    useEffect(() => {
        if(user) {
            const {id: currentUser} = user;
            getRoomUsers([12]).then(userData => {
                const isChatRoomUser = Object.keys(userData).map(key => parseInt(key, 10)).includes(currentUser);
                setIsRoomUser(isChatRoomUser);
            });
        }
    }, [user])

    const newMessageCallback = (message: Message) => {
        // Append to the message store
        addMessage({message});

        scrollToBottom();
    };

    const newUserJoinCallback = (payload: JoinRoomPayload) => {
        console.log(user, roomId)
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            if(messageContainerRef.current) {
                messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
            }
        }, 30);
    };

    const getRoomMessages = (): Promise<Message[]> => {
        return handleApiCall({
            path: 'chat',
            action: 'getMessages',
            data: {roomId}
        });
    }

    const getRoomUsers = (userIds: number[]) => {
        return handleApiCall({
            path: 'chat',
            action: 'getRoomUsers',
            data: {roomId, userIds}
        }).then(async (users: User[]) => {
            const userMap = {};
            users.map(user => {
                const {id: userId} = user;
                userMap[userId] = user;
            });

            return userMap;
        });
    }

    return (
        <div className="w-full h-full min-h-screen flex flex-col items-start justify-start">
            {selectedRoom && isRoomUser && (
                <header className='flex items-center justify-between w-full px-6 z-50 bg-[#fff] sticky top-0 pb-1 border-b border-grey-500'>
                    <div className="relative flex items-center justify-startcapitalize font-bold cursor-pointer">
                        <div className="relative">
                            <IconUsers/>
                            <span className="flex items-center justify-center w-[16px] h-[16px] bg-green-500 px-1 py-0.5 text-[10px] text-white rounded-full absolute top-[-5px] right-[0px]">2</span>
                        </div>
                        <span className="ml-1 capitalize">{selectedRoom?.name}</span>
                        <ul id="dropdownMenu"
                            className="absolute top-[100%] block shadow-lg shadow-blue-100 bg-white py-4 z-[1000] min-w-full w-max rounded max-h-96 overflow-auto">
                            <li className="py-3 px-4 flex items-center hover:bg-blue-50 text-black text-sm cursor-pointer">
                                <img src="https://readymadeui.com/profile_2.webp"
                                     className="w-8 h-8 rounded-full shrink-0 mr-3"/>
                                    John Doe
                            </li>
                            <li className="py-3 px-4 flex items-center hover:bg-blue-50 text-black text-sm cursor-pointer">
                                <img src="https://readymadeui.com/team-3.webp"
                                     className="w-8 h-8 rounded-full shrink-0 mr-3"/>
                                    Alena
                            </li>
                            <li className="py-3 px-4 flex items-center hover:bg-blue-50 text-black text-sm cursor-pointer">
                                <img src="https://readymadeui.com/team-2.webp"
                                     className="w-8 h-8 rounded-full shrink-0 mr-3"/>
                                    Justin Kelwin
                            </li>
                            <li className="py-3 px-4 flex items-center hover:bg-blue-50 text-black text-sm cursor-pointer">
                                <img src="https://readymadeui.com/team-5.webp" className="w-8 h-8 rounded-full shrink-0 mr-3"/>
                                    Mark Justin
                            </li>
                        </ul>

                    </div>

                    <div className='px-6 py-1 my-2 bg-white shadow-md rounded-md relative tracking-wide'>
                        <div className='flex items-center flex-wrap gap-x-8 gap-y-4 z-50 w-full'>
                            <div className='flex items-center gap-4 py-1 outline-none border-none'>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192.904 192.904"
                                     className="w-5 cursor-pointer fill-current">
                                    <path
                                        d="m190.707 180.101-47.078-47.077c11.702-14.072 18.752-32.142 18.752-51.831C162.381 36.423 125.959 0 81.191 0 36.422 0 0 36.423 0 81.193c0 44.767 36.422 81.187 81.191 81.187 19.688 0 37.759-7.049 51.831-18.751l47.079 47.078a7.474 7.474 0 0 0 5.303 2.197 7.498 7.498 0 0 0 5.303-12.803zM15 81.193C15 44.694 44.693 15 81.191 15c36.497 0 66.189 29.694 66.189 66.193 0 36.496-29.692 66.187-66.189 66.187C44.693 147.38 15 117.689 15 81.193z">
                                    </path>
                                </svg>
                                <form>
                                    <input
                                        type='text'
                                        placeholder='Search messages...'
                                        className='w-full text-sm bg-transparent rounded outline-none'
                                        ref={filterInputRef}
                                        onKeyUp={handleFilterMessage}
                                    />
                                </form>
                            </div>
                        </div>
                    </div>
                </header>
            )}

            <div className="flex flex-1 w-full bg-[#dbeafe] px-6">
                <div className="flex-1 relative">
                    {selectedRoom && isRoomUser && (
                        <ul ref={messageContainerRef} className="h-full w-full overflow-auto absolute left-0 top-0 overflow-auto">
                            {messages.map((message: Message, idx) => {
                                const {sender, text, date} = message;
                                return (
                                    <li key={idx} className="bg-white my-6 w-full rounded-lg font-[sans-serif] overflow-hidden rounded">
                                        <div>
                                            <div className="flex flex-wrap items-center cursor-pointer shadow-[0_2px_6px_-1px_rgba(0,0,0,0.3)]  w-full p-4">
                                                <img src="assets/profile.jpg" className="w-10 h-10 rounded-full" alt={text}/>
                                                <div className="ml-4 flex-1">
                                                    <p className="text-sm text-gray-800 font-semibold capitalize">{sender?.fullName}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{text}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                    {selectedRoom && !isRoomUser && (
                        <div className="flex items-center justify-center flex-1 w-full h-full bg-[#dbeafe] px-6">
                            <div className="flex flex-1 items-center justify-center relative">
                                <div className="px-8 py-16 font-sans rounded-md relative">
                                    <div className="bg-[#182b50] absolute left-0 top-0 w-full h-full rounded-md opacity-[0.8]"/>
                                    <div
                                        className="relative z-[99] max-w-6xl mx-auto grid md:grid-cols-2 justify-center items-center gap-12">
                                        <div className="text-center md:text-left">
                                            <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-6 md:!leading-[55px]">
                                                <span className="capitalize">{selectedRoom?.name}</span>
                                            </h2>
                                            <p className="text-lg lg:text-xl text-white">
                                                In this room we discuss finance-related matters. Join us now if that topic rings a bell to you!
                                            </p>
                                            <a href="javascript:void(0);" onClick={handleJoinRoomCTA}
                                               className="mt-12 bg-[#a91079] hover:bg-opacity-80 text-white py-3 px-6 rounded-full text-lg lg:text-xl transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl inline-block">
                                                Join Now
                                            </a>
                                        </div>
                                        <div className="text-center">
                                            <img src="assets/cta-bg.webp"
                                                 alt="Premium Benefits" className="w-full mx-auto"/>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}
                </div>
            </div>
            {selectedRoom && isRoomUser && (
                <form onSubmit={handleSendMessage} className="flex w-full p-3">
                    <div className="flex-1 mr-3">
                        <input
                            ref={messageInputRef}
                            type="text"
                            placeholder="type here..."
                            className="w-full border border-gray-300 rounded p-2"
                        />
                    </div>
                    <div className="flex items-center justify-center">
                        <button type="submit" className="h-full px-2 py-1 flex items-center text-sm tracking-wider font-semibold outline-none text-white bg-blue-500 hover:bg-blue-600 rounded">
                            Send
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}
