import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import ChatInterface from '../components/ChatInterface';

const DocumentView = () => {
    const { id } = useParams();
    const [doc, setDoc] = useState(null);

    useEffect(() => {
        const fetchDoc = async () => {
            try {
                const res = await api.get('/docs'); // Ideally get by ID endpoint, but using list filter for now to save backend work or I can add getById?
                // Wait, document controller has deleteDocument and getDocuments (list), but NO getDocumentById.
                // I should stick to list and find, or add getById to backend.
                // For efficiency, I'll just filter client side or quick add backend getById.
                // Actually, the `chatWithDocument` backend doesn't need getById return, it finds internally.
                // But for frontend to get filepath, I need it.
                // I'll filter from list for now (laziness efficient).
                const found = res.data.find(d => d._id === id);
                setDoc(found);
            } catch (err) {
                console.error(err);
            }
        };
        fetchDoc();
    }, [id]);

    if (!doc) return <div className="p-8">Loading document...</div>;

    // Construct file URL
    // filepath is absolute on server disk? 
    // DocumentSchema: filepath: c:\Users\...\uploads\timestamp-name.pdf
    // I need to convert to static URL: http://localhost:5000/uploads/filename
    // The 'filepath' saved by multer is full path. I need to extracting filename.
    // Actually, I saved 'filename' as original name!
    // Wait, `req.file.path` is full path. I should have saved relative path or just filename.
    // In `uploadDocument`:
    // filepath: req.file.path
    // If I serve `/uploads`, I need to know the file name in `uploads` folder.
    // `req.file.filename` is the unique name. `req.file.originalname` is valid.
    // Multer `filename` property of `req.file` holds the unique name on disk.
    // I DID NOT SAVE `req.file.filename` in `Document` model explicitly?
    // Let's check `documentController.js`.
    /*
      const { filename, path: filepath, size } = req.file;
      const newDoc = new Document({
        filename: req.file.originalname, 
        filepath: filepath, 
      });
    */
    // I saved `filepath` which is full path.
    // I need to extract the basename from filepath on client, or update backend to send URL.
    // Since I can't easily change backend now without restarting thought process, I'll extract basename here.
    // The static serve is `app.use('/uploads', express.static('uploads'))`.
    // So `http://localhost:5000/uploads/<basename>` should work.
    // `filepath` on windows is `uploads\filename.pdf` (relative) or absolute? 
    // Multer diskStorage destination is `uploads/`.
    // `req.file.path` is likely `uploads\filename.pdf` or `uploads/filename.pdf`.

    const getFileUrl = (path) => {
        // normalized extraction
        const parts = path.split(/[/\\]/);
        const filename = parts[parts.length - 1]; // unique filename
        return `http://localhost:5000/uploads/${filename}`;
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex gap-6">
            <div className="flex-1 bg-gray-100 rounded-xl overflow-hidden shadow-sm border border-gray-200">
                <iframe
                    src={getFileUrl(doc.filepath)}
                    className="w-full h-full"
                    title="PDF Viewer"
                />
            </div>

            <div className="w-1/3">
                <ChatInterface documentId={doc._id} />
            </div>
        </div>
    );
};

export default DocumentView;
