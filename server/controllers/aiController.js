import Document from '../models/Document.js';
import FlashcardDeck from '../models/FlashcardDeck.js';
import Quiz from '../models/Quiz.js';
import QuizResult from '../models/QuizResult.js';
import { summarizeText, explainConcept, generateFlashcards, generateQuiz, generateTextGeneric } from '../services/geminiService.js';
import { awardXP, updateStreak, awardDocumentChatXP, XP_VALUES } from '../services/gamificationService.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

// Fetch PDF from Cloudinary URL and extract text
const extractTextFromPDF = async (fileUrl) => {
    try {
        const response = await fetch(fileUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch PDF from cloud: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const dataBuffer = Buffer.from(arrayBuffer);
        const data = await pdf(dataBuffer);
        return data.text;
    } catch (error) {
        console.error("PDF Extraction Error:", error);
        throw error;
    }
};

export const chatWithDocument = async (req, res) => {
    try {
        const { documentId, question } = req.body;
        console.log(`Chatting with doc: ${documentId}`);
        const doc = await Document.findById(documentId);
        if (!doc) return res.status(404).json({ message: 'Document not found' });

        const text = await extractTextFromPDF(doc.fileUrl);
        const context = text.substring(0, 50000);

        const answer = await explainConcept(question, context);

        // Award XP for document chat (capped at 25 XP per day)
        let xpResult = null;
        try {
            xpResult = await awardDocumentChatXP(req.user.id);
            await updateStreak(req.user.id);
        } catch (xpErr) {
            console.error('XP Award Error (non-blocking):', xpErr.message);
        }

        res.json({ answer, xpAwarded: xpResult?.xpAwarded || 0 });
    } catch (err) {
        console.error("Chat Error:", err);
        if (err.message.includes('429') || err.message.includes('Too Many Requests') || err.message.includes('Quota')) {
            return res.status(429).json({ message: "AI Usage Limit Reached. Please wait a minute and try again." });
        }
        res.status(500).json({ error: err.message });
    }
};

export const generateDocumentSummary = async (req, res) => {
    try {
        const { documentId } = req.body;
        console.log(`Summarizing doc: ${documentId}`);
        const doc = await Document.findById(documentId);
        if (!doc) return res.status(404).json({ message: 'Document not found' });

        const text = await extractTextFromPDF(doc.fileUrl);
        const summary = await summarizeText(text.substring(0, 30000));

        doc.summary = summary;
        await doc.save();

        res.json({ summary });
    } catch (err) {
        console.error("Summary Error:", err);
        if (err.message.includes('429') || err.message.includes('Too Many Requests')) {
            return res.status(429).json({ message: "AI Usage Limit Reached. Please wait a minute." });
        }
        res.status(500).json({ error: err.message });
    }
};

export const createFlashcards = async (req, res) => {
    try {
        const { documentId, deckTitle } = req.body;
        console.log(`Creating Flashcards for doc: ${documentId}`);
        const doc = await Document.findById(documentId);
        if (!doc) return res.status(404).json({ message: 'Document not found' });

        const text = await extractTextFromPDF(doc.fileUrl);
        const cardsData = await generateFlashcards(text.substring(0, 10000));

        const newDeck = new FlashcardDeck({
            user: req.user.id,
            document: documentId,
            title: deckTitle || `Deck: ${doc.filename}`,
            cards: cardsData
        });

        await newDeck.save();

        // Award XP for creating flashcards
        let xpResult = null;
        try {
            xpResult = await awardXP(req.user.id, XP_VALUES.REVIEW_FLASHCARDS, 'flashcard_creation');
            await updateStreak(req.user.id);
        } catch (xpErr) {
            console.error('XP Award Error (non-blocking):', xpErr.message);
        }

        res.status(201).json({ ...newDeck.toObject(), xpAwarded: xpResult?.xpAwarded || 0 });
    } catch (err) {
        console.error("Create Flashcards Error:", err);
        if (err.message.includes('429') || err.message.includes('Too Many Requests')) {
            return res.status(429).json({ message: "AI Usage Limit Reached. Please wait a minute." });
        }
        res.status(500).json({ error: err.message });
    }
};

export const createQuiz = async (req, res) => {
    try {
        const { documentId, numQuestions, questions } = req.body;
        console.log(`Creating Quiz for doc: ${documentId}`);
        const doc = await Document.findById(documentId);
        if (!doc) return res.status(404).json({ message: 'Document not found' });

        let quizData;

        if (questions && Array.isArray(questions) && questions.length > 0) {
            console.log("Using provided questions for quiz.");
            quizData = questions;
        } else {
            const text = await extractTextFromPDF(doc.fileUrl);
            quizData = await generateQuiz(text.substring(0, 10000), numQuestions || 5);
        }

        const newQuiz = new Quiz({
            user: req.user.id,
            document: documentId,
            title: `Quiz: ${doc.filename}`,
            questions: quizData,
            totalQuestions: quizData.length
        });

        await newQuiz.save();
        res.status(201).json(newQuiz);
    } catch (err) {
        console.error("Create Quiz Error:", err);
        if (err.message.includes('429') || err.message.includes('Too Many Requests')) {
            return res.status(429).json({ message: "AI Usage Limit Reached. Please wait a minute." });
        }
        res.status(500).json({ error: err.message });
    }
};

export const updateQuizScore = async (req, res) => {
    try {
        const { id } = req.params;
        const { score } = req.body;

        const quiz = await Quiz.findById(id);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        if (quiz.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        quiz.score = score;
        await quiz.save();

        const percentage = quiz.totalQuestions > 0 ? (score / quiz.totalQuestions) * 100 : 0;

        await QuizResult.create({
            user: req.user.id,
            score: score,
            totalQuestions: quiz.totalQuestions,
            percentage: percentage,
            quizTitle: quiz.title
        });

        // Award XP for completing a quiz
        let xpResult = null;
        try {
            xpResult = await awardXP(req.user.id, XP_VALUES.COMPLETE_QUIZ, 'quiz_completion');
            await updateStreak(req.user.id);
        } catch (xpErr) {
            console.error('XP Award Error (non-blocking):', xpErr.message);
        }

        res.json({ ...quiz.toObject(), xpAwarded: xpResult?.xpAwarded || 0 });
    } catch (err) {
        console.error("Update Score Error:", err);
        res.status(500).json({ error: err.message });
    }
};

export const getDecks = async (req, res) => {
    try {
        const decks = await FlashcardDeck.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(decks);
    } catch (err) {
        console.error("Get Decks Error:", err);
        res.status(500).json({ error: err.message });
    }
};

export const getQuizzes = async (req, res) => {
    try {
        const quizzes = await Quiz.find({ user: req.user.id }).sort({ attemptedAt: -1 });
        res.json(quizzes);
    } catch (err) {
        console.error("Get Quizzes Error:", err);
        res.status(500).json({ error: err.message });
    }
};

// NEW: Generic text generation endpoint for secure frontend AI calls
export const generateText = async (req, res) => {
    try {
        const { prompt, systemInstruction } = req.body;

        if (!prompt) {
            return res.status(400).json({ message: 'Prompt is required' });
        }

        const result = await generateTextGeneric(prompt, systemInstruction);
        res.json({ text: result });
    } catch (err) {
        console.error("Generate Text Error:", err);
        if (err.message.includes('429') || err.message.includes('Too Many Requests')) {
            return res.status(429).json({ message: "AI Usage Limit Reached. Please wait a minute." });
        }
        res.status(500).json({ error: err.message });
    }
};
