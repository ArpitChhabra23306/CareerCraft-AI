import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
    role: { type: String, enum: ['user', 'model'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const InterviewSessionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, required: true }, // e.g. "Frontend Developer"
    company: { type: String, default: "" }, // e.g. "Google"
    skills: { type: [String], default: [] }, // e.g. ["React", "Node.js"]
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    messages: [MessageSchema],
    feedback: { type: String }, // Overall feedback from AI
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('InterviewSession', InterviewSessionSchema);
