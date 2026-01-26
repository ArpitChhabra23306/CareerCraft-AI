import { useState, useRef, useEffect } from 'react';
import api from '../utils/api';
import aiService from '../utils/aiService';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ChatInterface = ({ documentId }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const endRef = useRef(null);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // Use aiService instead of direct API call
            const result = await aiService.chat(documentId, userMsg.content);
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
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 border-b border-indigo-100 dark:border-indigo-800 flex items-center gap-2">
                <Bot size={20} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">AI Study Assistant</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
                        <p>Ask anything about this document!</p>
                        <p className="text-sm mt-2 text-indigo-500 dark:text-indigo-400">"Summarize this PDF"</p>
                        <p className="text-sm text-indigo-500 dark:text-indigo-400">"Explain the main concept"</p>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'}`}>
                            {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                        </div>
                        <div className={`p-3 rounded-lg max-w-[80%] text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'}`}>
                            {msg.role === 'user' ? (
                                msg.content
                            ) : (
                                <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-2 prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-code:text-indigo-600 dark:prose-code:text-indigo-400 prose-code:bg-indigo-50 dark:prose-code:bg-indigo-900/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-800 prose-pre:text-gray-100">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                            <Bot size={16} />
                        </div>
                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <Loader2 size={16} className="animate-spin text-gray-500 dark:text-gray-400" />
                        </div>
                    </div>
                )}
                <div ref={endRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your question..."
                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder-gray-400"
                />
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default ChatInterface;
