import { useEffect, useState } from 'react';
import api from '../utils/api';
import aiService from '../utils/aiService';
import { BrainCircuit, Plus, Award, ChevronLeft, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Quiz = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState('');

    const [activeQuiz, setActiveQuiz] = useState(null);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);
    const [score, setScore] = useState(0);

    useEffect(() => {
        fetchQuizzes();
        fetchDocs();
    }, []);

    const fetchQuizzes = async () => {
        try {
            const res = await api.get('/ai/quiz');
            setQuizzes(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchDocs = async () => {
        try {
            const res = await api.get('/docs');
            setDocs(res.data);
        } catch (err) { console.error(err); }
    };

    const handleCreate = async () => {
        if (!selectedDoc) return;
        setLoading(true);
        try {
            const result = await aiService.generateQuiz(selectedDoc, 5);
            let quizToStart;

            if (Array.isArray(result)) {
                const res = await api.post('/ai/quiz', {
                    documentId: selectedDoc,
                    questions: result,
                    numQuestions: result.length
                });
                quizToStart = res.data;
            } else {
                quizToStart = result;
            }

            if (quizToStart) {
                startQuiz(quizToStart);
                fetchQuizzes();
            }
            setSelectedDoc('');
        } catch (err) {
            alert(err.response?.data?.message || err.response?.data?.error || 'Failed to generate quiz');
        } finally {
            setLoading(false);
        }
    };

    const startQuiz = (quiz) => {
        setActiveQuiz(quiz);
        setCurrentQIndex(0);
        setAnswers({});
        setShowResults(false);
        setScore(0);
    };

    const handleOptionSelect = (option) => {
        setAnswers(prev => ({ ...prev, [currentQIndex]: option }));
    };

    const submitQuiz = async () => {
        let newScore = 0;
        activeQuiz.questions.forEach((q, idx) => {
            if (answers[idx] === q.correctAnswer) newScore++;
        });
        setScore(newScore);
        setShowResults(true);

        try {
            await api.put(`/ai/quiz/${activeQuiz._id}/score`, { score: newScore });
            fetchQuizzes();
        } catch (err) {
            console.error("Failed to save score:", err);
        }
    };

    // Results Screen
    if (activeQuiz && showResults) {
        const percentage = Math.round((score / activeQuiz.questions.length) * 100);
        const isPassing = percentage >= 70;

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-3xl mx-auto p-4 md:p-8"
            >
                <div className="text-center p-10 rounded-[20px] mb-8 bg-[#111] dark:bg-[#eee] text-white dark:text-[#111] relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20" style={{
                        background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.1), transparent 60%)',
                    }} />
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        className="relative z-10"
                    >
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-white/10 dark:bg-[#111]/10 flex items-center justify-center mb-4">
                            <Award size={32} strokeWidth={1.5} />
                        </div>
                    </motion.div>
                    <h2 className="text-2xl font-bold mb-2 relative z-10">Quiz Completed!</h2>
                    <p className="text-white/60 dark:text-[#111]/60 mb-4 relative z-10">
                        You scored <span className="font-bold text-white dark:text-[#111] text-xl">{score}</span> out of <span className="font-bold">{activeQuiz.questions.length}</span>
                    </p>
                    <div className="inline-block px-5 py-2 bg-white/10 dark:bg-[#111]/10 rounded-xl font-bold text-2xl relative z-10">
                        {percentage}%
                    </div>
                </div>

                <div className="flex gap-3 justify-center mb-8">
                    <motion.button
                        onClick={() => setActiveQuiz(null)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-6 py-3 bg-[#fafafa] dark:bg-[#111] border border-[#f0f0f0] dark:border-[#1a1a1a] text-[#111] dark:text-[#eee] rounded-xl text-[13px] font-medium hover:border-[#e8e8e8] dark:hover:border-[#222] transition-all duration-300"
                    >
                        Back to Quizzes
                    </motion.button>
                    <motion.button
                        onClick={() => startQuiz(activeQuiz)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-6 py-3 bg-[#111] dark:bg-[#eee] text-white dark:text-[#111] rounded-xl text-[13px] font-semibold transition-all duration-300"
                    >
                        Retake Quiz
                    </motion.button>
                </div>

                <div className="rounded-[20px] bg-[#fafafa] dark:bg-[#111] border border-[#f0f0f0] dark:border-[#1a1a1a] overflow-hidden">
                    <h3 className="font-semibold text-[14px] p-5 border-b border-[#f0f0f0] dark:border-[#1a1a1a] text-[#111] dark:text-[#eee]">Review Answers</h3>
                    <div className="divide-y divide-[#f0f0f0] dark:divide-[#1a1a1a]">
                        {activeQuiz.questions.map((q, idx) => {
                            const isCorrect = answers[idx] === q.correctAnswer;
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.06 }}
                                    className="p-5"
                                >
                                    <div className="flex items-start gap-3">
                                        {isCorrect ? (
                                            <div className="w-6 h-6 rounded-full bg-[#111] dark:bg-[#eee] flex items-center justify-center shrink-0 mt-0.5">
                                                <CheckCircle2 className="text-white dark:text-[#111]" size={14} strokeWidth={1.5} />
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center shrink-0 mt-0.5">
                                                <XCircle className="text-red-500" size={14} strokeWidth={1.5} />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium text-[#111] dark:text-[#eee] text-[13px] mb-1.5">{q.question}</p>
                                            <p className="text-[12px] text-[#999]">
                                                Your answer: <span className="font-medium text-[#111] dark:text-[#eee]">{answers[idx] || 'Skipped'}</span>
                                            </p>
                                            {!isCorrect && (
                                                <p className="text-[12px] text-[#111] dark:text-[#eee] mt-1 font-medium">
                                                    Correct: {q.correctAnswer}
                                                </p>
                                            )}
                                            <p className="text-[11px] text-[#bbb] dark:text-[#666] mt-1.5 italic">{q.explanation}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </motion.div>
        );
    }

    // Quiz Taking Mode
    if (activeQuiz) {
        const currentQ = activeQuiz.questions[currentQIndex];
        const progress = ((currentQIndex + 1) / activeQuiz.questions.length) * 100;

        return (
            <div className="max-w-3xl mx-auto p-4 md:p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={() => setActiveQuiz(null)}
                        className="flex items-center gap-2 text-[#999] hover:text-[#111] dark:hover:text-[#eee] transition-colors"
                    >
                        <ChevronLeft size={18} strokeWidth={1.5} />
                        <span className="text-[13px] font-medium">Exit</span>
                    </button>
                    <span className="text-[12px] font-medium text-[#999] tracking-wide">
                        Question {currentQIndex + 1} of {activeQuiz.questions.length}
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#f0f0f0] dark:bg-[#1a1a1a] rounded-full h-1 mb-8">
                    <motion.div
                        className="bg-[#111] dark:bg-[#eee] h-1 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    />
                </div>

                {/* Question Card */}
                <motion.div
                    key={currentQIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-6 md:p-8 rounded-[20px] bg-[#fafafa] dark:bg-[#111] border border-[#f0f0f0] dark:border-[#1a1a1a]"
                >
                    <h2 className="text-lg md:text-xl font-bold mb-6 text-[#111] dark:text-[#eee] leading-relaxed">
                        {currentQ.question}
                    </h2>
                    <div className="space-y-2.5">
                        {currentQ.options.map((option, idx) => (
                            <motion.button
                                key={idx}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => handleOptionSelect(option)}
                                className={`w-full text-left p-4 rounded-[14px] border-2 transition-all duration-300 ${answers[currentQIndex] === option
                                    ? 'bg-[#111] dark:bg-[#eee] border-[#111] dark:border-[#eee] text-white dark:text-[#111]'
                                    : 'border-[#f0f0f0] dark:border-[#1a1a1a] hover:border-[#e8e8e8] dark:hover:border-[#222] text-[#111] dark:text-[#eee]'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold transition-all duration-300 ${answers[currentQIndex] === option
                                        ? 'bg-white/20 dark:bg-[#111]/20 text-white dark:text-[#111]'
                                        : 'bg-[#f0f0f0] dark:bg-[#1a1a1a] text-[#999]'
                                        }`}>
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    <span className="text-[13px] font-medium">{option}</span>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>

                {/* Navigation */}
                <div className="mt-6 flex justify-between items-center">
                    <motion.button
                        onClick={() => setCurrentQIndex(prev => prev - 1)}
                        disabled={currentQIndex === 0}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-6 py-3 bg-[#fafafa] dark:bg-[#111] border border-[#f0f0f0] dark:border-[#1a1a1a] text-[#111] dark:text-[#eee] rounded-xl disabled:opacity-30 hover:border-[#e8e8e8] dark:hover:border-[#222] transition-all duration-300 text-[13px] font-medium"
                    >
                        Previous
                    </motion.button>
                    {currentQIndex < activeQuiz.questions.length - 1 ? (
                        <motion.button
                            onClick={() => setCurrentQIndex(prev => prev + 1)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-6 py-3 bg-[#111] dark:bg-[#eee] text-white dark:text-[#111] rounded-xl transition-all duration-300 text-[13px] font-semibold"
                        >
                            Next Question
                        </motion.button>
                    ) : (
                        <motion.button
                            onClick={submitQuiz}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-6 py-3 bg-[#111] dark:bg-[#eee] text-white dark:text-[#111] rounded-xl transition-all duration-300 text-[13px] font-semibold"
                        >
                            Submit Quiz
                        </motion.button>
                    )}
                </div>
            </div>
        );
    }

    // Quiz List
    return (
        <div className="space-y-6">
            <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold text-[#111] dark:text-[#eee] tracking-[-0.03em]"
            >
                AI Quizzes
            </motion.h1>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-[20px] bg-[#fafafa] dark:bg-[#111] border border-[#f0f0f0] dark:border-[#1a1a1a]"
            >
                <h2 className="text-[15px] font-semibold mb-4 text-[#111] dark:text-[#eee] flex items-center gap-2">
                    <Sparkles size={16} strokeWidth={1.5} className="text-[#888]" />
                    Generate New Quiz
                </h2>
                <div className="flex gap-3 flex-wrap">
                    <select
                        value={selectedDoc}
                        onChange={(e) => setSelectedDoc(e.target.value)}
                        className="flex-1 min-w-[200px] border border-[#f0f0f0] dark:border-[#1a1a1a] p-3 rounded-xl bg-white dark:bg-[#0a0a0a] text-[#111] dark:text-[#eee] text-[13px] focus:border-[#111] dark:focus:border-[#eee] outline-none transition-colors duration-300"
                    >
                        <option value="">Select a Document</option>
                        {docs.map(d => <option key={d._id} value={d._id}>{d.filename}</option>)}
                    </select>
                    <motion.button
                        onClick={handleCreate}
                        disabled={loading || !selectedDoc}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-[#111] dark:bg-[#eee] text-white dark:text-[#111] px-6 py-3 rounded-xl disabled:opacity-40 flex items-center gap-2 text-[13px] font-semibold transition-all duration-300"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin h-3.5 w-3.5 border-2 border-white dark:border-[#111] border-t-transparent rounded-full"></span>
                                Generating...
                            </>
                        ) : (
                            <>
                                <Plus size={16} strokeWidth={1.5} />
                                Generate with AI
                            </>
                        )}
                    </motion.button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quizzes.map((quiz, idx) => (
                    <motion.div
                        key={quiz._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        onClick={() => startQuiz(quiz)}
                        className="p-6 rounded-[20px] bg-[#fafafa] dark:bg-[#111] border border-[#f0f0f0] dark:border-[#1a1a1a] hover:bg-white dark:hover:bg-[#151515] hover:shadow-[0_20px_60px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)] hover:border-[#e8e8e8] dark:hover:border-[#222] transition-all duration-500 cursor-pointer group"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#f0f0f0] dark:bg-[#1a1a1a] border border-[#e8e8e8] dark:border-[#222] flex items-center justify-center group-hover:bg-[#111] dark:group-hover:bg-[#eee] group-hover:border-[#111] dark:group-hover:border-[#eee] transition-all duration-500">
                                <BrainCircuit size={18} strokeWidth={1.5} className="text-[#888] group-hover:text-white dark:group-hover:text-[#111] transition-colors duration-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-[14px] truncate text-[#111] dark:text-[#eee]">{quiz.title}</h3>
                                <p className="text-[#999] text-[12px]">{quiz.totalQuestions} Questions</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[12px] text-[#999]">Best Score:</span>
                            <span className="font-bold text-[#111] dark:text-[#eee] text-[13px]">{quiz.score}/{quiz.totalQuestions}</span>
                        </div>
                        <button className="w-full bg-[#f0f0f0] dark:bg-[#1a1a1a] text-[#111] dark:text-[#eee] py-2.5 rounded-xl text-[13px] font-medium hover:bg-[#111] dark:hover:bg-[#eee] hover:text-white dark:hover:text-[#111] transition-all duration-500">
                            Take Quiz
                        </button>
                    </motion.div>
                ))}
            </div>

            {quizzes.length === 0 && !loading && (
                <div className="text-center py-20">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-[#f0f0f0] dark:bg-[#1a1a1a] border border-[#e8e8e8] dark:border-[#222] flex items-center justify-center mb-4">
                        <BrainCircuit size={24} className="text-[#888]" strokeWidth={1.5} />
                    </div>
                    <p className="text-[#999] text-[14px]">No quizzes yet. Generate one from your documents!</p>
                </div>
            )}
        </div>
    );
};

export default Quiz;
