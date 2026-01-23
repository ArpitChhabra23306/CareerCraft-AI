import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function testGen() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GENAI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        console.log("Testing generation with gemini-2.0-flash...");
        const result = await model.generateContent("Say hello");
        const response = await result.response;
        console.log("Response:", response.text());
    } catch (error) {
        console.error("Gemini Gen Error:", error);
    }
}

testGen();
