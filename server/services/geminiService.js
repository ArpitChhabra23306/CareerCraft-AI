import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({});
// const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // OLD
// New SDK doesn't hold model instances the same way usually, but let's see usage.
// Actually documentation says: ai.models.generateContent({ model: '...', ... })


const retryWithBackoff = async (fn, fallbackValue, retries = 3, delay = 2000) => {
    try {
        return await fn();
    } catch (error) {
        // Only retry and use fallback for Rate Limits (429) or Service Unavailable (503)
        // Throw everything else (like 400 Invalid API Key) so the user knows!
        const isRateLimit = error.message.includes('429') || error.message.includes('Quota') || error.message.includes('Too Many Requests');
        const isTransient = error.message.includes('503') || error.message.includes('Overloaded');

        if (retries > 0 && (isRateLimit || isTransient)) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return retryWithBackoff(fn, fallbackValue, retries - 1, delay * 2);
        }

        if (isRateLimit) {
            console.warn("Rate limit exhausted. Using Mock Data.");
            return fallbackValue;
        }

        console.error("Non-retriable AI Error:", error.message);
        throw error; // Re-throw real errors (Invalid Key, Bad Request, etc.)
    }
};

export const summarizeText = async (text) => {
    return retryWithBackoff(async () => {
        const prompt = `Summarize the following text concisely, highlighting key points:\n\n${text}`;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });
        return response.text;
    }, "This is a simulated summary because the AI service is currently unavailable. \n\nKey points:\n- The AI rate limit was exceeded.\n- This mock data ensures the app remains usable.\n- Please try again later for a real summary.");
};

export const explainConcept = async (concept, context = "") => {
    return retryWithBackoff(async () => {
        const prompt = `Explain the concept "${concept}" simply and clearly${context ? ` in the context of: ${context}` : ''}.`;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });
        return response.text;
    }, `The concept "${concept}" is interesting! Unfortunately, the AI is taking a break (Rate Limit). \n\nSimulated Explanation: It involves key principles of connection and data flow.`);
};

export const generateFlashcards = async (text) => {
    return retryWithBackoff(async () => {
        const prompt = `Create 5 flashcards from the following text using the schema: [{ "front": string, "back": string }]. \nText: ${text}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
            }
        });
        // With responseMimeType, we typically get raw text that is JSON. 
        // We still need to parse it, but it handles the markdown stripping better.
        return JSON.parse(response.text);
    }, [
        { front: "What is the status of the AI?", back: "It is currently rate-limited." },
        { front: "What is this?", back: "This is a mock flashcard." },
        { front: "Why am I seeing this?", back: "To prevent the app from crashing when AI fails." },
        { front: "Can I study this?", back: "Yes, it simulates the study experience." },
        { front: "Will it work later?", back: "Yes, once the rate limit resets." }
    ]);
};

export const generateQuiz = async (text, numQuestions = 5) => {
    return retryWithBackoff(async () => {
        const prompt = `Generate ${numQuestions} multiple-choice questions from the text using schema: [{ "question": string, "options": string[], "correctAnswer": string, "explanation": string }].\nText: ${text}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
            }
        });
        return JSON.parse(response.text);
    }, [
        {
            question: "Why is this a mock question?",
            options: ["AI Rate Limit", "Server Crash", "Network Error", "Bug"],
            correctAnswer: "AI Rate Limit",
            explanation: "The AI quota is exceeded, so we serve this to keep the UI working."
        },
        {
            question: "What should you do?",
            options: ["Panic", "Retry Later", "Uninstall", "Cry"],
            correctAnswer: "Retry Later",
            explanation: "Google's free tier resets typically every minute or day."
        }
    ]);
};

export const getInterviewResponse = async (history, message, role, difficulty, company = "", skills = []) => {
    try {
        // Construct detailed prompt
        const skillsStr = skills && skills.length > 0 ? `Skills to assess: ${skills.join(", ")}.` : "";
        const companyStr = company ? `Target Company: ${company}. (Adopt the interview style of this company if known).` : "";

        // Create chat instance
        const chat = ai.chats.create({
            model: "gemini-2.5-flash",
            history: history,
            config: {
                // systemInstruction in config, or use separate field depending on SDK version.
                // For safety in this simplified SDK wrapper, passing it in config is standard.
                systemInstruction: `You are an expert technical interviewer for the role of ${role}. Difficulty: ${difficulty}.
        ${companyStr}
        ${skillsStr}
        Conduct a technical interview. Ask questions one by one. 
        Start by introducing yourself and testing the candidate on the specified skills.
        Provide feedback if the user answers incorrectly. 
        Keep responses professional but encouraging.`,
                maxOutputTokens: 500,
            }
        });

        // Send the message. Expects object { message: ... } per SDK test.
        const result = await chat.sendMessage({ message: message });
        return result.text;
    } catch (error) {
        console.error("Interview Error:", error);
        throw new Error(`Failed to get interview response: ${error.message}`);
    }
};
