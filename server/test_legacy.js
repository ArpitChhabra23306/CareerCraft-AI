
import { GoogleGenerativeAI } from '@google/generative-ai';

const key = "AIzaSyDOqIQj8-i6bXfiA2NY0J8Xy_ZDlb6TTvs";
const genAI = new GoogleGenerativeAI(key);

const models = [
    "gemini-pro",
    "gemini-1.0-pro",
    "gemini-1.5-pro",
    "gemini-1.5-flash-latest"
];

async function testModels() {
    console.log("Testing Legacy Models...");
    for (const modelName of models) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            console.log(`Trying ${modelName}...`);
            await model.generateContent("Test");
            console.log(`[SUCCESS] ${modelName} is WORKING!`);
            return; // Stop if one works
        } catch (e) {
            console.log(`[FAILED] ${modelName}: ${e.message.split('[')[0]}`);
        }
    }
    console.log("All tested models failed.");
}

testModels();
