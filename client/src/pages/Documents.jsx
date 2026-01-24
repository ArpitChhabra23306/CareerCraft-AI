import { useEffect, useState } from 'react';
import api from '../utils/api';
import { FileText, Plus, Trash2, ExternalLink, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

const Documents = () => {
    const [docs, setDocs] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState(null);

    const fetchDocs = async () => {
        try {
            const res = await api.get('/docs');
            setDocs(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchDocs();
    }, []);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post('/docs/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFile(null);
            fetchDocs();
        } catch (err) {
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this document?')) return;
        try {
            await api.delete(`/docs/${id}`);
            setDocs(docs.filter(d => d._id !== id));
        } catch (err) {
            alert('Delete failed');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">My Documents</h1>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Upload New Document</h2>
                <form onSubmit={handleUpload} className="flex gap-4 items-center">
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    <button
                        type="submit"
                        disabled={!file || uploading}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-2"
                    >
                        {uploading ? 'Uploading...' : <><Plus size={18} /> Upload PDF</>}
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {docs.map((doc) => (
                    <div key={doc._id} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
                        <div className="flex items-start justify-between mb-3">
                            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                                <FileText size={24} />
                            </div>
                            <button onClick={() => handleDelete(doc._id)} className="text-gray-400 hover:text-red-500">
                                <Trash2 size={18} />
                            </button>
                        </div>
                        <h3 className="font-semibold text-gray-800 dark:text-white truncate mb-1" title={doc.filename}>{doc.filename}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB • {new Date(doc.uploadDate).toLocaleDateString()}</p>

                        <div className="flex gap-2">
                            <Link
                                to={`/docs/${doc._id}`}
                                className="flex-1 text-center bg-indigo-50 text-indigo-700 py-2 rounded-lg font-medium hover:bg-indigo-100 transition flex justify-center items-center gap-2"
                            >
                                <MessageSquare size={16} /> Study
                            </Link>
                        </div>
                    </div>
                ))}
                {docs.length === 0 && (
                    <p className="col-span-full text-center text-gray-500 py-10">No documents yet. Upload one to get started!</p>
                )}
            </div>
        </div>
    );
};

export default Documents;
