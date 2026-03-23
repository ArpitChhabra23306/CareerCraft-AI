import Document from '../models/Document.js';
import FlashcardDeck from '../models/FlashcardDeck.js';
import Quiz from '../models/Quiz.js';
import QuizResult from '../models/QuizResult.js';
import { incrementUsage } from '../middleware/usageMiddleware.js';
import { summarizeText, explainConcept, generateFlashcards, generateQuiz, generateTextGeneric } from '../services/geminiService.js';
import { awardXP, updateStreak, awardDocumentChatXP, XP_VALUES } from '../services/gamificationService.js';
import { ingestDocument, searchSimilarChunks } from '../services/embeddingService.js';
import { generateRAGResponse } from '../services/groqService.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

// Get document text — uses cached parsedText if available, otherwise fetches + parses + caches
const getDocumentText = async (doc) => {
    // Return cached text if available
    if (doc.parsedText) {
        return doc.parsedText;
    }

    // First time: download from Cloudinary, parse, and cache
    try {
        const response = await fetch(doc.fileUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch PDF from cloud: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const dataBuffer = Buffer.from(arrayBuffer);
        const data = await pdf(dataBuffer);
        const text = data.text;

        // Cache the parsed text for future use
        doc.parsedText = text;
        await doc.save();
        console.log(`✅ Cached parsed text for doc: ${doc._id}`);

        return text;
    } catch (error) {
        console.error("PDF Extraction Error:", error);
        throw error;
    }
};

export const chatWithDocument = async (req, res) => {
    try {
        const { documentId, question, useRAG } = req.body;
        console.log(`Chatting with doc: ${documentId} | RAG: ${!!useRAG}`);
        const doc = await Document.findById(documentId);
        if (!doc) return res.status(404).json({ message: 'Document not found' });

        let answer;
        let mode = 'gemini';

        if (useRAG && doc.isEmbedded) {
            // RAG Mode: Retrieve relevant chunks → Groq (Llama 3.3)
            const chunks = await searchSimilarChunks(question, documentId, 5);
            if (chunks.length === 0) {
                return res.status(400).json({ message: 'No relevant content found. Try a different question.' });
            }
            const result = await generateRAGResponse(question, chunks, doc.filename);
            answer = result.answer;
            mode = 'rag-groq';
        } else {
            // Legacy Mode: Truncated text → Gemini
            const text = await getDocumentText(doc);
            const context = text.substring(0, 50000);
            answer = await explainConcept(question, context);
        }

        // Award XP for document chat (capped at 25 XP per day)
        let xpResult = null;
        try {
            xpResult = await awardDocumentChatXP(req.user.id);
            await updateStreak(req.user.id);
            await incrementUsage(req.user.id, 'aiChatQueries');
        } catch (xpErr) {
            console.error('XP Award Error (non-blocking):', xpErr.message);
        }

        res.json({ answer, mode, xpAwarded: xpResult?.xpAwarded || 0 });
    } catch (err) {
        console.error('Chat Error:', err);
        if (err.message.includes('429') || err.message.includes('Too Many Requests') || err.message.includes('Quota')) {
            return res.status(429).json({ message: 'AI Usage Limit Reached. Please wait a minute and try again.' });
        }
        res.status(500).json({ error: err.message });
    }
};

/**
 * POST /ai/embed
 * Trigger RAG ingestion: chunk + embed a document's text.
 */
export const embedDocument = async (req, res) => {
    try {
        const { documentId } = req.body;
        if (!documentId) return res.status(400).json({ message: 'documentId is required' });

        const doc = await Document.findById(documentId);
        if (!doc) return res.status(404).json({ message: 'Document not found' });
        if (doc.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Ensure parsed text exists first
        if (!doc.parsedText) {
            await getDocumentText(doc);
        }

        console.log(`[RAG] Starting ingestion for: ${doc.filename}`);
        const chunkCount = await ingestDocument(documentId);

        res.json({
            message: `Document embedded successfully`,
            chunkCount,
            isEmbedded: true
        });
    } catch (err) {
        console.error('Embed Error:', err);
        res.status(500).json({ error: err.message });
    }
};

export const generateDocumentSummary = async (req, res) => {
    try {
        const { documentId } = req.body;
        console.log(`Summarizing doc: ${documentId}`);
        const doc = await Document.findById(documentId);
        if (!doc) return res.status(404).json({ message: 'Document not found' });

        const text = await getDocumentText(doc);
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

        const text = await getDocumentText(doc);
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
            // Track flashcard deck usage for subscription limits
            await incrementUsage(req.user.id, 'flashcardDecks');
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
            const text = await getDocumentText(doc);
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

        // Track quiz usage for subscription limits
        try {
            await incrementUsage(req.user.id, 'quizzesToday');
        } catch (e) {
            console.error('Usage tracking error:', e.message);
        }

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
