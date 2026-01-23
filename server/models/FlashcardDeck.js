import mongoose from 'mongoose';

const CardSchema = new mongoose.Schema({
    front: { type: String, required: true },
    back: { type: String, required: true },
    pinned: { type: Boolean, default: false }
});

const FlashcardDeckSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' }, // Optional link to source doc
    title: { type: String, required: true },
    cards: [CardSchema],
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('FlashcardDeck', FlashcardDeckSchema);
