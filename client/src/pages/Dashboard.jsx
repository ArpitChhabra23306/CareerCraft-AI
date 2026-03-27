import { useEffect, useState, useContext } from 'react';
import api from '../utils/api';
import { FileText, Layers, BrainCircuit, MessageSquare, Plus, TrendingUp, Crown, Sparkles, ArrowUpRight, Zap, Target, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import GamificationCard from '../components/GamificationCard';

const StatCard = ({ icon: Icon, label, value, path, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
    >
        <Link to={path} className="block p-6 rounded-[20px] bg-[#F2EEE4] dark:bg-[#0F1115] border border-[#E3DAC6] dark:border-[#2A2F3A] hover:bg-[#F5F2EA] dark:hover:bg-[#1F2430] hover:shadow-[0_20px_60px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)] hover:border-[#D6CCB5] dark:hover:border-[#2A2F3A] hover:-translate-y-0.5 transition-all duration-500 group">
            <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#E3DAC6] dark:bg-[#2A2F3A] border border-[#D6CCB5] dark:border-[#2A2F3A] flex items-center justify-center group-hover:bg-[#0F1115] dark:group-hover:bg-[#F5F2EA] group-hover:border-[#0F1115] dark:group-hover:border-[#F5F2EA] transition-all duration-500">
                    <Icon size={18} strokeWidth={1.5} className="text-[#7C7365] group-hover:text-white dark:group-hover:text-[#0F1115] transition-colors duration-500" />
                </div>
                <ArrowUpRight size={14} className="text-[#B8B1A3] dark:text-[#8D8474] group-hover:text-[#0F1115] dark:group-hover:text-[#F5F2EA] transition-colors duration-500" strokeWidth={1.5} />
            </div>
            <div className="mt-4">
                <p className="text-3xl font-bold text-[#0F1115] dark:text-[#F5F2EA] tracking-tight">{value}</p>
                <p className="text-[#8D8474] text-[12px] mt-1 font-medium">{label}</p>
            </div>
        </Link>
    </motion.div>
);

const SkeletonCard = () => (
    <div className="p-6 rounded-[20px] bg-[#F2EEE4] dark:bg-[#0F1115] border border-[#E3DAC6] dark:border-[#2A2F3A]">
        <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#E3DAC6] dark:bg-[#2A2F3A] animate-pulse"></div>
            <div className="w-4 h-4 rounded bg-[#E3DAC6] dark:bg-[#2A2F3A] animate-pulse"></div>
        </div>
        <div className="mt-4 space-y-2">
            <div className="h-8 w-14 rounded bg-[#E3DAC6] dark:bg-[#2A2F3A] animate-pulse"></div>
            <div className="h-3 w-20 rounded bg-[#E3DAC6] dark:bg-[#2A2F3A] animate-pulse"></div>
        </div>
    </div>
);

// Subscription Banner Component
const SubscriptionBanner = ({ subscription }) => {
    const plan = (subscription?.subscription?.plan || 'free').toLowerCase();
    const isPro = plan === 'pro';
    const isEnterprise = plan === 'enterprise';
    const isPaid = isPro || isEnterprise;

    if (isPaid) {
        return (
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[20px] p-5 mb-6 bg-[#0F1115] dark:bg-[#F5F2EA]"
            >
                <div className="absolute inset-0 opacity-20" style={{
                    background: 'radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.1), transparent 60%)',
                }} />
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#F5F2EA]/10 dark:bg-[#0F1115]/10 flex items-center justify-center">
                            <Crown size={16} className="text-white dark:text-[#0F1115]" strokeWidth={1.5} />
                        </div>
                        <div>
                            <span className="text-white dark:text-[#0F1115] font-semibold text-[14px]">{isEnterprise ? 'Enterprise' : 'Pro'} Plan Active</span>
                            <p className="text-white/40 dark:text-[#0F1115]/40 text-[12px]">Unlimited access to all features</p>
                        </div>
                    </div>
                    <Link to="/pricing" className="bg-[#F5F2EA]/10 dark:bg-[#0F1115]/10 hover:bg-[#F5F2EA]/20 dark:hover:bg-[#0F1115]/20 text-white dark:text-[#0F1115] px-4 py-2 rounded-xl text-[12px] font-medium transition-all duration-300 flex items-center gap-1.5">
                        Manage <ArrowUpRight size={12} strokeWidth={1.5} />
                    </Link>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[20px] p-5 mb-6 bg-[#F2EEE4] dark:bg-[#0F1115] border border-[#E3DAC6] dark:border-[#2A2F3A]"
        >
            <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#E3DAC6] dark:bg-[#2A2F3A] border border-[#D6CCB5] dark:border-[#2A2F3A] flex items-center justify-center">
                        <Sparkles size={16} className="text-[#7C7365]" strokeWidth={1.5} />
                    </div>
                    <div>
                        <span className="text-[#0F1115] dark:text-[#F5F2EA] font-semibold text-[14px]">Upgrade to Pro</span>
                        <p className="text-[#8D8474] text-[12px]">Unlock unlimited documents, AI chats & interviews</p>
                    </div>
                </div>
                <Link to="/pricing">
                    <motion.div
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="bg-[#0F1115] dark:bg-[#F5F2EA] text-white dark:text-[#0F1115] px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-300 flex items-center gap-2 cursor-pointer"
                    >
                        <Zap size={14} strokeWidth={1.5} /> Upgrade Now
                    </motion.div>
                </Link>
            </div>
        </motion.div>
    );
};

const QuickActionCard = ({ to, icon: Icon, title, description }) => (
    <Link to={to} className="group flex items-center gap-4 p-4 rounded-[16px] bg-[#F2EEE4] dark:bg-[#0F1115] border border-[#E3DAC6] dark:border-[#2A2F3A] hover:bg-[#F5F2EA] dark:hover:bg-[#1F2430] hover:shadow-[0_12px_40px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:border-[#D6CCB5] dark:hover:border-[#2A2F3A] transition-all duration-500">
        <div className="w-10 h-10 rounded-xl bg-[#E3DAC6] dark:bg-[#2A2F3A] border border-[#D6CCB5] dark:border-[#2A2F3A] flex items-center justify-center group-hover:bg-[#0F1115] dark:group-hover:bg-[#F5F2EA] group-hover:border-[#0F1115] dark:group-hover:border-[#F5F2EA] transition-all duration-500 shrink-0">
            <Icon size={18} strokeWidth={1.5} className="text-[#7C7365] group-hover:text-white dark:group-hover:text-[#0F1115] transition-colors duration-500" />
        </div>
        <div className="flex-1 min-w-0">
            <span className="font-semibold block text-[#0F1115] dark:text-[#F5F2EA] text-[13px]">{title}</span>
            <span className="text-[12px] text-[#8D8474]">{description}</span>
        </div>
        <ArrowRight size={14} className="text-[#B8B1A3] dark:text-[#8D8474] group-hover:text-[#0F1115] dark:group-hover:text-[#F5F2EA] group-hover:translate-x-0.5 transition-all duration-500 shrink-0" strokeWidth={1.5} />
    </Link>
);

const QuizHistoryChart = ({ history }) => {
    if (!history || history.length === 0) return (
        <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#E3DAC6] dark:bg-[#2A2F3A] border border-[#D6CCB5] dark:border-[#2A2F3A] flex items-center justify-center mb-4">
                <BrainCircuit size={24} className="text-[#7C7365]" strokeWidth={1.5} />
            </div>
            <p className="text-[#0F1115] dark:text-[#F5F2EA] font-medium text-[14px] mb-1">No quiz history yet</p>
            <p className="text-[#8D8474] text-[12px]">Take a quiz to see your progress!</p>
            <Link to="/quiz" className="mt-4 text-[#0F1115] dark:text-[#F5F2EA] text-[13px] font-medium hover:opacity-70 flex items-center gap-1 transition-opacity">
                Take your first quiz <ArrowRight size={14} strokeWidth={1.5} />
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
                    transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    className="flex-1 flex flex-col items-center group relative min-w-0"
                >
                    <div className="w-full bg-[#0F1115] dark:bg-[#F5F2EA] rounded-t-lg hover:bg-[#E6C55A] dark:hover:bg-[#B8B1A3] transition-all duration-300 cursor-pointer relative h-full">
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#0F1115] dark:bg-[#F5F2EA] text-white dark:text-[#0F1115] text-[11px] py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                            {result.quizTitle}: {Math.round(result.percentage)}%
                        </div>
                    </div>
                    <span className="text-[10px] text-[#A79F90] dark:text-[#B8B1A3] mt-2 truncate w-full text-center">
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
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="space-y-6">
            {/* Header with greeting */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl md:text-3xl font-bold text-[#0F1115] dark:text-[#F5F2EA] tracking-[-0.03em]"
                    >
                        {greeting()}, {user?.username || 'there'}! 👋
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-[#8D8474] mt-1 text-[14px]"
                    >
                        Here's an overview of your learning journey.
                    </motion.p>
                </div>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-[12px] text-[#A79F90] dark:text-[#B8B1A3]"
                >
                    <Clock size={14} strokeWidth={1.5} />
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </motion.div>
            </div>

            {/* Subscription Banner */}
            <SubscriptionBanner subscription={subscription} />

            {/* Stats Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={FileText} label="Documents" value={stats.documents || 0} path="/docs" delay={0} />
                    <StatCard icon={Layers} label="Flashcard Decks" value={stats.flashcards || 0} path="/flashcards" delay={0.06} />
                    <StatCard icon={BrainCircuit} label="Quizzes Taken" value={stats.quizzes || 0} path="/quiz" delay={0.12} />
                    <StatCard icon={MessageSquare} label="Interviews" value={stats.interviews || 0} path="/interview" delay={0.18} />
                </div>
            )}

            {/* Gamification + Quiz History */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1">
                    <GamificationCard />
                </div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="lg:col-span-2 p-6 rounded-[20px] bg-[#F2EEE4] dark:bg-[#0F1115] border border-[#E3DAC6] dark:border-[#2A2F3A]"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-[15px] font-semibold text-[#0F1115] dark:text-[#F5F2EA] flex items-center gap-2">
                            <Target size={16} strokeWidth={1.5} className="text-[#7C7365]" />
                            Quiz Performance
                        </h2>
                        <Link to="/quiz" className="text-[12px] text-[#8D8474] hover:text-[#0F1115] dark:hover:text-[#F5F2EA] font-medium flex items-center gap-1 transition-colors">
                            View all <ArrowRight size={12} strokeWidth={1.5} />
                        </Link>
                    </div>
                    <QuizHistoryChart history={quizHistory} />
                </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <h2 className="text-[15px] font-semibold mb-3 text-[#0F1115] dark:text-[#F5F2EA] flex items-center gap-2">
                    <Zap size={16} strokeWidth={1.5} className="text-[#7C7365]" />
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <QuickActionCard to="/docs" icon={Plus} title="Upload Document" description="Start learning from a PDF" />
                    <QuickActionCard to="/quiz" icon={BrainCircuit} title="Take a Quiz" description="Test your knowledge" />
                    <QuickActionCard to="/flashcards" icon={Layers} title="Study Flashcards" description="Review your decks" />
                    <QuickActionCard to="/interview" icon={MessageSquare} title="Mock Interview" description="Practice with AI" />
                </div>
            </motion.div>

            {/* Daily Tip */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-8 rounded-[20px] bg-[#0F1115] dark:bg-[#F5F2EA] text-white dark:text-[#0F1115] relative overflow-hidden"
            >
                <div className="absolute inset-0 opacity-20" style={{
                    background: 'radial-gradient(ellipse at 70% 0%, rgba(255,255,255,0.1), transparent 60%)',
                }} />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#F5F2EA]/10 dark:bg-[#0F1115]/10 flex items-center justify-center shrink-0">
                            <Sparkles size={18} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="text-[15px] font-semibold mb-1">💡 Pro Tip</h2>
                            <p className="text-white/50 dark:text-[#0F1115]/50 text-[13px] leading-relaxed">
                                Consistency is key! Taking a quick 5-question quiz after reading helps reinforce memory by 40%.
                            </p>
                        </div>
                    </div>
                    <Link to="/quiz">
                        <motion.div
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="bg-[#F5F2EA] dark:bg-[#0F1115] text-[#0F1115] dark:text-[#F5F2EA] px-6 py-3 rounded-xl text-[13px] font-semibold transition-all duration-300 whitespace-nowrap cursor-pointer"
                        >
                            Generate Quiz
                        </motion.div>
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default Dashboard;
