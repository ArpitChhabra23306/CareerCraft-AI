import { useEffect, useState } from 'react';
import api from '../utils/api';
import { FileText, Plus, Trash2, MessageSquare, Upload, File } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Documents = () => {
    const [docs, setDocs] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);

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

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">My Documents</h1>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800"
            >
                <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                    <Upload className="text-blue-500" size={20} />
                    Upload New Document
                </h2>
                <form onSubmit={handleUpload} className="space-y-4">
                    {/* Drag and Drop Zone */}
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragActive
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                            }`}
                    >
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="space-y-3">
                            <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center ${file ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                                }`}>
                                {file ? <File size={24} /> : <Upload size={24} />}
                            </div>
                            {file ? (
                                <div>
                                    <p className="font-medium text-gray-800 dark:text-white">{file.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <p className="font-medium text-gray-700 dark:text-gray-300">
                                        Drop your PDF here or <span className="text-indigo-600 dark:text-indigo-400">browse</span>
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Supports PDF files up to 10MB
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!file || uploading}
                        className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 font-medium shadow-lg shadow-indigo-500/25"
                    >
                        {uploading ? (
                            <>
                                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Plus size={18} />
                                Upload PDF
                            </>
                        )}
                    </button>
                </form>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {docs.map((doc, idx) => (
                    <motion.div
                        key={doc._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-all card-hover group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl group-hover:scale-110 transition-transform">
                                <FileText size={24} />
                            </div>
                            <button
                                onClick={() => handleDelete(doc._id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                        <h3 className="font-semibold text-gray-800 dark:text-white truncate mb-1" title={doc.filename}>
                            {doc.filename}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            {(doc.fileSize / 1024 / 1024).toFixed(2)} MB • {new Date(doc.uploadDate).toLocaleDateString()}
                        </p>

                        <Link
                            to={`/docs/${doc._id}`}
                            className="w-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 py-2.5 rounded-xl font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex justify-center items-center gap-2"
                        >
                            <MessageSquare size={16} />
                            Study
                        </Link>
                    </motion.div>
                ))}
            </div>

            {docs.length === 0 && (
                <div className="text-center py-16 text-gray-400 dark:text-gray-500">
                    <FileText size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No documents yet. Upload one to get started!</p>
                </div>
            )}
        </div>
    );
};

export default Documents;
