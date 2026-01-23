
import { GoogleGenerativeAI } from '@google/generative-ai';

// Method 1: Direct Key Test with 1.5 Flash
const key = "AIzaSyDOqIQj8-i6bXfiA2NY0J8Xy_ZDlb6TTvs";

async function testKey() {
    try {
        console.log("Testing Key with gemini-1.5-flash...");
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent("Reply with 'MODEL_WORKING'");
        const response = await result.response;
        console.log("Response:", response.text());
    } catch (error) {
        console.error("Key Error:", error.message);
    }
}

testKey();
