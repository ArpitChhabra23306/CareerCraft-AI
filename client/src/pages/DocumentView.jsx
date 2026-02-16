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
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#f0f0f0] dark:bg-[#1a1a1a] border border-[#e8e8e8] dark:border-[#222] flex items-center justify-center animate-pulse">
                        <Loader2 size={18} className="animate-spin text-[#888]" strokeWidth={1.5} />
                    </div>
                    <p className="text-[#999] text-[13px]">Loading document...</p>
                </div>
            </div>
        );
    }

    const getPdfViewerUrl = (url) => {
        return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex gap-4">
            <div className="flex-1 bg-[#fafafa] dark:bg-[#111] rounded-[20px] overflow-hidden border border-[#f0f0f0] dark:border-[#1a1a1a] relative">
                {pdfLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#fafafa] dark:bg-[#111] z-10">
                        <div className="flex flex-col items-center gap-3">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-2xl bg-[#f0f0f0] dark:bg-[#1a1a1a] border border-[#e8e8e8] dark:border-[#222] flex items-center justify-center">
                                    <FileText size={20} className="text-[#888]" strokeWidth={1.5} />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#111] dark:bg-[#eee] flex items-center justify-center">
                                    <Loader2 size={10} className="animate-spin text-white dark:text-[#111]" strokeWidth={2} />
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-[#111] dark:text-[#eee] font-medium text-[13px]">Loading PDF...</p>
                                <p className="text-[#999] text-[11px] mt-0.5">This may take a moment</p>
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
