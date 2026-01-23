
import api from './api';

// Initialize Direct Client-Side API Key
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const aiService = {
    isLocalAvailable: async () => {
        return window.ai !== undefined;
    },

    fetchDocumentContent: async (documentId) => {
        try {
            const res = await api.get(`/docs/${documentId}/content`);
            return res.data.content;
        } catch (err) {
            console.error("Failed to fetch doc content:", err);
            return null;
        }
    },

    // Helper: Call Google Directly via REST
    callGoogleDirectly: async (prompt, systemInstruction = "") => {
        if (!API_KEY) return null;
        console.log("Using Direct Google REST API (Client-Side)...");

        // Use gemini-2.5-flash as default stable model
        const model = "gemini-2.5-flash";

        const payload = {
            contents: [{
                parts: [{ text: systemInstruction + "\n\n" + prompt }]
            }]
        };

        console.log(`Trying model: ${model}...`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`Success with model: ${model}`);
                return data.candidates?.[0]?.content?.parts?.[0]?.text;
            } else {
                const errText = await response.text();
                console.warn(`Model ${model} failed:`, response.status, errText);
            }
        } catch (error) {
            console.error(`Fetch error for ${model}:`, error);
        }

        console.error("Direct call failed.");
        return null; // Fallback to server will happen in caller
    },

    generateText: async (prompt, systemInstruction = "") => {
        // 1. Try Local AI
        try {
            if (window.ai) {
                if (window.ai.languageModel) {
                    const session = await window.ai.languageModel.create({ systemPrompt: systemInstruction });
                    return await session.prompt(prompt);
                }
                if (window.ai.createTextSession) {
                    const session = await window.ai.createTextSession({ systemPrompt: systemInstruction });
                    const result = await session.prompt(prompt);
                    session.destroy();
                    return result;
                }
            }
        } catch (error) {
            console.warn("Local AI failed:", error);
        }

        // 2. Try Direct Google API (Client Side - Dependency Free)
        const directResult = await aiService.callGoogleDirectly(prompt, systemInstruction);
        if (directResult) return directResult;

        return null; // Fallback to server
    },

    generateQuiz: async (documentId, numQuestions = 5, documentContent = "") => {
        const content = documentContent || await aiService.fetchDocumentContent(documentId);

        if (content) {
            const prompt = `Generate ${numQuestions} multiple choice questions based on the following text. 
            Return ONLY a JSON array of objects with fields: question, options (array of 4 strings), correctAnswer (index 0-3).
            Do not use markdown formatting.
            
            Text: ${content.substring(0, 5000)}...`;

            const response = await aiService.generateText(prompt, "You are a helpful study assistant.");

            if (response) {
                try {
                    const jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
                    return JSON.parse(jsonStr);
                } catch (e) {
                    console.error("Failed to parse AI quiz:", e);
                }
            }
        }

        console.log("Using Server AI for Quiz Generation");
        try {
            const res = await api.post('/ai/quiz', { documentId, numQuestions });
            return res.data;
        } catch (serverError) {
            console.error("Server Fallback Failed:", serverError);
            // Final Client-Side Fallback
            return [
                {
                    question: "Note: AI Service Unavailable",
                    options: ["Check Internet", "Check API Key", "Retry Later", "All of the above"],
                    correctAnswer: "All of the above",
                    explanation: "We couldn't reach Google's AI (Quota Exceeded on Key). Using local backup."
                },
                {
                    question: "Which model is being used?",
                    options: ["Gemini 1.5", "Gemini 2.0", "Local Backup", "None"],
                    correctAnswer: "Local Backup",
                    explanation: "This is a placeholder quiz."
                }
            ];
        }
    },

    generateFlashcards: async (documentId, documentContent = "") => {
        const content = documentContent || await aiService.fetchDocumentContent(documentId);

        if (content) {
            const prompt = `Create 5 flashcards from this text.
            Return ONLY a JSON array of objects with fields: front, back.
             Do not use markdown formatting.
            
            Text: ${content.substring(0, 5000)}...`;

            const response = await aiService.generateText(prompt, "You are a helpful study assistant.");
            if (response) {
                try {
                    const jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
                    return JSON.parse(jsonStr);
                } catch (e) {
                    console.error("Failed to parse flashcards:", e);
                }
            }
        }

        console.log("Using Server AI for Flashcards");
        const res = await api.post('/ai/flashcards', { documentId });
        return res.data;
    },

    chat: async (documentId, question, documentContent = "") => {
        const content = documentContent || await aiService.fetchDocumentContent(documentId);

        if (content) {
            const prompt = `Based on the context provided, answer the user's question.
             Context: ${content.substring(0, 4000)}...
             
             Question: ${question}`;

            const response = await aiService.generateText(prompt, "You are a helpful tutor.");
            if (response) return { answer: response };
        }

        console.log("Using Server AI for Chat");
        try {
            const res = await api.post('/ai/chat', { documentId, question });
            return res.data;
        } catch (serverError) {
            console.error("Server Chat Fallback Failed:", serverError);
            return { answer: "I'm sorry, I cannot connect to the AI right now (Quota Exceeded). Please try again in 30 seconds." };
        }
    }
};

export default aiService;
