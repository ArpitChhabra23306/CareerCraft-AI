import dotenv from 'dotenv';
import DocumentChunk from '../models/DocumentChunk.js';
import Document from '../models/Document.js';
dotenv.config();

const JINA_API_KEY = process.env.JINA_API_KEY;
const JINA_MODEL = 'jina-embeddings-v3';
const CHUNK_SIZE = 800;      // characters per chunk
const CHUNK_OVERLAP = 120;   // overlap between chunks for context continuity

/**
 * Split text into overlapping chunks at sentence boundaries.
 * Avoids cutting mid-sentence for better embedding quality.
 */
export const chunkText = (text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) => {
    if (!text || text.length === 0) return [];

    // Clean up the text: normalize whitespace
    const cleanText = text.replace(/\s+/g, ' ').trim();

    if (cleanText.length <= chunkSize) {
        return [cleanText];
    }

    const chunks = [];
    let start = 0;

    while (start < cleanText.length) {
        let end = Math.min(start + chunkSize, cleanText.length);

        // Try to break at a sentence boundary (., !, ?, or newline)
        if (end < cleanText.length) {
            const segment = cleanText.substring(start, end);
            const lastSentenceEnd = Math.max(
                segment.lastIndexOf('. '),
                segment.lastIndexOf('? '),
                segment.lastIndexOf('! '),
                segment.lastIndexOf('\n')
            );

            if (lastSentenceEnd > chunkSize * 0.3) {
                // Found a good break point past 30% of the chunk
                end = start + lastSentenceEnd + 1;
            }
        }

        chunks.push(cleanText.substring(start, end).trim());

        // Move start forward, with overlap
        start = end - overlap;

        // Prevent infinite loops on very small remaining text
        if (start >= cleanText.length - overlap) {
            if (end < cleanText.length) {
                chunks.push(cleanText.substring(end).trim());
            }
            break;
        }
    }

    return chunks.filter(c => c.length > 20); // Drop any tiny leftover fragments
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
                task: 'retrieval.passage' // Optimized for document chunks
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Jina API error (${response.status}): ${errorBody}`);
        }

        const data = await response.json();

        // Sort by index to maintain order
        const sorted = data.data.sort((a, b) => a.index - b.index);
        allEmbeddings.push(...sorted.map(d => d.embedding));
    }

    return allEmbeddings;
};

/**
 * Generate a single embedding for a query string.
 * Uses 'retrieval.query' task for optimal query-vs-passage matching.
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
            task: 'retrieval.query' // Optimized for search queries
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
 * Full ingestion pipeline: chunk a document, embed all chunks, store in MongoDB.
 * Returns the number of chunks created.
 */
export const ingestDocument = async (documentId) => {
    const doc = await Document.findById(documentId);
    if (!doc) throw new Error('Document not found');
    if (!doc.parsedText) throw new Error('Document has no parsed text. Open it first to trigger parsing.');

    // Clean up any existing chunks for this document (re-ingestion)
    await DocumentChunk.deleteMany({ document: documentId });

    // Step 1: Chunk the text
    const chunks = chunkText(doc.parsedText);
    if (chunks.length === 0) {
        throw new Error('Document text produced no valid chunks');
    }

    console.log(`[RAG] Chunked "${doc.filename}" into ${chunks.length} chunks`);

    // Step 2: Generate embeddings for all chunks
    const embeddings = await generateEmbeddings(chunks);
    console.log(`[RAG] Generated ${embeddings.length} embeddings (${embeddings[0]?.length}d)`);

    // Step 3: Store chunks + embeddings in MongoDB
    const chunkDocs = chunks.map((content, index) => ({
        document: documentId,
        chunkIndex: index,
        content: content,
        embedding: embeddings[index]
    }));

    await DocumentChunk.insertMany(chunkDocs);

    // Step 4: Mark document as embedded
    doc.isEmbedded = true;
    doc.chunkCount = chunks.length;
    await doc.save();

    console.log(`[RAG] Ingestion complete for "${doc.filename}": ${chunks.length} chunks stored`);
    return chunks.length;
};

/**
 * Search for the most similar chunks to a query using MongoDB Atlas Vector Search.
 * Returns the top K most relevant text chunks.
 */
export const searchSimilarChunks = async (query, documentId, topK = 5) => {
    // Step 1: Embed the query
    const queryEmbedding = await generateQueryEmbedding(query);

    // Step 2: Run MongoDB Atlas Vector Search aggregation
    const results = await DocumentChunk.aggregate([
        {
            $vectorSearch: {
                index: 'vector_index',
                path: 'embedding',
                queryVector: queryEmbedding,
                numCandidates: topK * 10, // Search wider pool for better results
                limit: topK,
                filter: {
                    document: doc2ObjectId(documentId)
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

    return results;
};

/**
 * Helper: convert string ID to ObjectId for vector search filter.
 */
import mongoose from 'mongoose';
const doc2ObjectId = (id) => new mongoose.Types.ObjectId(id);
