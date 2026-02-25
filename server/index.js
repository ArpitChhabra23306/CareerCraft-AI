import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import userRoutes from './routes/userRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import gamificationRoutes from './routes/gamificationRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import User from './models/User.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    xFrameOptions: false
}));

app.use(morgan('common'));

app.use('/auth', authRoutes);
app.use('/docs', documentRoutes);
app.use('/ai', aiRoutes);
app.use('/interview', interviewRoutes);
app.use('/quiz', quizRoutes);
app.use('/user', userRoutes);
app.use('/gamification', gamificationRoutes);
app.use('/subscription', subscriptionRoutes);
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
    res.send('CareerCraft AI API is running');
});

// Health check endpoint for keep-alive pings
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

const connectMongoDB = async (connectionURL) => {
    try {
        const connection = await mongoose.connect(connectionURL);
        console.log("✅ MongoDB connected successfully!");

        // One-time migration: mark existing users as verified
        const result = await User.updateMany(
            { isVerified: { $exists: false } },
            { $set: { isVerified: true } }
        );
        if (result.modifiedCount > 0) {
            console.log(`✅ Migration: Marked ${result.modifiedCount} existing user(s) as verified`);
        }

        return connection;
    } catch (error) {
        console.error("❌ Error connecting to MongoDB:", error);
        throw error;
    }
};

connectMongoDB(process.env.MONGO_URI);

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

