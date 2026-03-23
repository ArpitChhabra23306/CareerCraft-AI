import mongoose from 'mongoose';

const DocumentChunkSchema = new mongoose.Schema({
    document: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: true,
        index: true
    },
    chunkIndex: {
        type: Number,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    embedding: {
        type: [Number],  // 1024-dimensional vector from Jina AI v3
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index for efficient lookups by document
DocumentChunkSchema.index({ document: 1, chunkIndex: 1 });

export default mongoose.model('DocumentChunk', DocumentChunkSchema);
