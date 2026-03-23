import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const MODEL = 'llama-3.3-70b-versatile';

/**
 * Generate a RAG-augmented answer using Groq (Llama 3.3 70B).
 * Takes the user's question and relevant document chunks as context.
 */
export const generateRAGResponse = async (question, contextChunks, docTitle = '') => {
    // Build the context block from retrieved chunks
    const contextText = contextChunks
        .map((chunk, i) => `[Section ${i + 1}]\n${chunk.content}`)
        .join('\n\n');

    const systemPrompt = `You are an intelligent study assistant for the document "${docTitle}".
Your job is to answer the user's question using ONLY the provided context sections from the document.

Rules:
- Answer accurately based on the context provided.
- If the context doesn't contain enough information to answer, say so clearly.
- Use clear formatting: bullet points, bold for key terms, and short paragraphs.
- Do NOT make up information that isn't in the context.
- Keep your answer concise but thorough.`;

    const userPrompt = `**Context from document:**
${contextText}

**Question:** ${question}

Answer the question using only the context above.`;

    try {
        const completion = await groq.chat.completions.create({
            model: MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,     // Low temperature for factual accuracy
            max_tokens: 1024,
            top_p: 0.9
        });

        return {
            answer: completion.choices[0]?.message?.content || 'No answer generated.',
            model: MODEL,
            usage: completion.usage
        };
    } catch (error) {
        // Handle rate limits gracefully
        if (error.status === 429) {
            console.warn('[Groq] Rate limit hit, retrying after delay...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            return generateRAGResponse(question, contextChunks, docTitle);
        }
        console.error('[Groq] Error:', error.message);
        throw error;
    }
};
