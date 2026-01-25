import api from './api';

// All AI calls now go through the secure backend - no API key exposed!

const aiService = {
    // Generic AI text generation via backend
    generateText: async (prompt, systemInstruction = "") => {
        try {
            const res = await api.post('/ai/generate', { prompt, systemInstruction });
            return res.data.text;
        } catch (err) {
            console.error("AI Generate Error:", err);
            return null;
        }
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

    generateQuiz: async (documentId, numQuestions = 5, documentContent = "") => {
        // If we have document content, generate quiz via backend with AI
        if (documentContent) {
            const prompt = `Generate ${numQuestions} multiple choice questions based on the following text. 
            Return ONLY a JSON array of objects with fields: question, options (array of 4 strings), correctAnswer (exact string matching one of the options).
            Do not use markdown formatting.
            
            Text: ${documentContent.substring(0, 5000)}...`;

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

        // Fallback: Use server's quiz generation endpoint
        console.log("Using Server AI for Quiz Generation");
        try {
            const res = await api.post('/ai/quiz', { documentId, numQuestions });
            return res.data;
        } catch (serverError) {
            console.error("Server Fallback Failed:", serverError);
            return [
                {
                    question: "AI Service Temporarily Unavailable",
                    options: ["Check Internet", "Check API Key", "Retry Later", "All of the above"],
                    correctAnswer: "All of the above",
                    explanation: "Please try again in a moment."
                }
            ];
        }
    },

    generateFlashcards: async (documentId, documentContent = "") => {
        if (documentContent) {
            const prompt = `Create 5 flashcards from this text.
            Return ONLY a JSON array of objects with fields: front, back.
            Do not use markdown formatting.
            
            Text: ${documentContent.substring(0, 5000)}...`;

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
        if (documentContent) {
            const prompt = `Based on the context provided, answer the user's question.
             Context: ${documentContent.substring(0, 4000)}...
             
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
            return { answer: "I'm sorry, I cannot connect to the AI right now. Please try again in a moment." };
        }
    }
};

export default aiService;
