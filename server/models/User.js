import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    bio: { type: String, default: '' },
    avatar: { type: String, default: '' },
    theme: { type: String, default: 'light' },
    createdAt: { type: Date, default: Date.now },

    // Gamification fields
    xp: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActivityDate: { type: Date, default: null },
    lastLoginDate: { type: Date, default: null },
    dailyLoginClaimed: { type: Boolean, default: false },
    dailyChatXP: { type: Number, default: 0 } // Track daily document chat XP (capped at 25)
});

export default mongoose.model('User', UserSchema);
