import { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import api from '../utils/api';
import { MessageSquare, Plus, Send, Bot, User, Clock, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Interview = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeSession, setActiveSession] = useState(null);
    const [role, setRole] = useState('');
    const [difficulty, setDifficulty] = useState('Medium');

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const endRef = useRef(null);

    useEffect(() => {
        fetchSessions();
    }, []);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchSessions = async () => {
        try {
            const res = await api.get('/interview');
            setSessions(res.data);
        } catch (err) { console.error(err); }
    };

    const startSession = async () => {
        if (!role) return;
        setLoading(true);
        try {
            const res = await api.post('/interview/start', { role, difficulty });
            setSessions([res.data, ...sessions]);
            enterSession(res.data);
            setRole('');
        } catch (err) {
            alert('Failed to start session');
        } finally {
            setLoading(false);
        }
    };

    const enterSession = (session) => {
        setActiveSession(session);
        setMessages(session.messages || []);
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || chatLoading) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setChatLoading(true);

        try {
            const res = await api.post('/interview/message', { sessionId: activeSession._id, message: userMsg.content });
            setMessages(res.data.messages);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'model', content: 'Error getting response.' }]);
        } finally {
            setChatLoading(false);
        }
    };

    // Active Chat
    if (activeSession) {
        return (
            <div className="h-[calc(100vh-6rem)] flex flex-col rounded-[20px] bg-[#fafafa] dark:bg-[#111] border border-[#f0f0f0] dark:border-[#1a1a1a] overflow-hidden">
                {/* Chat Header */}
                <div className="p-4 border-b border-[#f0f0f0] dark:border-[#1a1a1a] flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#111] dark:bg-[#eee] flex items-center justify-center">
                            <Bot size={16} className="text-white dark:text-[#111]" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="text-[14px] font-semibold text-[#111] dark:text-[#eee]">{activeSession.role}</h2>
                            <span className="text-[10px] font-medium text-[#999] uppercase tracking-wider">
                                {activeSession.difficulty}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => setActiveSession(null)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#999] hover:text-[#111] dark:hover:text-[#eee] hover:bg-[#f0f0f0] dark:hover:bg-[#1a1a1a] transition-all duration-300"
                    >
                        <X size={16} strokeWidth={1.5} />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 bg-white dark:bg-[#0a0a0a]">
                    <AnimatePresence>
                        {messages.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'user'
                                    ? 'bg-[#111] dark:bg-[#eee] text-white dark:text-[#111]'
                                    : 'bg-[#f0f0f0] dark:bg-[#1a1a1a] text-[#888]'
                                    }`}>
                                    {msg.role === 'user' ? <User size={14} strokeWidth={1.5} /> : <Bot size={14} strokeWidth={1.5} />}
                                </div>
                                <div className={`p-4 rounded-[14px] max-w-[80%] text-[13px] leading-relaxed ${msg.role === 'user'
                                    ? 'bg-[#111] dark:bg-[#eee] text-white dark:text-[#111]'
                                    : 'bg-[#fafafa] dark:bg-[#111] text-[#111] dark:text-[#eee] border border-[#f0f0f0] dark:border-[#1a1a1a]'
                                    }`}>
                                    <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert' : 'dark:prose-invert'} prose-headings:text-inherit prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5`}>
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Typing Indicator */}
                    {chatLoading && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-2.5"
                        >
                            <div className="w-8 h-8 rounded-lg bg-[#f0f0f0] dark:bg-[#1a1a1a] text-[#888] flex items-center justify-center shrink-0">
                                <Bot size={14} strokeWidth={1.5} />
                            </div>
                            <div className="p-4 bg-[#fafafa] dark:bg-[#111] rounded-[14px] border border-[#f0f0f0] dark:border-[#1a1a1a]">
                                <div className="flex space-x-1.5">
                                    <motion.div className="w-1.5 h-1.5 bg-[#ccc] dark:bg-[#555] rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                                    <motion.div className="w-1.5 h-1.5 bg-[#ccc] dark:bg-[#555] rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }} />
                                    <motion.div className="w-1.5 h-1.5 bg-[#ccc] dark:bg-[#555] rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                    <div ref={endRef} />
                </div>

                {/* Input Form */}
                <form onSubmit={sendMessage} className="p-4 border-t border-[#f0f0f0] dark:border-[#1a1a1a] flex gap-2 bg-[#fafafa] dark:bg-[#111]">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your answer..."
                        className="flex-1 border border-[#f0f0f0] dark:border-[#1a1a1a] rounded-xl px-4 py-3 focus:border-[#111] dark:focus:border-[#eee] outline-none bg-white dark:bg-[#0a0a0a] text-[#111] dark:text-[#eee] text-[13px] placeholder-[#bbb] dark:placeholder-[#555] transition-colors duration-300"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={chatLoading || !input.trim()}
                        className="w-11 h-11 rounded-xl bg-[#111] dark:bg-[#eee] text-white dark:text-[#111] flex items-center justify-center hover:bg-[#333] dark:hover:bg-[#ccc] disabled:opacity-40 transition-all duration-300 shrink-0"
                    >
                        <Send size={16} strokeWidth={1.5} />
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold text-[#111] dark:text-[#eee] tracking-[-0.03em]"
            >
                Interview Preparation
            </motion.h1>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-[20px] bg-[#fafafa] dark:bg-[#111] border border-[#f0f0f0] dark:border-[#1a1a1a]"
            >
                <h2 className="text-[15px] font-semibold mb-4 text-[#111] dark:text-[#eee] flex items-center gap-2">
                    <Sparkles size={16} strokeWidth={1.5} className="text-[#888]" />
                    Start New Session
                </h2>
                <div className="flex gap-3 flex-wrap">
                    <input
                        type="text"
                        placeholder="Role (e.g., Frontend Developer)"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="flex-1 min-w-[200px] border border-[#f0f0f0] dark:border-[#1a1a1a] p-3 rounded-xl bg-white dark:bg-[#0a0a0a] text-[#111] dark:text-[#eee] text-[13px] focus:border-[#111] dark:focus:border-[#eee] outline-none transition-colors duration-300 placeholder-[#bbb] dark:placeholder-[#555]"
                    />
                    <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="border border-[#f0f0f0] dark:border-[#1a1a1a] p-3 rounded-xl bg-white dark:bg-[#0a0a0a] text-[#111] dark:text-[#eee] text-[13px] focus:border-[#111] dark:focus:border-[#eee] outline-none transition-colors duration-300"
                    >
                        <option>Easy</option>
                        <option>Medium</option>
                        <option>Hard</option>
                    </select>
                    <motion.button
                        onClick={startSession}
                        disabled={loading || !role}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-[#111] dark:bg-[#eee] text-white dark:text-[#111] px-6 py-3 rounded-xl disabled:opacity-40 flex items-center gap-2 text-[13px] font-semibold transition-all duration-300 whitespace-nowrap"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin h-3.5 w-3.5 border-2 border-white dark:border-[#111] border-t-transparent rounded-full"></span>
                                Starting...
                            </>
                        ) : (
                            <>
                                <Plus size={16} strokeWidth={1.5} />
                                Start Session
                            </>
                        )}
                    </motion.button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessions.map((session, idx) => (
                    <motion.div
                        key={session._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        onClick={() => enterSession(session)}
                        className="p-6 rounded-[20px] bg-[#fafafa] dark:bg-[#111] border border-[#f0f0f0] dark:border-[#1a1a1a] hover:bg-white dark:hover:bg-[#151515] hover:shadow-[0_20px_60px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)] hover:border-[#e8e8e8] dark:hover:border-[#222] transition-all duration-500 cursor-pointer group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#f0f0f0] dark:bg-[#1a1a1a] border border-[#e8e8e8] dark:border-[#222] flex items-center justify-center group-hover:bg-[#111] dark:group-hover:bg-[#eee] group-hover:border-[#111] dark:group-hover:border-[#eee] transition-all duration-500">
                                <MessageSquare size={18} strokeWidth={1.5} className="text-[#888] group-hover:text-white dark:group-hover:text-[#111] transition-colors duration-500" />
                            </div>
                            <span className="text-[10px] font-medium text-[#999] uppercase tracking-wider bg-[#f0f0f0] dark:bg-[#1a1a1a] px-2 py-1 rounded-lg">
                                {session.difficulty}
                            </span>
                        </div>
                        <h3 className="font-semibold text-[14px] truncate mb-2 text-[#111] dark:text-[#eee]">{session.role}</h3>
                        <p className="text-[#999] text-[12px] mb-4 flex items-center gap-1.5">
                            <Clock size={12} strokeWidth={1.5} />
                            {new Date(session.createdAt).toLocaleDateString()}
                        </p>
                        <button className="w-full bg-[#f0f0f0] dark:bg-[#1a1a1a] text-[#111] dark:text-[#eee] py-2.5 rounded-xl text-[13px] font-medium hover:bg-[#111] dark:hover:bg-[#eee] hover:text-white dark:hover:text-[#111] transition-all duration-500">
                            Continue
                        </button>
                    </motion.div>
                ))}
            </div>

            {sessions.length === 0 && !loading && (
                <div className="text-center py-20">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-[#f0f0f0] dark:bg-[#1a1a1a] border border-[#e8e8e8] dark:border-[#222] flex items-center justify-center mb-4">
                        <MessageSquare size={24} className="text-[#888]" strokeWidth={1.5} />
                    </div>
                    <p className="text-[#999] text-[14px]">No interview sessions yet. Start one to practice!</p>
                </div>
            )}
        </div>
    );
};

export default Interview;
