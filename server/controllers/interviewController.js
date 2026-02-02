import InterviewSession from '../models/InterviewSession.js';
import { getInterviewResponse } from '../services/geminiService.js';
import { awardXP, updateStreak, XP_VALUES } from '../services/gamificationService.js';
import { incrementUsage } from '../middleware/usageMiddleware.js';

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
        const initialMessage = await getInterviewResponse([], "Start the interview.", role, difficulty, company, skills);
        newSession.messages.push({ role: 'model', content: initialMessage });

        await newSession.save();

        // Track interview usage for subscription limits
        try {
            await incrementUsage(req.user.id, 'interviewsThisMonth');
        } catch (e) {
            console.error('Usage tracking error:', e.message);
        }

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

        // Count user messages to determine if interview is substantial
        const userMessageCount = session.messages.filter(m => m.role === 'user').length;

        // Award XP for completing interview (5+ user messages, only once per session)
        let xpResult = null;
        if (userMessageCount >= 5 && !session.xpAwarded) {
            try {
                xpResult = await awardXP(req.user.id, XP_VALUES.FINISH_INTERVIEW, 'interview_completion');
                await updateStreak(req.user.id);
                session.xpAwarded = true;
            } catch (xpErr) {
                console.error('XP Award Error (non-blocking):', xpErr.message);
            }
        }

        await session.save();
        res.json({ ...session.toObject(), xpAwarded: xpResult?.xpAwarded || 0 });
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
