import {Message} from "../../../models/chat-models";
import {useEffect} from "react";
import {useAppStore} from "../../../store/use-app.store";
import SimpleBar from "simplebar";
import {Avatar, MessageBox} from "react-chat-elements";
import {Utils} from "../../../helpers/utils";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import {MouseEvent} from 'react';

interface EmojiData {
    native: string;
    [key: string]: any;
}

interface MessageReaction {
    emoji: string;
    count: number;
    users: number[];
}

interface ExtendedMessage extends Message {
    reactions?: MessageReaction[];
}

export const MessageList = ({userMap}: {userMap: any}) => {
    const {user, isConnected, messages, addMessage} = useAppStore() as {
        user: {id: number};
        isConnected: boolean;
        messages: ExtendedMessage[];
        addMessage: ({message}: {message: ExtendedMessage}) => void;
    };
    
    const handleEmojiSelect = (emoji: EmojiData, messageId: string | undefined) => {
        if (!messageId) return;
        
        // Find the message to update
        const messageToUpdate = messages.find(msg => msg.msgUri === messageId);
        if (messageToUpdate) {
            // Create or update reactions array
            const reactions = messageToUpdate.reactions || [];
            const existingReactionIndex = reactions.findIndex((r: MessageReaction) => r.emoji === emoji.native);
            
            if (existingReactionIndex > -1) {
                // If user already reacted, remove their reaction
                const reaction = reactions[existingReactionIndex];
                if (reaction.users.includes(user.id)) {
                    reaction.users = reaction.users.filter((id: number) => id !== user.id);
                    reaction.count--;
                    if (reaction.count === 0) {
                        reactions.splice(existingReactionIndex, 1);
                    }
                } else {
                    // Add user's reaction
                    reaction.users.push(user.id);
                    reaction.count++;
                }
            } else {
                // Add new reaction
                reactions.push({
                    emoji: emoji.native,
                    count: 1,
                    users: [user.id]
                });
            }
            
            // Update the message with new reactions
            const updatedMessage = {
                ...messageToUpdate,
                reactions
            };
            
            // Update the message in the store
            addMessage({message: updatedMessage});
        }
    };

    const handleEmojiClick = (evt: MouseEvent<HTMLDivElement>) => {
        evt.preventDefault();
        evt.stopPropagation();
    };

    // Set the room messages
    useEffect(() => {
        // Init simpleBar scroll handler library
        const elm = document.querySelectorAll('.js-scroll-to-end');
        if(elm){
            elm.forEach(item => {
                const simpleBody = new SimpleBar(item as HTMLElement);
                const scrollElement = simpleBody.getScrollElement();
                if (scrollElement) {
                    const height = (item.querySelector('.simplebar-content > *') as HTMLElement)?.scrollHeight || 0;
                    scrollElement.scrollTop = height;
                }
            });
        }
    }, [messages, isConnected, userMap]);

    return (
        <>
            {messages.map((message: ExtendedMessage, idx) => {
                const {text, sender, msgUri, reactions = []} = message;
                const {fullname, thumb, userId} = sender || {};
                const fromMe = userId === user.id;
                const position = fromMe ? 'right' : 'left';
                const title = fromMe ? '' : (fullname || '');
                const avatar = thumb && /^http/gi.test(thumb) ? thumb : Utils.thumbFromInitials({fullName: fullname || ''});
                
                // Ensure text is always a string
                const messageText = text || '';
                const messageId = msgUri || String(idx);
                
                return (
                    <div key={idx} className="tyn-reply-item outgoing">
                        <div className={`tyn-reply-group w-full`} style={{alignItems: `${!fromMe ? 'items-start' : ''}`}}>
                            <div className={`tyn-reply-bubble w-full flex-1 ${!fromMe ? 'flex-row justify-start self-start' : ''}`}>
                                <div className={`flex w-full ${fromMe ? 'flex-row-reverse items-start justify-end' : 'flex items-start justify-start'}`}>
                                    <Avatar src={avatar || ''} type={'rounded'}/>
                                    <div className="relative">
                                        <MessageBox
                                            position={position}
                                            type={'text'}
                                            text={messageText}
                                            title={title}
                                            date={new Date()}
                                            id={messageId}
                                            focus={false}
                                            titleColor="#000"
                                            forwarded={false}
                                            replyButton={false}
                                            removeButton={false}
                                            status="sent"
                                            notch={false}
                                            retracted={false}
                                        />
                                        {reactions.length > 0 && (
                                            <div className={`absolute bottom-0 transform translate-y-full mt-1 flex gap-1 ${fromMe ? 'right-0' : 'left-0'}`}>
                                                {reactions.map((reaction: MessageReaction, index: number) => (
                                                    <div 
                                                        key={index}
                                                        className={`flex items-center bg-white rounded-full px-2 py-1 shadow-sm border ${reaction.users.includes(user.id) ? 'border-blue-400' : 'border-gray-200'}`}
                                                    >
                                                        <span className="text-sm">{reaction.emoji}</span>
                                                        <span className="ml-1 text-xs text-gray-500">{reaction.count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <ul className="tyn-reply-tools">
                                    <li className="dropup-center">
                                        <button className="btn btn-icon btn-sm btn-transparent btn-pill" data-bs-toggle="dropdown">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                                                 className="bi bi-emoji-smile-fill" viewBox="0 0 16 16">
                                                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zM7 6.5C7 7.328 6.552 8 6 8s-1-.672-1-1.5S5.448 5 6 5s1 .672 1 1.5zM4.285 9.567a.5.5 0 0 1 .683.183A3.498 3.498 0 0 0 8 11.5a3.498 3.498 0 0 0 3.032-1.75.5.5 0 1 1 .866.5A4.498 4.498 0 0 1 8 12.5a4.498 4.498 0 0 1-3.898-2.25.5.5 0 0 1 .183-.683zM10 8c-.552 0-1-.672-1-1.5S9.448 5 10 5s1 .672 1 1.5S10.552 8 10 8z"/>
                                            </svg>
                                        </button>
                                        <div className="dropdown-menu dropdown-menu-xxs" onClick={handleEmojiClick}>
                                            <Picker data={data} onEmojiSelect={(emoji: EmojiData) => handleEmojiSelect(emoji, msgUri)} />
                                        </div>
                                    </li>
                                    <li className="dropup-center">
                                        <button className="btn btn-icon btn-sm btn-transparent btn-pill"
                                                data-bs-toggle="dropdown">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                                                 className="bi bi-three-dots" viewBox="0 0 16 16">
                                                <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
                                            </svg>
                                        </button>
                                        <div className="dropdown-menu dropdown-menu-xxs">
                                            <ul className="tyn-list-links">
                                                <li>
                                                    <a href="#">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                             fill="currentColor" className="bi bi-pencil-square"
                                                             viewBox="0 0 16 16">
                                                            <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                                                            <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                                                        </svg>
                                                        <span>Edit</span>
                                                    </a>
                                                </li>
                                                <li>
                                                    <a href="#">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                             fill="currentColor" className="bi bi-trash" viewBox="0 0 16 16">
                                                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                                            <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                                                        </svg>
                                                        <span>Delete</span>
                                                    </a>
                                                </li>
                                            </ul>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                );
            })}
        </>
    );
};
