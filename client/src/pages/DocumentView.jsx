import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import ChatInterface from '../components/ChatInterface';
import { FileText, Loader2 } from 'lucide-react';

const DocumentView = () => {
    const { id } = useParams();
    const [doc, setDoc] = useState(null);
    const [pdfLoading, setPdfLoading] = useState(true);

    useEffect(() => {
        const fetchDoc = async () => {
            try {
                const res = await api.get('/docs');
                const found = res.data.find(d => d._id === id);
                setDoc(found);
            } catch (err) {
                console.error(err);
            }
        };
        fetchDoc();
    }, [id]);

    if (!doc) {
        return (
            <div className="h-[calc(100vh-6rem)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={40} className="animate-spin text-indigo-600" />
                    <p className="text-gray-600 dark:text-gray-400">Loading document...</p>
                </div>
            </div>
        );
    }

    // Use Google Docs Viewer to display PDF (Cloudinary raw files force download)
    const getPdfViewerUrl = (url) => {
        return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex gap-6">
            <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 relative">
                {pdfLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                                <FileText size={48} className="text-indigo-500" />
                                <Loader2 size={24} className="animate-spin text-indigo-600 absolute -bottom-1 -right-1" />
                            </div>
                            <div className="text-center">
                                <p className="text-gray-700 dark:text-gray-300 font-medium">Loading PDF...</p>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">This may take a moment for large files</p>
                            </div>
                        </div>
                    </div>
                )}
                <iframe
                    src={getPdfViewerUrl(doc.fileUrl)}
                    className="w-full h-full"
                    title="PDF Viewer"
                    onLoad={() => setPdfLoading(false)}
                />
            </div>

            <div className="w-1/3">
                <ChatInterface documentId={doc._id} />
            </div>
        </div>
    );
};

export default DocumentView;
