import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    console.log(`Listing Models...`);

    try {
        const response = await fetch(url);
        const data = await response.json();

        console.log("Status:", response.status);
        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => console.log(`- ${m.name}`));
        } else {
            console.log("Error Body:", JSON.stringify(data, null, 2));
        }

    } catch (e) {
        console.error("Network error:", e);
    }
}

listModels();
