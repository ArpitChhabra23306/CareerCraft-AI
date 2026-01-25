import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    fileUrl: { type: String, required: true }, // Cloudinary URL
    publicId: { type: String }, // Cloudinary public_id for deletion
    fileSize: { type: Number },
    summary: { type: String },
    uploadDate: { type: Date, default: Date.now }
});

export default mongoose.model('Document', DocumentSchema);
