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

    // Chat State
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

    const getDifficultyColor = (diff) => {
        switch (diff) {
            case 'Hard': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
            case 'Medium': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
            default: return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
        }
    };

    if (activeSession) {
        return (
            <div className="h-[calc(100vh-6rem)] flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
                {/* Chat Header */}
                <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                            <Bot className="text-emerald-600 dark:text-emerald-400" size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white">{activeSession.role}</h2>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(activeSession.difficulty)}`}>
                                {activeSession.difficulty}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => setActiveSession(null)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500 dark:text-gray-400 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gray-50 dark:bg-gray-950">
                    <AnimatePresence>
                        {messages.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 border border-gray-100 dark:border-gray-700'
                                    }`}>
                                    {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                                </div>
                                <div className={`p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-tl-sm'
                                    }`}>
                                    <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert' : 'dark:prose-invert'}`}>
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
                            className="flex gap-3"
                        >
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 border border-gray-100 dark:border-gray-700 flex items-center justify-center shrink-0 shadow-sm">
                                <Bot size={18} />
                            </div>
                            <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm rounded-tl-sm">
                                <div className="flex space-x-1.5">
                                    <motion.div
                                        className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
                                        animate={{ y: [0, -6, 0] }}
                                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                    />
                                    <motion.div
                                        className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
                                        animate={{ y: [0, -6, 0] }}
                                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                                    />
                                    <motion.div
                                        className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
                                        animate={{ y: [0, -6, 0] }}
                                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                    <div ref={endRef} />
                </div>

                {/* Input Form */}
                <form onSubmit={sendMessage} className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your answer..."
                        className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 transition-all"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={chatLoading || !input.trim()}
                        className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/25"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Interview Preparation</h1>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800"
            >
                <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                    <Sparkles className="text-emerald-500" size={20} />
                    Start New Session
                </h2>
                <div className="flex gap-4 flex-wrap">
                    <input
                        type="text"
                        placeholder="Role (e.g., Frontend Developer)"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="flex-1 min-w-[200px] border border-gray-200 dark:border-gray-700 p-3 rounded-xl dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                    />
                    <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="border border-gray-200 dark:border-gray-700 p-3 rounded-xl dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    >
                        <option>Easy</option>
                        <option>Medium</option>
                        <option>Hard</option>
                    </select>
                    <button
                        onClick={startSession}
                        disabled={loading || !role}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 font-medium shadow-lg shadow-indigo-500/25 transition-all whitespace-nowrap"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                Starting...
                            </>
                        ) : (
                            <>
                                <Plus size={18} />
                                Start Session
                            </>
                        )}
                    </button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.map((session, idx) => (
                    <motion.div
                        key={session._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => enterSession(session)}
                        className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-all cursor-pointer card-hover group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
                                <MessageSquare size={24} />
                            </div>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getDifficultyColor(session.difficulty)}`}>
                                {session.difficulty}
                            </span>
                        </div>
                        <h3 className="font-semibold text-lg truncate mb-2 text-gray-800 dark:text-white">{session.role}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 flex items-center gap-1.5">
                            <Clock size={14} />
                            {new Date(session.createdAt).toLocaleDateString()}
                        </p>
                        <button className="w-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 py-2.5 rounded-xl font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
                            Continue
                        </button>
                    </motion.div>
                ))}
            </div>

            {sessions.length === 0 && !loading && (
                <div className="text-center py-16 text-gray-400 dark:text-gray-500">
                    <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No interview sessions yet. Start one to practice!</p>
                </div>
            )}
        </div>
    );
};

export default Interview;
