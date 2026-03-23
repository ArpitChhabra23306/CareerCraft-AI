import { useState, useRef, useEffect } from 'react';
import aiService from '../utils/aiService';
import { Send, Bot, User, Loader2, Zap, Database } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ChatInterface = ({ documentId, isEmbedded: initialEmbedded = false }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [useRAG, setUseRAG] = useState(false);
    const [isEmbedded, setIsEmbedded] = useState(initialEmbedded);
    const [embedding, setEmbedding] = useState(false);
    const endRef = useRef(null);

    const handleEmbed = async () => {
        setEmbedding(true);
        try {
            const result = await aiService.embedDocument(documentId);
            setIsEmbedded(true);
            setUseRAG(true);
            setMessages(prev => [...prev, {
                role: 'model',
                content: `Document embedded successfully into ${result.chunkCount} searchable chunks. RAG mode is now active — your questions will use semantic search for more precise answers.`
            }]);
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to embed document.';
            setMessages(prev => [...prev, { role: 'model', content: `Embedding failed: ${errorMsg}` }]);
        } finally {
            setEmbedding(false);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const result = await aiService.chat(documentId, userMsg.content, useRAG);
            setMessages(prev => [...prev, { role: 'model', content: result.answer }]);
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Error getting response.';
            setMessages(prev => [...prev, { role: 'model', content: errorMsg }]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex flex-col h-full rounded-[20px] bg-[#F2EEE4] dark:bg-[#0F1115] border border-[#E3DAC6] dark:border-[#2A2F3A] overflow-hidden">
            {/* Header with RAG controls */}
            <div className="p-4 border-b border-[#E3DAC6] dark:border-[#2A2F3A]">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#0F1115] dark:bg-[#F5F2EA] flex items-center justify-center">
                            <Bot size={14} className="text-white dark:text-[#0F1115]" strokeWidth={1.5} />
                        </div>
                        <h3 className="font-semibold text-[#0F1115] dark:text-[#F5F2EA] text-[13px]">AI Study Assistant</h3>
                    </div>
                </div>

                {/* RAG Controls Row */}
                <div className="flex items-center justify-between gap-2">
                    {/* RAG Toggle */}
                    <button
                        onClick={() => {
                            if (!isEmbedded && !useRAG) {
                                handleEmbed();
                            } else {
                                setUseRAG(!useRAG);
                            }
                        }}
                        disabled={embedding}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-300 ${useRAG && isEmbedded
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-[#E3DAC6] dark:bg-[#2A2F3A] text-[#8D8474] border border-transparent hover:border-[#D6CCB5] dark:hover:border-[#3A3F4A]'
                            }`}
                    >
                        <Zap size={12} strokeWidth={1.5} />
                        {embedding ? 'Embedding...' : useRAG ? 'RAG On' : 'RAG Off'}
                    </button>

                    {/* Embed Status */}
                    {isEmbedded ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            <Database size={10} strokeWidth={1.5} />
                            Indexed
                        </span>
                    ) : (
                        <button
                            onClick={handleEmbed}
                            disabled={embedding}
                            className="text-[10px] text-[#8D8474] hover:text-[#0F1115] dark:hover:text-[#F5F2EA] transition-colors font-medium"
                        >
                            {embedding ? 'Processing...' : 'Click to index'}
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                    <div className="text-center mt-10 space-y-2">
                        <p className="text-[#8D8474] text-[13px]">Ask anything about this document!</p>
                        <p className="text-[12px] text-[#A79F90] dark:text-[#A79F90]">"Summarize this PDF"</p>
                        <p className="text-[12px] text-[#A79F90] dark:text-[#A79F90]">"Explain the main concept"</p>
                        {!isEmbedded && (
                            <p className="text-[11px] text-[#A79F90] mt-4">
                                Tip: Enable <span className="font-semibold">RAG mode</span> for smarter answers on large documents
                            </p>
                        )}
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'user'
                            ? 'bg-[#0F1115] dark:bg-[#F5F2EA] text-white dark:text-[#0F1115]'
                            : 'bg-[#E3DAC6] dark:bg-[#2A2F3A] text-[#7C7365]'
                            }`}>
                            {msg.role === 'user' ? <User size={12} strokeWidth={1.5} /> : <Bot size={12} strokeWidth={1.5} />}
                        </div>
                        <div className={`p-3 rounded-[12px] max-w-[80%] text-[13px] ${msg.role === 'user'
                            ? 'bg-[#0F1115] dark:bg-[#F5F2EA] text-white dark:text-[#0F1115]'
                            : 'bg-[#E3DAC6] dark:bg-[#2A2F3A] text-[#0F1115] dark:text-[#F5F2EA]'
                            }`}>
                            {msg.role === 'user' ? (
                                msg.content
                            ) : (
                                <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-[#0F1115] dark:prose-headings:text-[#F5F2EA] prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-2 prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-strong:text-[#0F1115] dark:prose-strong:text-[#F5F2EA] prose-code:text-[#0F1115] dark:prose-code:text-[#F5F2EA] prose-code:bg-[#D6CCB5] dark:prose-code:bg-[#2A2F3A] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-[#0F1115] dark:prose-pre:bg-[#0F1115] prose-pre:text-[#F5F2EA]">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#E3DAC6] dark:bg-[#2A2F3A] text-[#7C7365] flex items-center justify-center shrink-0">
                            <Bot size={12} strokeWidth={1.5} />
                        </div>
                        <div className="p-3 bg-[#E3DAC6] dark:bg-[#2A2F3A] rounded-[12px]">
                            <Loader2 size={14} className="animate-spin text-[#7C7365]" />
                        </div>
                    </div>
                )}
                <div ref={endRef} />
            </div>

            <form onSubmit={sendMessage} className="p-3 border-t border-[#E3DAC6] dark:border-[#2A2F3A] flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={useRAG ? "Ask with RAG (semantic search)..." : "Type your question..."}
                    className="flex-1 border border-[#E3DAC6] dark:border-[#2A2F3A] rounded-xl px-4 py-2.5 focus:border-[#0F1115] dark:focus:border-[#F5F2EA] outline-none text-[13px] text-[#0F1115] dark:text-[#F5F2EA] bg-[#F5F2EA] dark:bg-[#0F1115] placeholder-[#A79F90] dark:placeholder-[#8D8474] transition-colors duration-300"
                />
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="w-10 h-10 rounded-xl bg-[#0F1115] dark:bg-[#F5F2EA] text-white dark:text-[#0F1115] flex items-center justify-center hover:bg-[#E6C55A] dark:hover:bg-[#B8B1A3] disabled:opacity-40 transition-all duration-300 shrink-0"
                >
                    <Send size={14} strokeWidth={1.5} />
                </button>
            </form>
        </div>
    );
};

export default ChatInterface;
