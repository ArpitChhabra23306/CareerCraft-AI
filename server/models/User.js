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
    dailyChatXP: { type: Number, default: 0 },

    // Subscription fields
    subscription: {
        plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
        razorpaySubscriptionId: { type: String, default: null },
        razorpayCustomerId: { type: String, default: null },
        razorpayOrderId: { type: String, default: null },
        status: { type: String, enum: ['active', 'cancelled', 'past_due', 'trialing', 'expired'], default: 'active' },
        currentPeriodStart: { type: Date, default: null },
        currentPeriodEnd: { type: Date, default: null },
        cancelAtPeriodEnd: { type: Boolean, default: false }
    },

    // Usage tracking (reset monthly)
    usage: {
        documentsUploaded: { type: Number, default: 0 },
        aiChatQueries: { type: Number, default: 0 },
        quizzesToday: { type: Number, default: 0 },
        lastQuizDate: { type: Date, default: null },
        flashcardDecks: { type: Number, default: 0 },
        interviewsThisMonth: { type: Number, default: 0 },
        usageResetDate: { type: Date, default: Date.now }
    }
});

export default mongoose.model('User', UserSchema);
