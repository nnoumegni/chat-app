"use client"

import GLightbox from 'glightbox';
import React, {useEffect, useState} from "react";
import {useAppStore} from "../../store/use-app.store";
import { HeaderProfile } from './ChatBoxHeader/HeaderProfile';
import {ChatBoxFooter} from "./ChatBoxFooter";
import {MessageList} from "./ChatBoxHeader/MessageList";
import {Message, RoomUser} from "../../models/chat-models";
import {useFetchData} from "../../api/fetch-data";
import {Utils} from "../../helpers/utils";

export const ChatBox = () => {
    const {selectedRoom, messages, setMessages, user} = useAppStore();
    const {handleApiCall} = useFetchData();
    const [userMap, setUserMap] = useState();
    const [isRoomUser, setIsRoomUser] = useState(false);
    const [dmUser, setDmUser] = useState(false);

    // Let's make sure we reset the lightbox and the scroll when:
    // - the chat room has changed
    // - a new message is added
    const dependencies = [selectedRoom, isRoomUser];

    // Set room messages
    useEffect(() => {
        // Init lightbox library
        let lightbox;
        import('glightbox').then(({ default: GLightbox }: any) => {
            lightbox = GLightbox({});
        });

        if(selectedRoom && isRoomUser) {
            const {roomUri, uri} = selectedRoom;
            handleApiCall({
                path: 'chat',
                action: 'getMessages',
                data: {roomUri: (roomUri || uri)}
            }).then((roomMessages: Message[]) => {
                /*
                // For performance, let's only get the the users which messages are in the viewport
                const userIdMap = {};
                messages.forEach((message) => {
                    userIdMap[message.userId] = message.userId
                });

                console.log(userIdMap);

                // Then let's set the sender data for each message
                const roomMessages: Message[] = messages.map(message => {
                    const {userId} = message;
                    return {
                        ...message,
                        sender: userMap[userId] // saving the room users is important because lookup is O(1)
                    };
                });
                 */

                setMessages({messages: roomMessages});
            });
        }

        return () => {
            if(lightbox) {
                lightbox.destroy();
            }
        };

    }, dependencies);

    // Set room access permission
    useEffect(() => {
        if(selectedRoom) {
            console.log({selectedRoom});
            const isDirectMessaging = selectedRoom.type === 'dm';
            const {id: currentUser} = user;
            const setChatUser = (userData) => {
                let dmUser;

                const keys = Object.keys(userData).map(key => parseInt(key, 10));

                // If I DM myself
                if (keys.length === 1) {
                    dmUser = userData[user.id];
                } else if (keys.length === 2) {
                    const index = keys.findIndex(key => key !== user.id);
                    if (index !== -1) {
                        const userKey = keys[index];
                        dmUser = userData[userKey];
                    }
                }

                setDmUser(dmUser);
            }

            if (isDirectMessaging) {
                const userData = selectedRoom.users[user.id];
                setChatUser(userData);
                setIsRoomUser(true);
            } else {
                // If it's not a DM, check if I'm part of that room first
                /*
                getRoomUsers([currentUser]).then(userData => {
                    const keys = Object.keys(userData).map(key => parseInt(key, 10));
                    const isChatRoomUser = keys.map(key => {
                        return key;
                    }).includes(currentUser);

                    if (isChatRoomUser) {
                        setChatUser(userData);
                    }

                    console.log({isChatRoomUser});

                    setIsRoomUser(isChatRoomUser);
                });
                */
                const keys = Object.keys(selectedRoom.users).map(key => parseInt(key, 10));
                const chatRoomUser = keys.map(key => {
                    return selectedRoom.users[key];
                });

                if (!!chatRoomUser) {
                    setChatUser(chatRoomUser);
                }

                setIsRoomUser(!!chatRoomUser);
            }
        }
    }, [selectedRoom]);

    // Use this to add name and avatar to senders
    const getRoomUsers = (userIds?: number[]) => {
        const {roomUri, uri} = selectedRoom;

        return handleApiCall({
            path: 'chat',
            action: 'getRoomUsers',
            data: {roomUri: (roomUri || uri), userIds}
        }).then((users: RoomUser[]) => {
            const userMap = {};
            users.map((user: RoomUser) => {
                const {userId} = user;
                userMap[userId] = user;
            });

            return userMap;
        });
    }

    return (
        <>
            {isRoomUser && (
                <>
                    <HeaderProfile isRoomUser={isRoomUser}/>
                    <div className="tyn-chat-body js-scroll-to-end" id="tynChatBody">
                        <div className="tyn-reply" id="tynReply">
                            <MessageList userMap={userMap}/>
                        </div>
                    </div>
                    <ChatBoxFooter/>
                </>
            )}
            {!isRoomUser && false && (
                <div className="py-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center">
                            <h2 className="text-slate-900 text-3xl font-bold">Meet our team</h2>
                        </div>

                        <div
                            className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 max-sm:justify-center mt-12 max-md:max-w-xl max-sm:max-w-xs mx-auto">
                            <div className="bg-gray-800 p-3 border rounded-lg">
                                <img src="https://readymadeui.com/team-1.webp"
                                     className="w-full object-contain aspect-square object-top rounded-lg"/>

                                <div className="text-center mt-4 mb-1">
                                    <h4 className="text-[15px] font-medium text-white">Software Engineer</h4>
                                    <p className="text-[13px] mt-1.5 text-slate-300">John Doe</p>
                                </div>
                            </div>

                            <div className="bg-gray-800 p-3 border rounded-lg">
                                <img src="https://readymadeui.com/team-2.webp"
                                     className="w-full object-contain aspect-square object-top rounded-lg"/>

                                <div className="text-center mt-4 mb-1">
                                    <h4 className="text-[15px] font-medium text-white">Web Developer</h4>
                                    <p className="text-[13px] mt-1.5 text-slate-300">Mark Adair</p>
                                </div>
                            </div>

                            <div className="bg-gray-800 p-3 border rounded-lg">
                                <img src="https://readymadeui.com/team-3.webp"
                                     className="w-full object-contain aspect-square object-top rounded-lg"/>

                                <div className="text-center mt-4 mb-1">
                                    <h4 className="text-[15px] font-medium text-white">Web Designer</h4>
                                    <p className="text-[13px] mt-1.5 text-slate-300">Simon Konecki</p>
                                </div>
                            </div>

                            <div className="bg-gray-800 p-3 border rounded-lg">
                                <img src="https://readymadeui.com/team-4.webp"
                                     className="w-full object-contain aspect-square object-top rounded-lg"/>

                                <div className="text-center mt-4 mb-1">
                                    <h4 className="text-[15px] font-medium text-white">Web Designer</h4>
                                    <p className="text-[13px] mt-1.5 text-slate-300">Eleanor</p>
                                </div>
                            </div>

                            <div className="bg-gray-800 p-3 border rounded-lg">
                                <img src="https://readymadeui.com/team-5.webp"
                                     className="w-full object-contain aspect-square object-top rounded-lg"/>

                                <div className="text-center mt-4 mb-1">
                                    <h4 className="text-[15px] font-medium text-white">Software Engineer</h4>
                                    <p className="text-[13px] mt-1.5 text-slate-300">Alen</p>
                                </div>
                            </div>

                            <div className="bg-gray-800 p-3 border rounded-lg">
                                <img src="https://readymadeui.com/team-6.webp"
                                     className="w-full object-contain aspect-square object-top rounded-lg"/>

                                <div className="text-center mt-4 mb-1">
                                    <h4 className="text-[15px] font-medium text-white">Software Developer</h4>
                                    <p className="text-[13px] mt-1.5 text-slate-300">Sophia</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
