import React from "react";

const messages = [
    { type: "outgoing", text: "Do you know which App or feature it will require to set up?" },
    { type: "outgoing", text: "These articles help." },
    { type: "incoming", text: "https://www.envato.com/atomic-power-plant-engine/", isLink: true },
    { type: "incoming", text: "I hope this article helps." },
    { type: "separator", text: "May 10, 2022, 11:14 AM" },
    { type: "outgoing", text: "Yes, you can reset your password online. Go to the login page, click on 'Forgot Password,' and follow the instructions to reset it." },
    { type: "incoming", text: "How do I reset my password? Can I do it online?" },
];

const MessageBubble = ({ text, isLink }: { text: string; isLink?: boolean }) => (
    <div className="tyn-reply-bubble">
        {isLink ? (
            <div className="tyn-reply-link">
                <a className="tyn-reply-anchor" href={text} target="_blank" rel="noopener noreferrer">
                    {text}
                </a>
            </div>
        ) : (
            <div className="tyn-reply-text">{text}</div>
        )}
    </div>
);

const ChatMessage = ({ message }: { message: any }) => {
    if (message.type === "separator") {
        return <div className="tyn-reply-separator">{message.text}</div>;
    }
    return (
        <div className={`tyn-reply-item ${message.type}`}>
            {message.type === "incoming" && (
                <div className="tyn-reply-avatar">
                    <div className="tyn-media tyn-size-md tyn-circle">
                        <img src="assets/images/avatar/2.jpg" alt="User Avatar" />
                    </div>
                </div>
            )}
            <div className="tyn-reply-group">
                <MessageBubble text={message.text} isLink={message.isLink} />
            </div>
        </div>
    );
};

export const QuickChatBox = () => {
    return (
        <div className="tyn-quick-chat" id="tynQuickChat">
            <button className="tyn-quick-chat-toggle js-toggle-quick">
                <svg viewBox="0 0 43 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M37.2654 14.793C37.2654 14.793 45.0771 20.3653 41.9525 29.5311C41.9525 29.5311 41.3796 31.1976 39.0361 34.4264L42.4732 37.9677C42.4732 37.9677 43.3065 39.478 41.5879 39.9987H24.9229C24.9229 39.9987 19.611 40.155 14.8198 36.9782C14.8198 36.9782 12.1638 35.2076 9.76825 31.9787L18.6215 32.0308C18.6215 32.0308 24.298 31.9787 29.7662 28.3333C35.2344 24.6878 37.4217 18.6988 37.2654 14.793Z"
                        fill="#60A5FA"
                    />
                    <path
                        d="M34.5053 12.814C32.2659 1.04441 19.3506 0.0549276 19.3506 0.0549276C8.31004 -0.674164 3.31055 6.09597 3.31055 6.09597C-4.24076 15.2617 3.6751 23.6983 3.6751 23.6983C3.6751 23.6983 2.99808 24.6357 0.862884 26.5105C-1.27231 28.3854 1.22743 29.3748 1.22743 29.3748H17.3404C23.4543 28.7499 25.9124 27.3959 25.9124 27.3959C36.328 22.0318 34.5053 12.814 34.5053 12.814Z"
                        fill="#2563EB"
                    />
                </svg>
                <span className="badge bg-primary top-0 end-0 position-absolute rounded-pill">2</span>
            </button>

            <div className="tyn-quick-chat-box">
                <div className="tyn-quick-chat-head">
                    <div className="tyn-media-group">
                        <div className="tyn-media tyn-size-rg">
                            <img src="assets/images/avatar/1.jpg" alt="User Avatar" />
                        </div>
                        <div className="tyn-media-col">
                            <h6 className="name">Jasmine Thompson</h6>
                            <span className="meta">Active</span>
                        </div>
                    </div>
                </div>

                <div className="tyn-quick-chat-reply js-scroll-to-end">
                    <div className="tyn-reply tyn-reply-quick">
                        {messages.map((msg, index) => (
                            <ChatMessage key={index} message={msg} />
                        ))}
                    </div>
                </div>

                <div className="tyn-quick-chat-form">
                    <div className="tyn-chat-form-input bg-light" contentEditable />
                    <ul className="tyn-list-inline me-n2 my-1">
                        <li>
                            <button className="btn btn-icon btn-white btn-sm btn-pill">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-send-fill" viewBox="0 0 16 16">
                                    <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z" />
                                </svg>
                            </button>
                        </li>
                    </ul>
                </div>

                <button className="btn btn-danger btn-sm btn-icon top-0 end-0 position-absolute rounded-pill translate-middle js-toggle-quick">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-x-lg" viewBox="0 0 16 16">
                        <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
