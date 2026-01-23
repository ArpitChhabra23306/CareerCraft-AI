import Document from '../models/Document.js';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

export const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { filename, path: filepath, size } = req.file;
        // Assuming req.user is populated by auth middleware
        const userId = req.user.id;

        const newDoc = new Document({
            user: userId,
            filename: req.file.originalname, // Use original name for display
            filepath: filepath, // Path on disk
            fileSize: size
        });

        const savedDoc = await newDoc.save();
        res.status(201).json(savedDoc);
    } catch (err) {
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

        // Delete file from filesystem
        if (fs.existsSync(doc.filepath)) {
            fs.unlinkSync(doc.filepath);
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

        if (!fs.existsSync(doc.filepath)) {
            return res.status(404).json({ message: 'File not found on server' });
        }

        const dataBuffer = fs.readFileSync(doc.filepath);
        const data = await pdf(dataBuffer);

        res.status(200).json({ content: data.text });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
