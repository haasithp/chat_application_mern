import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import http from 'http';
import { GoogleGenerativeAI } from '@google/generative-ai';
import User from './models/User.js';
import Message from './models/Message.js';

dotenv.config();

const PORT = process.env.PORT || 9090;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.json());

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

const apiKey = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization').split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access denied' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
};


// User Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ token });
    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get Messages
app.get('/messages/:recipientId', authenticateToken, async (req, res) => {
    const { recipientId } = req.params;
    const userId = req.user.userId;

    try {
        const messages = await Message.find({
            $or: [
                { sender: userId, recipient: recipientId },
                { sender: recipientId, recipient: userId }
            ]
        }).sort('timestamp');

        res.status(200).json(messages);
    } catch (err) {
        console.error('Error retrieving messages:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// src/server.js
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Email already exists' });

        const existingUsername = await User.findOne({ username });
        if (existingUsername) return res.status(400).json({ message: 'Username already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});



// Socket.io connection
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return next(new Error('Authentication error'));
        socket.user = user;
        next();
    });
});

io.on('connection', (socket) => {
    console.log('A user connected', socket.user);

    socket.on('sendMessage', async ({ recipientId, text }) => {
        const senderId = socket.user.userId;

        const recipient = await User.findById(recipientId);
        if (!recipient) return;

        if (recipient.status === 'BUSY') {
            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
            const chat = model.startChat({
                history: [{ role: 'user', parts: [{ text }] }],
                generationConfig: { maxOutputTokens: 100 }
            });

            let aiResponse;
            try {
                const result = await Promise.race([
                    chat.sendMessage(text).then(res => res.response.text()),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
                ]);
                aiResponse = result;
            } catch (error) {
                aiResponse = 'The user is currently unavailable.';
            }

            io.to(socket.id).emit('receiveMessage', {
                senderId: recipientId,
                text: aiResponse
            });
        } else {
            const message = new Message({ sender: senderId, recipient: recipientId, text });
            await message.save();

            io.to(socket.id).emit('receiveMessage', {
                senderId,
                text
            });
            io.to(recipientId).emit('receiveMessage', {
                senderId,
                text
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected', socket.user);
    });
});


//! Run the Server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`); // Debug log
});
