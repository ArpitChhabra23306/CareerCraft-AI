import { useEffect, useState } from 'react';
import api from '../utils/api';
import { FileText, Layers, BrainCircuit, MessageSquare, Plus, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import GamificationCard from '../components/GamificationCard';

const StatCard = ({ icon: Icon, label, value, colorClass, bgClass, path, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
    >
        <Link to={path} className={`block bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-all duration-300 card-hover group`}>
            <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl ${bgClass}`}>
                    <Icon size={24} className={colorClass} />
                </div>
                <TrendingUp size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-green-500 transition-colors" />
            </div>
            <div className="mt-4">
                <p className="text-3xl font-bold text-gray-800 dark:text-white">{value}</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">{label}</p>
            </div>
        </Link>
    </motion.div>
);

const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl skeleton"></div>
            <div className="w-4 h-4 rounded skeleton"></div>
        </div>
        <div className="mt-4 space-y-2">
            <div className="h-8 w-16 rounded skeleton"></div>
            <div className="h-4 w-24 rounded skeleton"></div>
        </div>
    </div>
);

const QuizHistoryChart = ({ history }) => {
    if (!history || history.length === 0) return (
        <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-2xl mb-4">
                <BrainCircuit size={40} className="text-purple-500 dark:text-purple-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-300 font-medium mb-1">No quiz history yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">Take a quiz to see your progress!</p>
            <Link to="/quiz" className="mt-4 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">
                Take your first quiz →
            </Link>
        </div>
    );

    const data = [...history].reverse();

    return (
        <div className="flex items-end space-x-2 h-48 pt-6">
            {data.map((result, i) => (
                <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${result.percentage}%` }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="flex-1 flex flex-col items-center group relative"
                >
                    <div
                        className="w-full bg-gradient-to-t from-indigo-600 to-purple-500 rounded-t-lg hover:from-indigo-500 hover:to-purple-400 transition-all cursor-pointer relative h-full"
                    >
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 dark:bg-gray-700 text-white text-xs py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-lg">
                            {result.quizTitle}: {Math.round(result.percentage)}%
                        </div>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 mt-2 truncate w-full text-center">
                        {new Date(result.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                </motion.div>
            ))}
        </div>
    );
};

const Dashboard = () => {
    const [stats, setStats] = useState({ documents: 0, flashcards: 0, quizzes: 0, interviews: 0 });
    const [quizHistory, setQuizHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, historyRes] = await Promise.all([
                    api.get('/user/stats'),
                    api.get('/quiz/history')
                ]);
                setStats(statsRes.data);
                setQuizHistory(historyRes.data);
            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <motion.h1
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-bold text-gray-800 dark:text-white"
                >
                    Dashboard
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-gray-500 dark:text-gray-400 mt-1"
                >
                    Welcome back! Here's an overview of your learning progress.
                </motion.p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard icon={FileText} label="Documents" value={stats.documents || 0} colorClass="text-blue-600" bgClass="bg-blue-50 dark:bg-blue-900/30" path="/docs" delay={0} />
                    <StatCard icon={Layers} label="Flashcard Decks" value={stats.flashcards || 0} colorClass="text-amber-600" bgClass="bg-amber-50 dark:bg-amber-900/30" path="/flashcards" delay={0.1} />
                    <StatCard icon={BrainCircuit} label="Quizzes Taken" value={stats.quizzes || 0} colorClass="text-purple-600" bgClass="bg-purple-50 dark:bg-purple-900/30" path="/quiz" delay={0.2} />
                    <StatCard icon={MessageSquare} label="Interviews" value={stats.interviews || 0} colorClass="text-emerald-600" bgClass="bg-emerald-50 dark:bg-emerald-900/30" path="/interview" delay={0.3} />
                </div>
            )}

            {/* Gamification Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <GamificationCard />
                </div>
                <div className="lg:col-span-2">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 h-full"
                    >
                        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                            <BrainCircuit size={20} className="text-indigo-600 dark:text-indigo-400" />
                            Quiz Performance History
                        </h2>
                        <QuizHistoryChart history={quizHistory} />
                    </motion.div>
                </div>
            </div>

            {/* Quick Actions & Daily Tip Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions - spans 2 columns */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800"
                >
                    <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link to="/docs" className="block p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center gap-4 group">
                            <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                <Plus size={20} />
                            </div>
                            <div>
                                <span className="font-semibold block text-gray-800 dark:text-gray-200">Upload Document</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Start learning from a PDF</span>
                            </div>
                        </Link>
                        <Link to="/interview" className="block p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all flex items-center gap-4 group">
                            <div className="bg-emerald-100 dark:bg-emerald-900/50 p-3 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                <MessageSquare size={20} />
                            </div>
                            <div>
                                <span className="font-semibold block text-gray-800 dark:text-gray-200">Mock Interview</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Practice with AI interviewer</span>
                            </div>
                        </Link>
                        <Link to="/flashcards" className="block p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-amber-200 dark:hover:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all flex items-center gap-4 group">
                            <div className="bg-amber-100 dark:bg-amber-900/50 p-3 rounded-xl text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                                <Layers size={20} />
                            </div>
                            <div>
                                <span className="font-semibold block text-gray-800 dark:text-gray-200">Study Flashcards</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Review your decks</span>
                            </div>
                        </Link>
                        <Link to="/quiz" className="block p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all flex items-center gap-4 group">
                            <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-xl text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                                <BrainCircuit size={20} />
                            </div>
                            <div>
                                <span className="font-semibold block text-gray-800 dark:text-gray-200">Take a Quiz</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Test your knowledge</span>
                            </div>
                        </Link>
                    </div>
                </motion.div>

                {/* Daily Learning Tip */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden flex flex-col justify-between"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl"></div>
                    <div>
                        <h2 className="text-xl font-bold mb-3 relative z-10">💡 Daily Learning Tip</h2>
                        <p className="opacity-90 leading-relaxed text-sm relative z-10">
                            Consistency is key! Creating a quick 5-question quiz after reading helps reinforce memory by 40%.
                        </p>
                    </div>
                    <Link to="/quiz" className="mt-6 inline-flex items-center justify-center bg-white text-indigo-600 px-5 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition shadow-sm relative z-10 w-full">
                        Generate Quiz
                    </Link>
                </motion.div>
            </div>
        </div>
    );
};

export default Dashboard;
