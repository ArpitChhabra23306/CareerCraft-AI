
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });

async function listModels() {
    // The SDK automatically uses GEMINI_API_KEY if present.
    // We can just initialize it empty for simpler code if we wanted, 
    // but demonstrating the var read for debug:
    const key = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey: key });
    // Or just: const ai = new GoogleGenAI({});

    console.log(`Listing Models with @google/genai...`);

    try {
        const response = await ai.models.list();
        // Note: verify strictly if ai.models.list() exists in this SDK version or if it's different.
        // The user example didn't show list models.
        // Often it's ai.models.list() or similar. 
        // If not, we fall back to REST. But let's try assuming standard SDK shape or check documentation behavior via trial.
        // Actually, looking at the patterns, it might not have a list method exposed easily in the simplified client.
        // We can stick to the REST fetch in list_models.js but just ensure headers are right?
        // No, the previous REST call failed with "API Key not valid" which was true.
        // Now valid key, REST should work!

        // Let's revert to REST but with valid key process.env usage which I already fixed in step 40?
        // Wait, step 40 fixed it to use process.env.
        // If the key IS valid now, the OLD list_models.js (REST based) SHOULD work.
        // Let's try running the EXISTING list_models.js again.
    } catch (e) {
        console.error("Error:", e);
    }
}

