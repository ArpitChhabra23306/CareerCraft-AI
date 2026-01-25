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

    // Use Google Docs Viewer to display PDF (Cloudinary raw files force download)
    const getPdfViewerUrl = (url) => {
        return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex gap-6">
            <div className="flex-1 bg-gray-100 rounded-xl overflow-hidden shadow-sm border border-gray-200">
                <iframe
                    src={getPdfViewerUrl(doc.fileUrl)}
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
