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
        <div className="flex flex-col h-full rounded-[20px] bg-[#fafafa] dark:bg-[#111] border border-[#f0f0f0] dark:border-[#1a1a1a] overflow-hidden">
            <div className="p-4 border-b border-[#f0f0f0] dark:border-[#1a1a1a] flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#111] dark:bg-[#eee] flex items-center justify-center">
                    <Bot size={14} className="text-white dark:text-[#111]" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-[#111] dark:text-[#eee] text-[13px]">AI Study Assistant</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                    <div className="text-center mt-10 space-y-2">
                        <p className="text-[#999] text-[13px]">Ask anything about this document!</p>
                        <p className="text-[12px] text-[#bbb] dark:text-[#666]">"Summarize this PDF"</p>
                        <p className="text-[12px] text-[#bbb] dark:text-[#666]">"Explain the main concept"</p>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'user'
                            ? 'bg-[#111] dark:bg-[#eee] text-white dark:text-[#111]'
                            : 'bg-[#f0f0f0] dark:bg-[#1a1a1a] text-[#888]'
                            }`}>
                            {msg.role === 'user' ? <User size={12} strokeWidth={1.5} /> : <Bot size={12} strokeWidth={1.5} />}
                        </div>
                        <div className={`p-3 rounded-[12px] max-w-[80%] text-[13px] ${msg.role === 'user'
                            ? 'bg-[#111] dark:bg-[#eee] text-white dark:text-[#111]'
                            : 'bg-[#f0f0f0] dark:bg-[#1a1a1a] text-[#111] dark:text-[#eee]'
                            }`}>
                            {msg.role === 'user' ? (
                                msg.content
                            ) : (
                                <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-[#111] dark:prose-headings:text-[#eee] prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-2 prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-strong:text-[#111] dark:prose-strong:text-[#eee] prose-code:text-[#111] dark:prose-code:text-[#eee] prose-code:bg-[#e8e8e8] dark:prose-code:bg-[#222] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-[#111] dark:prose-pre:bg-[#0a0a0a] prose-pre:text-[#eee]">
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
                        <div className="w-7 h-7 rounded-lg bg-[#f0f0f0] dark:bg-[#1a1a1a] text-[#888] flex items-center justify-center shrink-0">
                            <Bot size={12} strokeWidth={1.5} />
                        </div>
                        <div className="p-3 bg-[#f0f0f0] dark:bg-[#1a1a1a] rounded-[12px]">
                            <Loader2 size={14} className="animate-spin text-[#888]" />
                        </div>
                    </div>
                )}
                <div ref={endRef} />
            </div>

            <form onSubmit={sendMessage} className="p-3 border-t border-[#f0f0f0] dark:border-[#1a1a1a] flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your question..."
                    className="flex-1 border border-[#f0f0f0] dark:border-[#1a1a1a] rounded-xl px-4 py-2.5 focus:border-[#111] dark:focus:border-[#eee] outline-none text-[13px] text-[#111] dark:text-[#eee] bg-white dark:bg-[#0a0a0a] placeholder-[#bbb] dark:placeholder-[#555] transition-colors duration-300"
                />
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="w-10 h-10 rounded-xl bg-[#111] dark:bg-[#eee] text-white dark:text-[#111] flex items-center justify-center hover:bg-[#333] dark:hover:bg-[#ccc] disabled:opacity-40 transition-all duration-300 shrink-0"
                >
                    <Send size={14} strokeWidth={1.5} />
                </button>
            </form>
        </div>
    );
};

export default ChatInterface;
