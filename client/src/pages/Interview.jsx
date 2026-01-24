import { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import api from '../utils/api';
import { MessageSquare, Plus, Send, Bot, User, Clock } from 'lucide-react';

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
            // Update session with full history
            setMessages(res.data.messages);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'model', content: 'Error getting response.' }]);
        } finally {
            setChatLoading(false);
        }
    };

    if (activeSession) {
        return (
            <div className="h-[calc(100vh-6rem)] flex flex-col bg-white dark:bg-black rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="p-4 bg-white dark:bg-gray-800 border-b flex justify-between items-center shadow-sm z-10 dark:border-gray-700">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white">{activeSession.role} Interview</h2>
                        <span className={`text-xs px-2 py-1 rounded-full ${activeSession.difficulty === 'Hard' ? 'bg-red-100 text-red-700' :
                            activeSession.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                            }`}>
                            {activeSession.difficulty}
                        </span>
                    </div>
                    <button onClick={() => setActiveSession(null)} className="text-gray-500 hover:text-gray-800 font-medium">
                        Exit Session
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 dark:bg-gray-900">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-green-600 border border-green-100'}`}>
                                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                            </div>
                            <div className={`p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-tl-none'
                                }`}>
                                <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert text-white' : 'text-gray-800'}`}>
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))}
                    {chatLoading && (
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-white text-green-600 border border-green-100 flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                                <Bot size={20} />
                            </div>
                            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm rounded-tl-none">
                                <div className="flex space-x-2">
                                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={endRef} />
                </div>

                <form onSubmit={sendMessage} className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-4">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your answer..."
                        className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={chatLoading || !input.trim()}
                        className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Interview Preparation</h1>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Start New Session</h2>
                <div className="flex gap-4 flex-wrap">
                    <input
                        type="text"
                        placeholder="Role (e.g., Frontend Developer)"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="flex-1 border p-2 rounded-lg min-w-[200px] dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    />
                    <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="border p-2 rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    >
                        <option>Easy</option>
                        <option>Medium</option>
                        <option>Hard</option>
                    </select>
                    <button
                        onClick={startSession}
                        disabled={loading || !role}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                    >
                        {loading ? 'Starting...' : <><Plus size={18} /> Start Session</>}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.map(session => (
                    <div key={session._id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition cursor-pointer" onClick={() => enterSession(session)}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><MessageSquare size={24} /></div>
                            <span className={`text-xs px-2 py-1 rounded-full ${session.difficulty === 'Hard' ? 'bg-red-100 text-red-700' :
                                session.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                                }`}>
                                {session.difficulty}
                            </span>
                        </div>
                        <h3 className="font-semibold text-lg truncate mb-1 text-gray-800 dark:text-white">{session.role}</h3>
                        <p className="text-gray-500 text-xs mb-4 flex items-center gap-1">
                            <Clock size={12} /> {new Date(session.createdAt).toLocaleDateString()}
                        </p>
                        <button className="w-full bg-indigo-50 text-indigo-700 py-2 rounded-lg font-medium">Continue</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Interview;
