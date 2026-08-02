import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
    console.error("⚠️ OPENAI_API_KEY is not configured in .env!");
}

const openai = new OpenAI({
    apiKey: apiKey
});

const retryWithBackoff = async (fn, fallbackValue, retries = 3, delay = 2000) => {
    try {
        return await fn();
    } catch (error) {
        // Intercept Rate Limits (429) or Transient Errors (5xx, 503)
        const status = error.status || (error.response && error.response.status);
        const errorMessage = error.message || '';
        
        const isRateLimit = status === 429 || errorMessage.includes('429') || errorMessage.includes('Quota') || errorMessage.includes('Too Many Requests');
        const isTransient = (status >= 500 && status < 600) || errorMessage.includes('503') || errorMessage.includes('Overloaded');

        if (retries > 0 && (isRateLimit || isTransient)) {
            console.warn(`[OpenAI] Retrying due to status ${status || 'unknown'} / ${errorMessage}. Retries left: ${retries}`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return retryWithBackoff(fn, fallbackValue, retries - 1, delay * 2);
        }

        if (isRateLimit) {
            console.warn("[OpenAI] Rate limit exhausted. Using Mock Data fallback.");
            return fallbackValue;
        }

        console.error("Non-retriable OpenAI Error:", errorMessage);
        throw error; // Re-throw actual developer errors (invalid API key, bad requests)
    }
};

export const summarizeText = async (text) => {
    return retryWithBackoff(async () => {
        const prompt = `Summarize the following text concisely, highlighting key points:\n\n${text}`;
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }]
        });
        return response.choices[0]?.message?.content || "";
    }, "This is a simulated summary because the AI service is currently unavailable. \n\nKey points:\n- The AI rate limit was exceeded.\n- This mock data ensures the app remains usable.\n- Please try again later for a real summary.");
};

export const explainConcept = async (concept, context = "") => {
    return retryWithBackoff(async () => {
        const prompt = `Explain the concept "${concept}" simply and clearly${context ? ` in the context of: ${context}` : ''}.`;
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }]
        });
        return response.choices[0]?.message?.content || "";
    }, `The concept "${concept}" is interesting! Unfortunately, the AI is taking a break (Rate Limit). \n\nSimulated Explanation: It involves key principles of connection and data flow.`);
};

export const generateFlashcards = async (text) => {
    return retryWithBackoff(async () => {
        const prompt = `Create 5 flashcards from the following text. You MUST return a JSON object with a single "cards" key containing an array of objects: { "front": string, "back": string }.\n\nText: ${text}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a helpful study assistant. You output structured JSON data only. The root element must be a valid JSON object." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });
        
        const content = response.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(content);
        return parsed.cards || [];
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
        const prompt = `Generate ${numQuestions} multiple-choice questions from the text. You MUST return a JSON object with a single "questions" key containing an array of objects: { "question": string, "options": string[], "correctAnswer": string, "explanation": string }.\n\nText: ${text}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a helpful study assistant. You output structured JSON data only. The root element must be a valid JSON object." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });
        
        const content = response.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(content);
        return parsed.questions || [];
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
            explanation: "OpenAI quota resets dynamically. Please try again soon."
        }
    ]);
};

export const getInterviewResponse = async (history, message, role, difficulty, company = "", skills = []) => {
    return retryWithBackoff(async () => {
        const skillsStr = skills && skills.length > 0 ? `Skills to assess: ${skills.join(", ")}.` : "";
        const companyStr = company ? `Target Company: ${company}. (Adopt the interview style of this company if known).` : "";

        const systemInstruction = `You are an expert technical interviewer for the role of ${role}. Difficulty: ${difficulty}.
        ${companyStr}
        ${skillsStr}
        Conduct a technical interview. Ask questions one by one. 
        Start by introducing yourself and testing the candidate on the specified skills.
        Provide feedback if the user answers incorrectly. 
        Keep responses professional but encouraging.
        
        IMPORTANT: Format your responses using Markdown for better readability:
        - Use **bold** for emphasis and key terms.
        - Use bullet points for lists.
        - Use code blocks for code snippets.
        - Keep paragraphs short and readable.`;

        const messages = [
            { role: 'system', content: systemInstruction },
            ...history,
            { role: 'user', content: message }
        ];

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
            max_tokens: 500
        });

        return response.choices[0]?.message?.content || "";
    }, "I apologize, but I am currently experiencing high traffic (Rate Limit). Please wait a moment and try your answer again.");
};

export const generateTextGeneric = async (prompt, systemInstruction = "") => {
    return retryWithBackoff(async () => {
        const messages = [];
        if (systemInstruction) {
            messages.push({ role: "system", content: systemInstruction });
        }
        messages.push({ role: "user", content: prompt });

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages
        });
        return response.choices[0]?.message?.content || "";
    }, "AI service is currently unavailable. Please try again in a moment.");
};
