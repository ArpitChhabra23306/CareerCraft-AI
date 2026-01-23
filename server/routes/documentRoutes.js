import express from 'express';
import { uploadDocument, getDocuments, deleteDocument, getDocumentContent } from '../controllers/documentController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/upload', verifyToken, upload.single('file'), uploadDocument);
router.get('/', verifyToken, getDocuments);
router.get('/:id/content', verifyToken, getDocumentContent);
router.delete('/:id', verifyToken, deleteDocument);

export default router;
