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
            <div className="h-[calc(100vh-6rem)] flex flex-col rounded-[20px] bg-[#F2EEE4] dark:bg-[#0F1115] border border-[#E3DAC6] dark:border-[#2A2F3A] overflow-hidden">
                {/* Chat Header */}
                <div className="p-4 border-b border-[#E3DAC6] dark:border-[#2A2F3A] flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#0F1115] dark:bg-[#F5F2EA] flex items-center justify-center">
                            <Bot size={16} className="text-white dark:text-[#0F1115]" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="text-[14px] font-semibold text-[#0F1115] dark:text-[#F5F2EA]">{activeSession.role}</h2>
                            <span className="text-[10px] font-medium text-[#8D8474] uppercase tracking-wider">
                                {activeSession.difficulty}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => setActiveSession(null)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8D8474] hover:text-[#0F1115] dark:hover:text-[#F5F2EA] hover:bg-[#E3DAC6] dark:hover:bg-[#2A2F3A] transition-all duration-300"
                    >
                        <X size={16} strokeWidth={1.5} />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 bg-[#F5F2EA] dark:bg-[#0F1115]">
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
                                    ? 'bg-[#0F1115] dark:bg-[#F5F2EA] text-white dark:text-[#0F1115]'
                                    : 'bg-[#E3DAC6] dark:bg-[#2A2F3A] text-[#7C7365]'
                                    }`}>
                                    {msg.role === 'user' ? <User size={14} strokeWidth={1.5} /> : <Bot size={14} strokeWidth={1.5} />}
                                </div>
                                <div className={`p-4 rounded-[14px] max-w-[80%] text-[13px] leading-relaxed ${msg.role === 'user'
                                    ? 'bg-[#0F1115] dark:bg-[#F5F2EA] text-white dark:text-[#0F1115]'
                                    : 'bg-[#F2EEE4] dark:bg-[#0F1115] text-[#0F1115] dark:text-[#F5F2EA] border border-[#E3DAC6] dark:border-[#2A2F3A]'
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
                            <div className="w-8 h-8 rounded-lg bg-[#E3DAC6] dark:bg-[#2A2F3A] text-[#7C7365] flex items-center justify-center shrink-0">
                                <Bot size={14} strokeWidth={1.5} />
                            </div>
                            <div className="p-4 bg-[#F2EEE4] dark:bg-[#0F1115] rounded-[14px] border border-[#E3DAC6] dark:border-[#2A2F3A]">
                                <div className="flex space-x-1.5">
                                    <motion.div className="w-1.5 h-1.5 bg-[#B8B1A3] dark:bg-[#8D8474] rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                                    <motion.div className="w-1.5 h-1.5 bg-[#B8B1A3] dark:bg-[#8D8474] rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }} />
                                    <motion.div className="w-1.5 h-1.5 bg-[#B8B1A3] dark:bg-[#8D8474] rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                    <div ref={endRef} />
                </div>

                {/* Input Form */}
                <form onSubmit={sendMessage} className="p-4 border-t border-[#E3DAC6] dark:border-[#2A2F3A] flex gap-2 bg-[#F2EEE4] dark:bg-[#0F1115]">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your answer..."
                        className="flex-1 border border-[#E3DAC6] dark:border-[#2A2F3A] rounded-xl px-4 py-3 focus:border-[#0F1115] dark:focus:border-[#F5F2EA] outline-none bg-[#F5F2EA] dark:bg-[#0F1115] text-[#0F1115] dark:text-[#F5F2EA] text-[13px] placeholder-[#A79F90] dark:placeholder-[#8D8474] transition-colors duration-300"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={chatLoading || !input.trim()}
                        className="w-11 h-11 rounded-xl bg-[#0F1115] dark:bg-[#F5F2EA] text-white dark:text-[#0F1115] flex items-center justify-center hover:bg-[#E6C55A] dark:hover:bg-[#B8B1A3] disabled:opacity-40 transition-all duration-300 shrink-0"
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
                className="text-2xl font-bold text-[#0F1115] dark:text-[#F5F2EA] tracking-[-0.03em]"
            >
                Interview Preparation
            </motion.h1>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-[20px] bg-[#F2EEE4] dark:bg-[#0F1115] border border-[#E3DAC6] dark:border-[#2A2F3A]"
            >
                <h2 className="text-[15px] font-semibold mb-4 text-[#0F1115] dark:text-[#F5F2EA] flex items-center gap-2">
                    <Sparkles size={16} strokeWidth={1.5} className="text-[#7C7365]" />
                    Start New Session
                </h2>
                <div className="flex gap-3 flex-wrap">
                    <input
                        type="text"
                        placeholder="Role (e.g., Frontend Developer)"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="flex-1 min-w-[200px] border border-[#E3DAC6] dark:border-[#2A2F3A] p-3 rounded-xl bg-[#F5F2EA] dark:bg-[#0F1115] text-[#0F1115] dark:text-[#F5F2EA] text-[13px] focus:border-[#0F1115] dark:focus:border-[#F5F2EA] outline-none transition-colors duration-300 placeholder-[#A79F90] dark:placeholder-[#8D8474]"
                    />
                    <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="border border-[#E3DAC6] dark:border-[#2A2F3A] p-3 rounded-xl bg-[#F5F2EA] dark:bg-[#0F1115] text-[#0F1115] dark:text-[#F5F2EA] text-[13px] focus:border-[#0F1115] dark:focus:border-[#F5F2EA] outline-none transition-colors duration-300"
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
                        className="bg-[#0F1115] dark:bg-[#F5F2EA] text-white dark:text-[#0F1115] px-6 py-3 rounded-xl disabled:opacity-40 flex items-center gap-2 text-[13px] font-semibold transition-all duration-300 whitespace-nowrap"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin h-3.5 w-3.5 border-2 border-white dark:border-[#0F1115] border-t-transparent rounded-full"></span>
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
                        className="p-6 rounded-[20px] bg-[#F2EEE4] dark:bg-[#0F1115] border border-[#E3DAC6] dark:border-[#2A2F3A] hover:bg-[#F5F2EA] dark:hover:bg-[#1F2430] hover:shadow-[0_20px_60px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)] hover:border-[#D6CCB5] dark:hover:border-[#2A2F3A] transition-all duration-500 cursor-pointer group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#E3DAC6] dark:bg-[#2A2F3A] border border-[#D6CCB5] dark:border-[#2A2F3A] flex items-center justify-center group-hover:bg-[#0F1115] dark:group-hover:bg-[#F5F2EA] group-hover:border-[#0F1115] dark:group-hover:border-[#F5F2EA] transition-all duration-500">
                                <MessageSquare size={18} strokeWidth={1.5} className="text-[#7C7365] group-hover:text-white dark:group-hover:text-[#0F1115] transition-colors duration-500" />
                            </div>
                            <span className="text-[10px] font-medium text-[#8D8474] uppercase tracking-wider bg-[#E3DAC6] dark:bg-[#2A2F3A] px-2 py-1 rounded-lg">
                                {session.difficulty}
                            </span>
                        </div>
                        <h3 className="font-semibold text-[14px] truncate mb-2 text-[#0F1115] dark:text-[#F5F2EA]">{session.role}</h3>
                        <p className="text-[#8D8474] text-[12px] mb-4 flex items-center gap-1.5">
                            <Clock size={12} strokeWidth={1.5} />
                            {new Date(session.createdAt).toLocaleDateString()}
                        </p>
                        <button className="w-full bg-[#E3DAC6] dark:bg-[#2A2F3A] text-[#0F1115] dark:text-[#F5F2EA] py-2.5 rounded-xl text-[13px] font-medium hover:bg-[#0F1115] dark:hover:bg-[#F5F2EA] hover:text-white dark:hover:text-[#0F1115] transition-all duration-500">
                            Continue
                        </button>
                    </motion.div>
                ))}
            </div>

            {sessions.length === 0 && !loading && (
                <div className="text-center py-20">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E3DAC6] dark:bg-[#2A2F3A] border border-[#D6CCB5] dark:border-[#2A2F3A] flex items-center justify-center mb-4">
                        <MessageSquare size={24} className="text-[#7C7365]" strokeWidth={1.5} />
                    </div>
                    <p className="text-[#8D8474] text-[14px]">No interview sessions yet. Start one to practice!</p>
                </div>
            )}
        </div>
    );
};

export default Interview;
