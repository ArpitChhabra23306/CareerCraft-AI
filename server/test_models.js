
import { GoogleGenerativeAI } from '@google/generative-ai';

const key = "AIzaSyDOqIQj8-i6bXfiA2NY0J8Xy_ZDlb6TTvs";
const genAI = new GoogleGenerativeAI(key);

const models = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
    "gemini-1.5-pro-latest",
    "gemini-1.5-pro-001",
    "gemini-1.0-pro",
    "gemini-pro",
    "gemini-2.0-flash-exp"
];

async function testAll() {
    console.log("Testing models...");
    for (const modelName of models) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            await model.generateContent("Test");
            console.log(`[SUCCESS] ${modelName} is WORKING!`);
        } catch (e) {
            let status = "UNKNOWN";
            if (e.message.includes("404")) status = "404 NOT FOUND";
            else if (e.message.includes("429")) status = "429 RATE LIMIT";
            else if (e.message.includes("403")) status = "403 ACCESS DENIED";
            else status = e.message.substring(0, 50);

            console.log(`[FAILED] ${modelName}: ${status}`);
        }
    }
}

testAll();
