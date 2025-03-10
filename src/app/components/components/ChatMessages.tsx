import {useCallback, useEffect, useRef} from "react";
import {useFetchData} from "../api/fetch-data";
import {Message, User} from "../models/chat-models";
import {useAppStore} from "../store/use-app.store";
import {UseSocketIo} from "../hooks/use-socket-io";
import {CHAT_EVENT_NAME} from "../constants/api-configs";

export const ChatMessages = () => {
    const {handleApiCall} = useFetchData();
    const {user, selectedRoom, messages, addMessage, setMessages} = useAppStore();
    const {emit, subscribe, unsubscribe} = UseSocketIo();
    const messageInputRef = useRef();
    const messageContainerRef = useRef();

    const roomId = selectedRoom?.id;

    const handleSendMessage = useCallback((evt) => {
        evt.preventDefault();

        const {id} = user;
        const date = new Date().toISOString();
        const {value: text} = messageInputRef.current;

        if(text && text.trim()) {
            const message: Message = {text, userId: id, roomId, date};

            // Immediately broadcast the message
            const newMessage = {...message, ...{sender: user}};
            emit({eventName: CHAT_EVENT_NAME, data: newMessage}).then(() => {
                evt.target.reset();
            });
        }
    }, [selectedRoom]);

    useEffect(() => {
        if(roomId) {
            getRoomMessages().then(async (messages) => {
                // For performance, let's only get the the users which messages are in the viewport
                const userIds = messages.map((message) => message.userId);
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
        }

        // Clean up event listeners
        return () => {
            unsubscribe({eventName: CHAT_EVENT_NAME, roomIds: [roomId], callback: newMessageCallback});
        }
    }, [selectedRoom]);

    const newMessageCallback = (message: Message) => {
        // Append to the message store
        addMessage({message});

        scrollToBottom();

        // Persist the message to the DB
        return handleApiCall({
            path: 'chat',
            action: 'addMessage',
            data: {message}
        });
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
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
                const {userId} = user;
                userMap[userId] = user;
            });

            return userMap;
        });
    }

    return (
        <div className="w-full h-full min-h-screen flex flex-col items-start justify-start">
            <div className="flex flex-1 w-full bg-[#dbeafe] px-6">
                <div className="flex-1 relative">
                    <ul ref={messageContainerRef} className="h-full w-full overflow-auto absolute left-0 top-0 overflow-auto">
                    {roomId && messages.map((message: Message, idx) => {
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
                </div>
            </div>
            {roomId && (
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
