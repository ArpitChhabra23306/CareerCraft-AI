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

    // Quiz Take Mode
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-3xl mx-auto p-6 md:p-8"
            >
                <div className={`text-center p-8 rounded-2xl mb-8 ${isPassing ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-amber-500 to-orange-600'} text-white shadow-xl`}>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                    >
                        <Award size={64} className="mx-auto mb-4" />
                    </motion.div>
                    <h2 className="text-3xl font-bold mb-2">Quiz Completed!</h2>
                    <p className="text-lg opacity-90 mb-4">
                        You scored <span className="font-bold text-2xl">{score}</span> out of <span className="font-bold">{activeQuiz.questions.length}</span>
                    </p>
                    <div className="inline-block px-4 py-2 bg-white/20 rounded-xl font-bold text-2xl">
                        {percentage}%
                    </div>
                </div>

                <div className="flex gap-4 justify-center mb-8">
                    <button
                        onClick={() => setActiveQuiz(null)}
                        className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                    >
                        Back to Quizzes
                    </button>
                    <button
                        onClick={() => startQuiz(activeQuiz)}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25"
                    >
                        Retake Quiz
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <h3 className="font-bold p-4 border-b border-gray-100 dark:border-gray-800 text-gray-800 dark:text-white">Review Answers</h3>
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {activeQuiz.questions.map((q, idx) => {
                            const isCorrect = answers[idx] === q.correctAnswer;
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={`p-4 ${isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}
                                >
                                    <div className="flex items-start gap-3">
                                        {isCorrect ? (
                                            <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" size={20} />
                                        ) : (
                                            <XCircle className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" size={20} />
                                        )}
                                        <div>
                                            <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">{q.question}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Your answer: <span className="font-medium">{answers[idx] || 'Skipped'}</span>
                                            </p>
                                            {!isCorrect && (
                                                <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                                                    Correct: {q.correctAnswer}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 italic">{q.explanation}</p>
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
                        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span className="font-medium">Exit</span>
                    </button>
                    <span className="font-bold text-gray-500 dark:text-gray-400">
                        Question {currentQIndex + 1} of {activeQuiz.questions.length}
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-8">
                    <motion.div
                        className="bg-gradient-to-r from-indigo-600 to-purple-500 h-2 rounded-full progress-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                    />
                </div>

                {/* Question Card */}
                <motion.div
                    key={currentQIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800"
                >
                    <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-800 dark:text-white leading-relaxed">
                        {currentQ.question}
                    </h2>
                    <div className="space-y-3">
                        {currentQ.options.map((option, idx) => (
                            <motion.button
                                key={idx}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => handleOptionSelect(option)}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${answers[currentQIndex] === option
                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-md'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${answers[currentQIndex] === option
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                        }`}>
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    <span className="font-medium">{option}</span>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>

                {/* Navigation */}
                <div className="mt-8 flex justify-between items-center">
                    <button
                        onClick={() => setCurrentQIndex(prev => prev - 1)}
                        disabled={currentQIndex === 0}
                        className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all font-medium"
                    >
                        Previous
                    </button>
                    {currentQIndex < activeQuiz.questions.length - 1 ? (
                        <button
                            onClick={() => setCurrentQIndex(prev => prev + 1)}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-medium shadow-lg shadow-indigo-500/25"
                        >
                            Next Question
                        </button>
                    ) : (
                        <button
                            onClick={submitQuiz}
                            className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-medium shadow-lg shadow-emerald-500/25"
                        >
                            Submit Quiz
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Quiz List
    return (
        <div className="space-y-6 animate-fade-in">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">AI Quizzes</h1>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800"
            >
                <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                    <Sparkles className="text-purple-500" size={20} />
                    Generate New Quiz
                </h2>
                <div className="flex gap-4 flex-wrap">
                    <select
                        value={selectedDoc}
                        onChange={(e) => setSelectedDoc(e.target.value)}
                        className="flex-1 min-w-[200px] border border-gray-200 dark:border-gray-700 p-3 rounded-xl dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    >
                        <option value="">Select a Document</option>
                        {docs.map(d => <option key={d._id} value={d._id}>{d.filename}</option>)}
                    </select>
                    <button
                        onClick={handleCreate}
                        disabled={loading || !selectedDoc}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 font-medium shadow-lg shadow-indigo-500/25 transition-all"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                Generating...
                            </>
                        ) : (
                            <>
                                <Plus size={18} />
                                Generate with AI
                            </>
                        )}
                    </button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizzes.map((quiz, idx) => (
                    <motion.div
                        key={quiz._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => startQuiz(quiz)}
                        className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-all cursor-pointer card-hover group"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl group-hover:scale-110 transition-transform">
                                <BrainCircuit size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg truncate text-gray-800 dark:text-white">{quiz.title}</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">{quiz.totalQuestions} Questions</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Best Score:</span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">{quiz.score}/{quiz.totalQuestions}</span>
                        </div>
                        <button className="w-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 py-2.5 rounded-xl font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
                            Take Quiz
                        </button>
                    </motion.div>
                ))}
            </div>

            {quizzes.length === 0 && !loading && (
                <div className="text-center py-16 text-gray-400 dark:text-gray-500">
                    <BrainCircuit size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No quizzes yet. Generate one from your documents!</p>
                </div>
            )}
        </div>
    );
};

export default Quiz;
