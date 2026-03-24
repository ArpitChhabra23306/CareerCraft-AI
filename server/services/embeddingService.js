import dotenv from 'dotenv';
import DocumentChunk from '../models/DocumentChunk.js';
import Document from '../models/Document.js';
import mongoose from 'mongoose';
dotenv.config();

const JINA_API_KEY = process.env.JINA_API_KEY;
const JINA_MODEL = 'jina-embeddings-v3';
const CHUNK_SIZE = 500;      // smaller chunks = more precise retrieval
const CHUNK_OVERLAP = 100;   // ~20% overlap for context continuity

/**
 * Recursive character text splitter — splits at the best boundary available.
 * Hierarchy: double-newline (paragraphs) → single newline → sentence end → word → hard cut.
 */
export const chunkText = (text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) => {
    if (!text || text.length === 0) return [];

    // Normalize whitespace but preserve paragraph breaks
    const cleanText = text
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+/g, ' ')          // collapse spaces/tabs
        .replace(/\n{3,}/g, '\n\n')       // normalize multiple newlines to double
        .trim();

    if (cleanText.length <= chunkSize) {
        return [cleanText];
    }

    // Separators in priority order (best → worst)
    const separators = ['\n\n', '\n', '. ', '? ', '! ', '; ', ', ', ' '];

    const chunks = [];
    let start = 0;

    while (start < cleanText.length) {
        // If remaining text fits in one chunk, take it all
        if (start + chunkSize >= cleanText.length) {
            const remaining = cleanText.substring(start).trim();
            if (remaining.length > 30) chunks.push(remaining);
            break;
        }

        let end = start + chunkSize;
        let bestBreak = -1;

        // Try each separator in priority order
        for (const sep of separators) {
            const segment = cleanText.substring(start, end);
            const lastIdx = segment.lastIndexOf(sep);

            // Only accept if break point is past 40% of chunk (avoid tiny first half)
            if (lastIdx > chunkSize * 0.4) {
                bestBreak = start + lastIdx + sep.length;
                break;
            }
        }

        // If no good break found, fall back to hard cut at chunkSize
        if (bestBreak === -1) {
            bestBreak = end;
        }

        const chunk = cleanText.substring(start, bestBreak).trim();
        if (chunk.length > 30) {
            chunks.push(chunk);
        }

        // Advance with overlap
        start = bestBreak - overlap;

        // Safety: ensure forward progress
        if (start <= (chunks.length > 0 ? (bestBreak - overlap) : 0)) {
            start = bestBreak;
        }
    }

    return chunks;
};

/**
 * Generate embeddings for an array of texts using Jina AI v3.
 * Batches up to 32 texts per request for efficiency.
 */
export const generateEmbeddings = async (texts) => {
    if (!JINA_API_KEY) {
        throw new Error('JINA_API_KEY is not configured');
    }

    const BATCH_SIZE = 32;
    const allEmbeddings = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE);

        const response = await fetch('https://api.jina.ai/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JINA_API_KEY}`
            },
            body: JSON.stringify({
                model: JINA_MODEL,
                input: batch,
                task: 'retrieval.passage'
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Jina API error (${response.status}): ${errorBody}`);
        }

        const data = await response.json();
        const sorted = data.data.sort((a, b) => a.index - b.index);
        allEmbeddings.push(...sorted.map(d => d.embedding));
    }

    return allEmbeddings;
};

/**
 * Generate a single embedding for a query string.
 * Uses 'retrieval.query' task for optimal asymmetric matching.
 */
export const generateQueryEmbedding = async (queryText) => {
    if (!JINA_API_KEY) {
        throw new Error('JINA_API_KEY is not configured');
    }

    const response = await fetch('https://api.jina.ai/v1/embeddings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${JINA_API_KEY}`
        },
        body: JSON.stringify({
            model: JINA_MODEL,
            input: [queryText],
            task: 'retrieval.query'
        })
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Jina API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
};

/**
 * Full ingestion pipeline: chunk → embed → store in MongoDB.
 */
export const ingestDocument = async (documentId) => {
    const doc = await Document.findById(documentId);
    if (!doc) throw new Error('Document not found');
    if (!doc.parsedText) throw new Error('Document has no parsed text. Open it first to trigger parsing.');

    // Clean up any existing chunks (re-ingestion)
    await DocumentChunk.deleteMany({ document: documentId });

    // Step 1: Chunk
    const chunks = chunkText(doc.parsedText);
    if (chunks.length === 0) {
        throw new Error('Document text produced no valid chunks');
    }

    console.log(`[RAG] Chunked "${doc.filename}" into ${chunks.length} chunks`);

    // Step 2: Embed all chunks
    const embeddings = await generateEmbeddings(chunks);
    console.log(`[RAG] Generated ${embeddings.length} embeddings (${embeddings[0]?.length}d)`);

    // Step 3: Store in MongoDB
    const chunkDocs = chunks.map((content, index) => ({
        document: new mongoose.Types.ObjectId(documentId),
        chunkIndex: index,
        content: content,
        embedding: embeddings[index]
    }));

    await DocumentChunk.insertMany(chunkDocs);

    // Step 4: Mark document as embedded
    doc.isEmbedded = true;
    doc.chunkCount = chunks.length;
    await doc.save();

    console.log(`[RAG] Ingestion complete: ${chunks.length} chunks stored`);
    return chunks.length;
};

/**
 * Search for the most relevant chunks using MongoDB Atlas Vector Search.
 */
export const searchSimilarChunks = async (query, documentId, topK = 5) => {
    // Step 1: Embed the query
    const queryEmbedding = await generateQueryEmbedding(query);

    // Step 2: MongoDB Atlas $vectorSearch aggregation
    const results = await DocumentChunk.aggregate([
        {
            $vectorSearch: {
                index: 'vector_index',
                path: 'embedding',
                queryVector: queryEmbedding,
                numCandidates: topK * 20,
                limit: topK,
                filter: {
                    document: new mongoose.Types.ObjectId(documentId)
                }
            }
        },
        {
            $project: {
                content: 1,
                chunkIndex: 1,
                score: { $meta: 'vectorSearchScore' }
            }
        }
    ]);

    console.log(`[RAG] Vector search returned ${results.length} chunks`);
    return results;
};
