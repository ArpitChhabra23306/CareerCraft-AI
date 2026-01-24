import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    bio: { type: String, default: '' },
    avatar: { type: String, default: '' },
    theme: { type: String, default: 'light' },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', UserSchema);
