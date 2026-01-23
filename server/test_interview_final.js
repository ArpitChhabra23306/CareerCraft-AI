
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });

const ai = new GoogleGenAI({});

async function testInterview() {
    try {
        console.log("Testing Interview Start (Final Check)...");
        const role = "Software Engineer";
        const difficulty = "Easy";
        const message = "Start the interview.";

        const history = [];

        // Exact logic from geminiService.js
        console.log("Creating chat...");
        const chat = ai.chats.create({
            model: "gemini-2.5-flash",
            history: history,
            config: {
                systemInstruction: `You are an expert interviewer...`,
                maxOutputTokens: 500,
            }
        });

        console.log("Sending message with { message: ... } syntax...");
        const result = await chat.sendMessage({ message: message });
        console.log("Response:", result.text.substring(0, 100) + "...");

    } catch (error) {
        console.error("Interview Error:", error);
    }
}

testInterview();
