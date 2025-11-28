import { useState } from 'react';
import './Chat.css';

const Chat = ({ messages, onSendMessage, placeholder, disabled }) => {
    const [input, setInput] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim() && !disabled) {
            onSendMessage(input);
            setInput('');
        }
    };

    return (
        <div className="chat-interface">
            <div className="chat-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`chat-bubble ${msg.sender}`}>
                        <p>{msg.text}</p>
                    </div>
                ))}
            </div>

            <form className="chat-input-area" onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={placeholder || "Ask the spirits..."}
                    className="chat-input"
                    disabled={disabled}
                />
                <button type="submit" className="chat-send-btn" disabled={disabled}>
                    ➤
                </button>
            </form>
        </div>
    );
};

export default Chat;
