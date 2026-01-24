import { useEffect, useState } from 'react';
import api from '../utils/api';
import aiService from '../utils/aiService';
import { BrainCircuit, Plus, Award } from 'lucide-react';

const Quiz = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState('');

    // Quiz Take Mode
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionIndex: option }
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
                // If local generation, save it to backend
                const res = await api.post('/ai/quiz', {
                    documentId: selectedDoc,
                    questions: result,
                    numQuestions: result.length
                });
                quizToStart = res.data;
            } else {
                // Server generated and saved it already
                quizToStart = result;
            }

            if (quizToStart) {
                startQuiz(quizToStart);
                fetchQuizzes(); // Refresh list
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

        // Update score in backend
        try {
            await api.put(`/ai/quiz/${activeQuiz._id}/score`, { score: newScore });
            fetchQuizzes(); // Refresh list to show new score
        } catch (err) {
            console.error("Failed to save score:", err);
        }
    };

    if (activeQuiz) {
        if (showResults) {
            return (
                <div className="max-w-2xl mx-auto p-8 text-center bg-white rounded-xl shadow-lg mt-8">
                    <Award size={64} className="mx-auto text-yellow-500 mb-4" />
                    <h2 className="text-3xl font-bold mb-2">Quiz Completed!</h2>
                    <p className="text-xl text-gray-600 mb-6">You scored <span className="text-indigo-600 font-bold">{score} / {activeQuiz.questions.length}</span></p>
                    <button onClick={() => setActiveQuiz(null)} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">Back to Quizzes</button>
                    <div className="mt-8 text-left space-y-4">
                        <h3 className="font-bold border-b pb-2">Review</h3>
                        {activeQuiz.questions.map((q, idx) => (
                            <div key={idx} className={`p-4 rounded-lg ${answers[idx] === q.correctAnswer ? 'bg-green-50' : 'bg-red-50'}`}>
                                <p className="font-semibold mb-2">{q.question}</p>
                                <p className="text-sm">Your Answer: <span className="font-bold">{answers[idx] || 'Skipped'}</span></p>
                                {answers[idx] !== q.correctAnswer && <p className="text-sm text-green-700">Correct Answer: {q.correctAnswer}</p>}
                                <p className="text-xs text-gray-500 mt-1 italic">{q.explanation}</p>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        const currentQ = activeQuiz.questions[currentQIndex];

        return (
            <div className="max-w-2xl mx-auto p-6 mt-8">
                <div className="mb-6 flex justify-between items-center">
                    <button onClick={() => setActiveQuiz(null)} className="text-gray-500 hover:text-gray-800">Exit Quiz</button>
                    <span className="font-bold text-gray-500">Question {currentQIndex + 1} of {activeQuiz.questions.length}</span>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold mb-6 text-gray-800">{currentQ.question}</h2>
                    <div className="space-y-3">
                        {currentQ.options.map((option, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleOptionSelect(option)}
                                className={`w-full text-left p-4 rounded-lg border transition ${answers[currentQIndex] === option
                                    ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
                                    : 'hover:bg-gray-50 border-gray-200'
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    {currentQIndex < activeQuiz.questions.length - 1 ? (
                        <button
                            onClick={() => setCurrentQIndex(prev => prev + 1)}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
                        >
                            Next Question
                        </button>
                    ) : (
                        <button
                            onClick={submitQuiz}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                        >
                            Submit Quiz
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">AI Quizzes</h1>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold mb-4">Generate New Quiz</h2>
                <div className="flex gap-4">
                    <select
                        value={selectedDoc}
                        onChange={(e) => setSelectedDoc(e.target.value)}
                        className="flex-1 border p-2 rounded-lg"
                    >
                        <option value="">Select a Document</option>
                        {docs.map(d => <option key={d._id} value={d._id}>{d.filename}</option>)}
                    </select>
                    <button
                        onClick={handleCreate}
                        disabled={loading || !selectedDoc}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? 'Generating...' : <><Plus size={18} /> Generate with AI</>}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizzes.map(quiz => (
                    <div key={quiz._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer" onClick={() => startQuiz(quiz)}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><BrainCircuit size={24} /></div>
                            <h3 className="font-semibold text-lg truncate">{quiz.title}</h3>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">{quiz.totalQuestions} Questions • Score: {quiz.score}</p>
                        <button className="w-full bg-indigo-50 text-indigo-700 py-2 rounded-lg font-medium">Re-Take Quiz</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Quiz;
