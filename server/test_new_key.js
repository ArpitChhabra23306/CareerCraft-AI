
import { GoogleGenerativeAI } from '@google/generative-ai';

const key = "AIzaSyDOqIQj8-i6bXfiA2NY0J8Xy_ZDlb6TTvs";

async function testKey() {
    try {
        console.log("Testing Key:", key);
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        console.log("Generating content...");
        const result = await model.generateContent("Reply with 'KEY_WORKING'");
        const response = await result.response;
        console.log("Response:", response.text());
    } catch (error) {
        console.error("Key Error:", error.message);
        if (error.response) {
            console.error("Details:", JSON.stringify(error.response, null, 2));
        }
    }
}

testKey();
