import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import LoginRegister from './LoginRegister';
import './App.css'; // Assuming you have some basic styling

const socket = io('http://localhost:9090', {
  auth: {
    token: localStorage.getItem('token'),
  }
});

function App() {
  const [user, setUser] = useState(null);
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('AVAILABLE');

  useEffect(() => {
    socket.on('receiveMessage', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, []);

  const handleSendMessage = () => {
    if (recipient && message) {
      socket.emit('sendMessage', { recipientId: recipient, text: message });
      setMessages((prevMessages) => [...prevMessages, { senderId: user, text: message }]);
      setMessage('');
    }
  };

  const handleLogin = (email) => {
    setUser(email);
  };

  const handleSetStatus = async (newStatus) => {
    setStatus(newStatus);
    const token = localStorage.getItem('token');
    await fetch('http://localhost:9090/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });
  };

  if (!user) {
    return <LoginRegister onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <h2>Welcome, {user}</h2>
      <div>
        <label>Status: </label>
        <select value={status} onChange={(e) => handleSetStatus(e.target.value)}>
          <option value="AVAILABLE">Available</option>
          <option value="BUSY">Busy</option>
        </select>
      </div>
      <div>
        <label>Recipient ID: </label>
        <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
      </div>
      <div>
        <label>Message: </label>
        <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} />
        <button onClick={handleSendMessage}>Send</button>
      </div>
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.senderId === user ? 'Me' : 'Them'}: </strong>{msg.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
