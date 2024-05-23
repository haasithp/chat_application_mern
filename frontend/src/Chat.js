import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:9090');

function Chat({ user }) {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        socket.on('receive_message', (data) => {
            setMessages((prevMessages) => [...prevMessages, data]);
        });

        return () => {
            socket.off('receive_message');
        };
    }, []);

    const sendMessage = () => {
        const messageData = {
            user: user.username,
            message: message,
            time: new Date().toLocaleTimeString(),
        };
        socket.emit('send_message', messageData);
        setMessages((prevMessages) => [...prevMessages, messageData]);
        setMessage('');
    };

    return (
        <div className="chat">
            <div className="messages">
                {messages.map((msg, index) => (
                    <div key={index}>
                        <strong>{msg.user}</strong>: {msg.message} <em>{msg.time}</em>
                    </div>
                ))}
            </div>
            <div className="input">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                <button onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
}

export default Chat;
