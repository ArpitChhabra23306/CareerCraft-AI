
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });

const ai = new GoogleGenAI({});

async function testInterview() {
    try {
        console.log("Testing Interview Start...");
        const role = "Software Engineer";
        const difficulty = "Easy";
        const message = "Start the interview.";

        const history = [];

        console.log("Creating chat...");
        const chat = ai.chats.create({
            model: "gemini-2.5-flash",
            messages: history, // SDK might use 'messages' or 'include_history' or just 'history'? 
            // Documentation for @google/genai says: ai.chats.create({ model, messages?, config? }) or similar?
            // Wait, previous code used 'history'. Let's see what breaks.
            history: history,
            config: {
                systemInstruction: `You are an expert interviewer for the role of ${role}. Difficulty: ${difficulty}.`,
                maxOutputTokens: 500,
            }
        });

        console.log("Sending message with object format...");
        // Variation 1: matching user example
        const result = await chat.sendMessage({ message: message });
        console.log("Response:", result.text);

    } catch (error) {
        console.error("Interview Error:", error);
        console.error("Details:", JSON.stringify(error, null, 2));
    }
}

testInterview();
