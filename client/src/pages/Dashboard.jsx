import { useEffect, useState, useContext } from 'react';
import api from '../utils/api';
import { FileText, Layers, BrainCircuit, MessageSquare, Plus, TrendingUp, Crown, Sparkles, ArrowUpRight, Zap, Target, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import GamificationCard from '../components/GamificationCard';

const StatCard = ({ icon: Icon, label, value, colorClass, bgClass, gradientClass, path, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
    >
        <Link to={path} className={`block relative overflow-hidden bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-all duration-300 group`}>
            {/* Gradient overlay on hover */}
            <div className={`absolute inset-0 ${gradientClass} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

            <div className="flex items-center justify-between relative z-10">
                <div className={`p-3 rounded-xl ${bgClass} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={24} className={colorClass} />
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-gray-400 dark:text-gray-500 group-hover:text-green-500 transition-colors">
                    <TrendingUp size={14} />
                    <span className="hidden group-hover:inline">View</span>
                </div>
            </div>
            <div className="mt-4 relative z-10">
                <p className="text-4xl font-bold text-gray-800 dark:text-white">{value}</p>
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
            <div className="h-10 w-16 rounded skeleton"></div>
            <div className="h-4 w-24 rounded skeleton"></div>
        </div>
    </div>
);

// Subscription Banner Component
const SubscriptionBanner = ({ subscription }) => {
    const plan = subscription?.plan || 'free';
    const isPro = plan === 'pro';
    const isEnterprise = plan === 'enterprise';
    const isPaid = isPro || isEnterprise;

    if (isPaid) {
        return (
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative overflow-hidden rounded-2xl p-4 mb-6 ${isEnterprise
                        ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500'
                        : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600'
                    }`}
            >
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Crown className="text-white" size={20} />
                        </div>
                        <div>
                            <span className="text-white font-bold text-lg">{isEnterprise ? 'Enterprise' : 'Pro'} Plan Active</span>
                            <p className="text-white/80 text-sm">Enjoy unlimited access to all features</p>
                        </div>
                    </div>
                    <Link to="/pricing" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                        Manage <ArrowUpRight size={14} />
                    </Link>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-4 mb-6 border border-gray-700"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl" />
            <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-500/20 p-2 rounded-lg">
                        <Sparkles className="text-indigo-400" size={20} />
                    </div>
                    <div>
                        <span className="text-white font-bold">Upgrade to Pro</span>
                        <p className="text-gray-400 text-sm">Unlock unlimited documents, AI chats & mock interviews</p>
                    </div>
                </div>
                <Link to="/pricing" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center gap-2">
                    <Zap size={16} /> Upgrade Now
                </Link>
            </div>
        </motion.div>
    );
};

const QuickActionCard = ({ to, icon: Icon, title, description, colorClass, bgClass, borderColorClass }) => (
    <Link to={to} className={`block p-4 rounded-xl border ${borderColorClass} bg-white dark:bg-gray-900 hover:shadow-lg transition-all flex items-center gap-4 group`}>
        <div className={`${bgClass} p-3 rounded-xl ${colorClass} group-hover:scale-110 transition-transform`}>
            <Icon size={20} />
        </div>
        <div className="flex-1">
            <span className="font-semibold block text-gray-800 dark:text-gray-200">{title}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{description}</span>
        </div>
        <ArrowRight size={18} className="text-gray-300 dark:text-gray-600 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
    </Link>
);

const QuizHistoryChart = ({ history }) => {
    if (!history || history.length === 0) return (
        <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-2xl mb-4 shadow-lg shadow-purple-500/20">
                <BrainCircuit size={40} className="text-white" />
            </div>
            <p className="text-gray-600 dark:text-gray-300 font-medium mb-1">No quiz history yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">Take a quiz to see your progress!</p>
            <Link to="/quiz" className="mt-4 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline flex items-center gap-1">
                Take your first quiz <ArrowRight size={14} />
            </Link>
        </div>
    );

    const data = [...history].reverse().slice(0, 7);

    return (
        <div className="flex items-end space-x-3 h-48 pt-6">
            {data.map((result, i) => (
                <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${result.percentage}%` }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="flex-1 flex flex-col items-center group relative min-w-0"
                >
                    <div
                        className="w-full bg-gradient-to-t from-indigo-600 to-purple-500 rounded-t-lg hover:from-indigo-500 hover:to-purple-400 transition-all cursor-pointer relative h-full shadow-lg shadow-indigo-500/10"
                    >
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-xs py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-lg">
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
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState({ documents: 0, flashcards: 0, quizzes: 0, interviews: 0 });
    const [quizHistory, setQuizHistory] = useState([]);
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, historyRes, subRes] = await Promise.all([
                    api.get('/user/stats'),
                    api.get('/quiz/history'),
                    api.get('/subscription/status').catch(() => ({ data: { plan: 'free' } }))
                ]);
                setStats(statsRes.data);
                setQuizHistory(historyRes.data);
                setSubscription(subRes.data);
            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header with greeting */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white"
                    >
                        {greeting()}, {user?.name?.split(' ')[0] || 'there'}! 👋
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-500 dark:text-gray-400 mt-1"
                    >
                        Here's an overview of your learning journey.
                    </motion.p>
                </div>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
                >
                    <Clock size={16} />
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </motion.div>
            </div>

            {/* Subscription Banner */}
            <SubscriptionBanner subscription={subscription} />

            {/* Stats Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        icon={FileText}
                        label="Documents"
                        value={stats.documents || 0}
                        colorClass="text-blue-600"
                        bgClass="bg-blue-50 dark:bg-blue-900/30"
                        gradientClass="bg-gradient-to-br from-blue-500 to-cyan-500"
                        path="/docs"
                        delay={0}
                    />
                    <StatCard
                        icon={Layers}
                        label="Flashcard Decks"
                        value={stats.flashcards || 0}
                        colorClass="text-amber-600"
                        bgClass="bg-amber-50 dark:bg-amber-900/30"
                        gradientClass="bg-gradient-to-br from-amber-500 to-orange-500"
                        path="/flashcards"
                        delay={0.1}
                    />
                    <StatCard
                        icon={BrainCircuit}
                        label="Quizzes Taken"
                        value={stats.quizzes || 0}
                        colorClass="text-purple-600"
                        bgClass="bg-purple-50 dark:bg-purple-900/30"
                        gradientClass="bg-gradient-to-br from-purple-500 to-pink-500"
                        path="/quiz"
                        delay={0.2}
                    />
                    <StatCard
                        icon={MessageSquare}
                        label="Interviews"
                        value={stats.interviews || 0}
                        colorClass="text-emerald-600"
                        bgClass="bg-emerald-50 dark:bg-emerald-900/30"
                        gradientClass="bg-gradient-to-br from-emerald-500 to-teal-500"
                        path="/interview"
                        delay={0.3}
                    />
                </div>
            )}

            {/* Gamification + Quiz History */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <GamificationCard />
                </div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Target size={20} className="text-indigo-600 dark:text-indigo-400" />
                            Quiz Performance
                        </h2>
                        <Link to="/quiz" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                            View all <ArrowRight size={14} />
                        </Link>
                    </div>
                    <QuizHistoryChart history={quizHistory} />
                </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                    <Zap size={20} className="text-yellow-500" />
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <QuickActionCard
                        to="/docs"
                        icon={Plus}
                        title="Upload Document"
                        description="Start learning from a PDF"
                        colorClass="text-blue-600 dark:text-blue-400"
                        bgClass="bg-blue-50 dark:bg-blue-900/30"
                        borderColorClass="border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800"
                    />
                    <QuickActionCard
                        to="/quiz"
                        icon={BrainCircuit}
                        title="Take a Quiz"
                        description="Test your knowledge"
                        colorClass="text-purple-600 dark:text-purple-400"
                        bgClass="bg-purple-50 dark:bg-purple-900/30"
                        borderColorClass="border-gray-100 dark:border-gray-800 hover:border-purple-200 dark:hover:border-purple-800"
                    />
                    <QuickActionCard
                        to="/flashcards"
                        icon={Layers}
                        title="Study Flashcards"
                        description="Review your decks"
                        colorClass="text-amber-600 dark:text-amber-400"
                        bgClass="bg-amber-50 dark:bg-amber-900/30"
                        borderColorClass="border-gray-100 dark:border-gray-800 hover:border-amber-200 dark:hover:border-amber-800"
                    />
                    <QuickActionCard
                        to="/interview"
                        icon={MessageSquare}
                        title="Mock Interview"
                        description="Practice with AI"
                        colorClass="text-emerald-600 dark:text-emerald-400"
                        bgClass="bg-emerald-50 dark:bg-emerald-900/30"
                        borderColorClass="border-gray-100 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-800"
                    />
                </div>
            </motion.div>

            {/* Daily Tip */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="bg-white/20 p-3 rounded-xl">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold mb-1">💡 Pro Tip</h2>
                            <p className="opacity-90 leading-relaxed">
                                Consistency is key! Taking a quick 5-question quiz after reading helps reinforce memory by 40%.
                            </p>
                        </div>
                    </div>
                    <Link to="/quiz" className="inline-flex items-center justify-center bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition shadow-lg whitespace-nowrap">
                        Generate Quiz
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default Dashboard;
