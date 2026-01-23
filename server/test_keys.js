
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });

const modelsToTest = [
    "gemini-3-flash",
    "gemini-3-flash-preview",
    "gemini-3-pro",
    "gemini-3-pro-preview",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash-exp" // control
];

async function main() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return console.error("Missing GEMINI_API_KEY");
    const ai = new GoogleGenAI({});

    for (const model of modelsToTest) {
        try {
            process.stdout.write(`Testing ${model}... `);
            const response = await ai.models.generateContent({
                model: model,
                contents: "Hi",
            });
            console.log(`SUCCESS`);
        } catch (error) {
            console.log(`FAIL (${error.status || error.code})`);
        }
    }
}

main();
