import Document from '../models/Document.js';
import cloudinary from '../config/cloudinary.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

export const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const userId = req.user.id;

        // Cloudinary returns path (URL) and filename in req.file
        const newDoc = new Document({
            user: userId,
            filename: req.file.originalname,
            fileUrl: req.file.path, // Cloudinary URL
            publicId: req.file.filename, // Cloudinary public_id
            fileSize: req.file.size
        });

        const savedDoc = await newDoc.save();
        res.status(201).json(savedDoc);
    } catch (err) {
        console.error('Upload Error:', err);
        res.status(500).json({ error: err.message });
    }
};

export const getDocuments = async (req, res) => {
    try {
        const userId = req.user.id;
        const docs = await Document.find({ user: userId }).sort({ uploadDate: -1 });
        res.status(200).json(docs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await Document.findById(id);

        if (!doc) return res.status(404).json({ message: 'Document not found' });
        if (doc.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Delete file from Cloudinary
        if (doc.publicId) {
            try {
                await cloudinary.uploader.destroy(doc.publicId, { resource_type: 'raw' });
            } catch (cloudErr) {
                console.warn('Cloudinary deletion warning:', cloudErr.message);
            }
        }

        await Document.findByIdAndDelete(id);
        res.status(200).json({ message: 'Document deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getDocumentContent = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await Document.findById(id);

        if (!doc) return res.status(404).json({ message: 'Document not found' });
        if (doc.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Fetch PDF from Cloudinary URL
        const response = await fetch(doc.fileUrl);
        if (!response.ok) {
            return res.status(404).json({ message: 'File not found on cloud storage' });
        }

        const arrayBuffer = await response.arrayBuffer();
        const dataBuffer = Buffer.from(arrayBuffer);
        const data = await pdf(dataBuffer);

        res.status(200).json({ content: data.text });
    } catch (err) {
        console.error('Get Content Error:', err);
        res.status(500).json({ error: err.message });
    }
};
