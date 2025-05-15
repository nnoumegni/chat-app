"use client"

import React, {useCallback, useEffect, useRef, useState, KeyboardEvent as ReactKeyboardEvent} from "react";
import {useAppStore} from "../../store/use-app.store";
import {AddRoom, Message, RoomUser, User, JoinRoomPayload, Room} from "../../models/chat-models";
import {CHAT_EVENT_NAME} from "../../constants/api-configs";
import {useFetchData} from "../../api/fetch-data";
import {UseSocketIo} from "../../hooks/use-socket-io";
import {Utils} from "../../helpers/utils";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface AppStore {
    user: User;
    selectedRoom: Room | AddRoom;
    addMessage: ({message}: {message: Message}) => void;
    rooms: (Room | AddRoom)[];
    addRoom: ({room}: {room: Room | AddRoom}) => void;
    setRooms: ({rooms}: {rooms: (Room | AddRoom)[]}) => void;
}

interface EmojiData {
    native: string;
    [key: string]: any;
}

export const ChatBoxFooter = () => {
    const store = useAppStore();
    const {user, selectedRoom, addMessage, rooms, addRoom, setRooms} = store as unknown as AppStore;
    const {emit, subscribe, unsubscribe} = UseSocketIo();
    const {handleApiCall} = useFetchData();
    const roomUri = selectedRoom?.roomUri;
    const inputEltRef = useRef<HTMLDivElement>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const handleInputKeyUp = (event: ReactKeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            const elt = inputEltRef.current;
            if (elt) {
                saveMessage(elt.innerHTML);
                elt.innerHTML = '';
            }
        }
    }

    const handleEmojiSelect = (emoji: EmojiData) => {
        const elt = inputEltRef.current;
        if (elt) {
            elt.innerHTML = elt.innerHTML + emoji.native;
            setShowEmojiPicker(false);
        }
    };

    const handleEmojiButtonClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowEmojiPicker(!showEmojiPicker);
    };

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.emoji-picker-container') && !target.closest('.emoji-button')) {
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const saveMessage = useCallback((inputText: string) => {
        const text = inputText && inputText.trim() ? inputText.trim() : '';
        if(text && user.id && selectedRoom) {
            const {id: userId, fullname, thumb} = user;
            const sender = {userId, fullname, thumb};
            const date = new Date().toISOString();
            const currentRoomUri = roomUri;
            const msgUri = `${userId}${currentRoomUri}${new Date().getTime()}`;
            const {type, users} = selectedRoom;

            let receiver;
            if(type === 'dm' && users) {
                const usersRecord = users as unknown as Record<string, RoomUser>;
                const userKeys = Object.keys(usersRecord);
                const receiverKey = userKeys.find(key => parseInt(key, 10) !== userId);
                if (receiverKey) {
                    receiver = usersRecord[receiverKey];
                }
            }

            const message: Message = {
                text,
                userId,
                roomUri: currentRoomUri || '',
                date,
                msgUri,
                type: type || 'chat'
            };

            const newMessage = {...message, ...{sender, receiver}};

            // Append the message to the message list
            addMessage({message: newMessage});
            if (selectedRoom) {
                addRoom({room: selectedRoom});
            }

            // Immediately broadcast the message and persist to DB
            Promise.all([
                handleApiCall({path: 'chat', action: 'addMessage', data: {message: newMessage}}),
                handleApiCall({path: 'chat', action: 'addRoom', data: selectedRoom}),
                emit({eventName: CHAT_EVENT_NAME, data: newMessage}),
            ]).then(() => {
                // move the new room to the top
            });
        }
    }, [selectedRoom, user, roomUri]);

    useEffect(() => {
        if(roomUri) {
            subscribe({eventName: CHAT_EVENT_NAME, callback: (payload: Message | User | JoinRoomPayload) => {
                if ('text' in payload) {
                    newMessageCallback(payload as Message);
                }
            }}).then();
        }

        return () => {
            unsubscribe({eventName: CHAT_EVENT_NAME, callback: (payload: Message | User | JoinRoomPayload) => {
                if ('text' in payload) {
                    newMessageCallback(payload as Message);
                }
            }}).then();
        }
    }, [selectedRoom]);

    const newMessageCallback = async (message: Message) => {
        const {userId, type, sender, receiver, roomUri: messageRoomUri} = message;
        const moveToTheTop = (room: Room | AddRoom) => {
            if (room.roomUri) {
                const newRooms = Utils.addOrMoveArrayItem({
                    arr: rooms,
                    matchData: {roomUri: room.roomUri},
                    new_index: 0,
                    item: room
                });
            }
        }

        // Persist the message to my local chat history DB
        await handleApiCall({path: 'chat', action: 'addMessage', data: message});

        // Handle DM room creation and message handling
        if(type === 'dm' && sender && receiver) {
            const {userId: senderId, fullname: senderFullName} = sender;
            const {userId: receiverId, fullname: receiverFullName} = receiver;
            const newRoom = Utils.roomUserMapper({
                user: {
                    id: receiverId,
                    fullname: receiverFullName
                },
                currentUser: {
                    id: senderId,
                    fullname: senderFullName
                }
            });

            await handleApiCall({path: 'chat', action: 'addRoom', data: newRoom});

            if(messageRoomUri !== selectedRoom?.roomUri && user.id !== userId) {
                addMessage({message});
            }
        } else if (selectedRoom) {
            moveToTheTop(selectedRoom);
        }
    };

    return (
        <>
            {selectedRoom && (
                <div className="tyn-chat-form">
                    <div className="tyn-chat-form-insert">
                        <ul className="tyn-list-inline gap gap-3">
                            <li className="dropup">
                                <button className="btn btn-icon btn-light btn-md btn-pill" data-bs-toggle="dropdown" data-bs-offset="0,10">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-plus-lg" viewBox="0 0 16 16">
                                        <path fillRule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z" />
                                    </svg>
                                </button>
                                <div className="dropdown-menu">
                                    <ul className="tyn-list-links">
                                        <li><a href="#">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-person-video2" viewBox="0 0 16 16">
                                                <path d="M10 9.05a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                                                <path d="M2 1a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H2ZM1 3a1 1 0 0 1 1-1h2v2H1V3Zm4 10V2h9a1 1 0 0 1 1 1v9c0 .285-.12.543-.31.725C14.15 11.494 12.822 10 10 10c-3.037 0-4.345 1.73-4.798 3H5Zm-4-2h3v2H2a1 1 0 0 1-1-1v-1Zm3-1H1V8h3v2Zm0-3H1V5h3v2Z" />
                                            </svg>
                                            <span>New Group</span>
                                        </a></li>
                                        <li><a href="#">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-mic" viewBox="0 0 16 16">
                                                <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z" />
                                                <path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0v5zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3z" />
                                            </svg>
                                            <span>Voice Clip</span>
                                        </a></li>
                                    </ul>
                                </div>
                            </li>
                            <li className="d-none d-sm-block"><button className="btn btn-icon btn-light btn-md btn-pill">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-card-image" viewBox="0 0 16 16">
                                    <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
                                    <path d="M1.5 2A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-13zm13 1a.5.5 0 0 1 .5.5v6l-3.775-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12v.54A.505.505 0 0 1 1 12.5v-9a.5.5 0 0 1 .5-.5h13z" />
                                </svg>
                            </button></li>
                            <li className="d-none d-sm-block position-relative">
                                <button 
                                    className="btn btn-icon btn-light btn-md btn-pill emoji-button"
                                    onClick={handleEmojiButtonClick}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-emoji-smile-fill" viewBox="0 0 16 16">
                                        <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zM7 6.5C7 7.328 6.552 8 6 8s-1-.672-1-1.5S5.448 5 6 5s1 .672 1 1.5zM4.285 9.567a.5.5 0 0 1 .683.183A3.498 3.498 0 0 0 8 11.5a3.498 3.498 0 0 0 3.032-1.75.5.5 0 1 1 .866.5A4.498 4.498 0 0 1 8 12.5a4.498 4.498 0 0 1-3.898-2.25.5.5 0 0 1 .183-.683zM10 8c-.552 0-1-.672-1-1.5S9.448 5 10 5s1 .672 1 1.5S10.552 8 10 8z" />
                                    </svg>
                                </button>
                                {showEmojiPicker && (
                                    <div className="emoji-picker-container absolute bottom-full end-0 mb-2" style={{ zIndex: 9999 }}>
                                        <Picker 
                                            data={data} 
                                            onEmojiSelect={handleEmojiSelect}
                                            theme="light"
                                            onClickOutside={() => setShowEmojiPicker(false)}
                                        />
                                    </div>
                                )}
                            </li>
                        </ul>
                    </div>
                    <div className="tyn-chat-form-enter">
                        <div 
                            ref={inputEltRef} 
                            className="tyn-chat-form-input" 
                            id="tynChatInput" 
                            onKeyDown={handleInputKeyUp}
                            onInput={(e) => {
                                const target = e.target as HTMLDivElement;
                                if (target) {
                                    target.innerHTML = target.innerHTML;
                                }
                            }}
                            contentEditable
                        />
                        <ul className="tyn-list-inline me-n2 my-1">
                            <li><button className="btn btn-icon btn-white btn-md btn-pill">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-mic-fill" viewBox="0 0 16 16">
                                    <path d="M5 3a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0V3z" />
                                    <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z" />
                                </svg>
                            </button></li>
                            <li><button className="btn btn-icon btn-white btn-md btn-pill" id="tynChatSend">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-send-fill" viewBox="0 0 16 16">
                                    <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z" />
                                </svg>
                            </button></li>
                        </ul>
                    </div>
                </div>
            )}
        </>
    )
}
