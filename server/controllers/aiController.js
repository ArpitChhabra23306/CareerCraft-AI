import Document from '../models/Document.js';
import FlashcardDeck from '../models/FlashcardDeck.js';
import Quiz from '../models/Quiz.js';
import { summarizeText, explainConcept, generateFlashcards, generateQuiz } from '../services/geminiService.js';
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const extractTextFromPDF = async (filepath) => {
    try {
        if (!fs.existsSync(filepath)) {
            throw new Error(`File not found at path: ${filepath}`);
        }
        const dataBuffer = fs.readFileSync(filepath);
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

        const text = await extractTextFromPDF(doc.filepath);
        const context = text.substring(0, 50000);

        const answer = await explainConcept(question, context);
        res.json({ answer });
    } catch (err) {
        fs.appendFileSync('debug_errors.log', `${new Date().toISOString()} - Chat Error: ${err.stack}\n`);
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

        const text = await extractTextFromPDF(doc.filepath);
        const summary = await summarizeText(text.substring(0, 30000));

        doc.summary = summary;
        await doc.save();

        res.json({ summary });
    } catch (err) {
        fs.appendFileSync('debug_errors.log', `${new Date().toISOString()} - Summary Error: ${err.stack}\n`);
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

        const text = await extractTextFromPDF(doc.filepath);
        const cardsData = await generateFlashcards(text.substring(0, 10000));

        const newDeck = new FlashcardDeck({
            user: req.user.id,
            document: documentId,
            title: deckTitle || `Deck: ${doc.filename}`,
            cards: cardsData
        });

        await newDeck.save();
        res.status(201).json(newDeck);
    } catch (err) {
        fs.appendFileSync('debug_errors.log', `${new Date().toISOString()} - Flashcard Error: ${err.stack}\n`);
        console.error("Create Flashcards Error:", err);
        if (err.message.includes('429') || err.message.includes('Too Many Requests')) {
            return res.status(429).json({ message: "AI Usage Limit Reached. Please wait a minute." });
        }
        res.status(500).json({ error: err.message });
    }
};

export const createQuiz = async (req, res) => {
    try {
        const { documentId, numQuestions } = req.body;
        console.log(`Creating Quiz for doc: ${documentId}`);
        const doc = await Document.findById(documentId);
        if (!doc) return res.status(404).json({ message: 'Document not found' });

        const text = await extractTextFromPDF(doc.filepath);
        const quizData = await generateQuiz(text.substring(0, 10000), numQuestions || 5);

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
        fs.appendFileSync('debug_errors.log', `${new Date().toISOString()} - Quiz Error: ${err.stack}\n`);
        console.error("Create Quiz Error:", err);
        if (err.message.includes('429') || err.message.includes('Too Many Requests')) {
            return res.status(429).json({ message: "AI Usage Limit Reached. Please wait a minute." });
        }
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
