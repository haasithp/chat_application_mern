// src/models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    status: { type: String, enum: ['AVAILABLE', 'BUSY'], default: 'AVAILABLE' }
});

const User = mongoose.model('User', userSchema);

export default User;
