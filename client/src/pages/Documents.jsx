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
        <div className="space-y-6">
            <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold text-[#0F1115] dark:text-[#F5F2EA] tracking-[-0.03em]"
            >
                My Documents
            </motion.h1>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-[20px] bg-[#F2EEE4] dark:bg-[#0F1115] border border-[#E3DAC6] dark:border-[#2A2F3A]"
            >
                <h2 className="text-[15px] font-semibold mb-4 text-[#0F1115] dark:text-[#F5F2EA] flex items-center gap-2">
                    <Upload size={16} strokeWidth={1.5} className="text-[#7C7365]" />
                    Upload New Document
                </h2>
                <form onSubmit={handleUpload} className="space-y-4">
                    {/* Drag and Drop Zone */}
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-[16px] p-8 text-center transition-all duration-300 ${dragActive
                            ? 'border-[#0F1115] dark:border-[#F5F2EA] bg-[#EEE7D8] dark:bg-[#1F2430]'
                            : 'border-[#D6CCB5] dark:border-[#2A2F3A] hover:border-[#B8B1A3] dark:hover:border-[#444]'
                            }`}
                    >
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="space-y-3">
                            <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center border transition-all duration-300 ${file
                                ? 'bg-[#0F1115] dark:bg-[#F5F2EA] border-[#0F1115] dark:border-[#F5F2EA] text-white dark:text-[#0F1115]'
                                : 'bg-[#E3DAC6] dark:bg-[#2A2F3A] border-[#D6CCB5] dark:border-[#2A2F3A] text-[#7C7365]'
                                }`}>
                                {file ? <File size={18} strokeWidth={1.5} /> : <Upload size={18} strokeWidth={1.5} />}
                            </div>
                            {file ? (
                                <div>
                                    <p className="font-medium text-[#0F1115] dark:text-[#F5F2EA] text-[14px]">{file.name}</p>
                                    <p className="text-[12px] text-[#8D8474] mt-0.5">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <p className="font-medium text-[#0F1115] dark:text-[#F5F2EA] text-[14px]">
                                        Drop your PDF here or <span className="underline underline-offset-2">browse</span>
                                    </p>
                                    <p className="text-[12px] text-[#8D8474] mt-0.5">
                                        Supports PDF files up to 10MB
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <motion.button
                        type="submit"
                        disabled={!file || uploading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full md:w-auto px-6 py-3 bg-[#0F1115] dark:bg-[#F5F2EA] text-white dark:text-[#0F1115] rounded-xl text-[13px] font-semibold disabled:opacity-40 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {uploading ? (
                            <>
                                <span className="animate-spin h-3.5 w-3.5 border-2 border-white dark:border-[#0F1115] border-t-transparent rounded-full"></span>
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Plus size={16} strokeWidth={1.5} />
                                Upload PDF
                            </>
                        )}
                    </motion.button>
                </form>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {docs.map((doc, idx) => (
                    <motion.div
                        key={doc._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        className="p-6 rounded-[20px] bg-[#F2EEE4] dark:bg-[#0F1115] border border-[#E3DAC6] dark:border-[#2A2F3A] hover:bg-[#F5F2EA] dark:hover:bg-[#1F2430] hover:shadow-[0_20px_60px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)] hover:border-[#D6CCB5] dark:hover:border-[#2A2F3A] transition-all duration-500 group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#E3DAC6] dark:bg-[#2A2F3A] border border-[#D6CCB5] dark:border-[#2A2F3A] flex items-center justify-center group-hover:bg-[#0F1115] dark:group-hover:bg-[#F5F2EA] group-hover:border-[#0F1115] dark:group-hover:border-[#F5F2EA] transition-all duration-500">
                                <FileText size={18} strokeWidth={1.5} className="text-[#7C7365] group-hover:text-white dark:group-hover:text-[#0F1115] transition-colors duration-500" />
                            </div>
                            <button
                                onClick={() => handleDelete(doc._id)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#B8B1A3] dark:text-[#8D8474] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all duration-300 opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={15} strokeWidth={1.5} />
                            </button>
                        </div>
                        <h3 className="font-semibold text-[#0F1115] dark:text-[#F5F2EA] text-[14px] truncate mb-1" title={doc.filename}>
                            {doc.filename}
                        </h3>
                        <p className="text-[12px] text-[#8D8474] mb-4">
                            {(doc.fileSize / 1024 / 1024).toFixed(2)} MB • {new Date(doc.uploadDate).toLocaleDateString()}
                        </p>

                        <Link
                            to={`/docs/${doc._id}`}
                            className="w-full bg-[#E3DAC6] dark:bg-[#2A2F3A] text-[#0F1115] dark:text-[#F5F2EA] py-2.5 rounded-xl text-[13px] font-medium hover:bg-[#0F1115] dark:hover:bg-[#F5F2EA] hover:text-white dark:hover:text-[#0F1115] transition-all duration-500 flex justify-center items-center gap-2"
                        >
                            <MessageSquare size={14} strokeWidth={1.5} />
                            Study
                        </Link>
                    </motion.div>
                ))}
            </div>

            {docs.length === 0 && (
                <div className="text-center py-20">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E3DAC6] dark:bg-[#2A2F3A] border border-[#D6CCB5] dark:border-[#2A2F3A] flex items-center justify-center mb-4">
                        <FileText size={24} className="text-[#7C7365]" strokeWidth={1.5} />
                    </div>
                    <p className="text-[#8D8474] text-[14px]">No documents yet. Upload one to get started!</p>
                </div>
            )}
        </div>
    );
};

export default Documents;
