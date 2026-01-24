import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
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
app.use('/quiz', quizRoutes); // Use quiz routes (separate from AI routes which has generic quiz gen)
app.use('/user', userRoutes); // New User Routes
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
    res.send('MERN Learning Platform API is running');
});

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        console.log('MongoDB Connected (Local)');
    } catch (err) {
        console.log('Local MongoDB connection failed. Starting Embedded Database...');
        try {
            const mongod = await MongoMemoryServer.create();
            const uri = mongod.getUri();
            console.log(`Embedded MongoDB started at: ${uri}`);
            await mongoose.connect(uri);
            console.log('MongoDB Connected (Embedded)');
        } catch (memErr) {
            console.error('Failed to start embedded database:', memErr);
        }
    }
};

connectDB();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
