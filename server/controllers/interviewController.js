import InterviewSession from '../models/InterviewSession.js';
import { getInterviewResponse } from '../services/geminiService.js';

export const startInterview = async (req, res) => {
    try {
        const { role, difficulty, company, skills } = req.body;
        const newSession = new InterviewSession({
            user: req.user.id,
            role,
            difficulty,
            company: company || "",
            skills: skills || [],
            messages: []
        });

        // Initial greeting from AI
        // We pass the full session context object now or just expand args
        const initialMessage = await getInterviewResponse([], "Start the interview.", role, difficulty, company, skills);
        newSession.messages.push({ role: 'model', content: initialMessage });

        await newSession.save();
        res.status(201).json(newSession);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const sendInterviewMessage = async (req, res) => {
    try {
        const { sessionId, message } = req.body;
        const session = await InterviewSession.findById(sessionId);
        if (!session) return res.status(404).json({ message: 'Session not found' });

        // Check if user authorized
        if (session.user.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

        // Format history for Gemini
        // Current history from DB
        const history = session.messages.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }));

        // Add user message to DB
        session.messages.push({ role: 'user', content: message });

        // Get AI response
        const aiResponse = await getInterviewResponse(history, message, session.role, session.difficulty, session.company, session.skills);

        // Add AI response to DB
        session.messages.push({ role: 'model', content: aiResponse });

        await session.save();
        res.json(session);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getSession = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await InterviewSession.findById(id);
        if (!session) return res.status(404).json({ message: 'Session not found' });
        if (session.user.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

        res.json(session);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getUserSessions = async (req, res) => {
    try {
        const sessions = await InterviewSession.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(sessions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
