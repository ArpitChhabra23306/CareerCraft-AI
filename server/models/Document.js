import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    filepath: { type: String, required: true }, // Or fileURL if using cloud
    fileSize: { type: Number },
    summary: { type: String },
    uploadDate: { type: Date, default: Date.now }
});

export default mongoose.model('Document', DocumentSchema);
