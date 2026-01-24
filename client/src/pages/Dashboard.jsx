import { useEffect, useState } from 'react';
import api from '../utils/api';
import { FileText, Layers, BrainCircuit, MessageSquare, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ icon: Icon, label, value, colorClass, path }) => (
    <Link to={path} className="bg-white dark:bg-black p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center space-x-4 hover:shadow-md transition cursor-pointer hover:scale-[1.02] transform duration-200">
        <div className={`p-3 rounded-full ${colorClass} bg-opacity-10 dark:bg-opacity-20`}>
            <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
        </div>
        <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{label}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
        </div>
    </Link>
);

const QuizHistoryChart = ({ history }) => {
    if (!history || history.length === 0) return (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <BrainCircuit size={48} className="mb-2 opacity-50" />
            <p>No quiz history yet. Take a quiz to see your progress!</p>
        </div>
    );

    // Reverse to show oldest to newest on graph
    const data = [...history].reverse();
    const maxScore = 100; // Assuming percentage

    return (
        <div className="flex items-end space-x-2 h-48 pt-6">
            {data.map((result, i) => (
                <div key={i} className="flex-1 flex flex-col items-center group relative">
                    <div
                        className="w-full bg-indigo-500 rounded-t-md hover:bg-indigo-600 transition-all cursor-pointer relative"
                        style={{ height: `${result.percentage}%` }}
                    >
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                            {result.quizTitle}: {Math.round(result.percentage)}%
                        </div>
                    </div>
                    <span className="text-xs text-gray-400 mt-2 truncate w-full text-center">
                        {new Date(result.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                </div>
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

    if (loading) return <div className="p-8">Loading dashboard...</div>;

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back! Here's an overview of your learning progress.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={FileText} label="Documents" value={stats.documents || 0} colorClass="text-blue-600 bg-blue-50" path="/docs" />
                <StatCard icon={Layers} label="Flashcard Decks" value={stats.flashcards || 0} colorClass="text-yellow-600 bg-yellow-50" path="/flashcards" />
                <StatCard icon={BrainCircuit} label="Quizzes Taken" value={stats.quizzes || 0} colorClass="text-purple-600 bg-purple-50" path="/quiz" />
                <StatCard icon={MessageSquare} label="Interviews" value={stats.interviews || 0} colorClass="text-green-600 bg-green-50" path="/interview" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Section - Spans 2 cols */}
                <div className="lg:col-span-2 bg-white dark:bg-black p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                        <BrainCircuit size={20} className="text-indigo-600" />
                        Quiz Performance History
                    </h2>
                    <QuizHistoryChart history={quizHistory} />
                </div>

                {/* Left Column for Quick Actions & Tip */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-black p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Quick Actions</h2>
                        <div className="space-y-4">
                            <Link to="/docs" className="block w-full text-left p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition flex items-center gap-4 group">
                                <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-lg text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition"><Plus size={20} /></div>
                                <div>
                                    <span className="font-semibold block text-gray-800 dark:text-gray-200">Upload New Document</span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Start learning from a new PDF</span>
                                </div>
                            </Link>
                            <Link to="/interview" className="block w-full text-left p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-green-200 hover:bg-green-50 dark:hover:bg-green-900/20 transition flex items-center gap-4 group">
                                <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-lg text-green-600 dark:text-green-400 group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition"><MessageSquare size={20} /></div>
                                <div>
                                    <span className="font-semibold block text-gray-800 dark:text-gray-200">Start Mock Interview</span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Practice with AI interviewer</span>
                                </div>
                            </Link>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-xl shadow-lg text-white flex flex-col justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">Daily Learning Tip</h2>
                            <p className="opacity-90 leading-relaxed">
                                Consistency is key! Creating a quick 5-question quiz after reading a document helps reinforce memory retention by 40%.
                            </p>
                        </div>
                        <Link to="/quiz" className="mt-6 self-start bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition shadow-sm">
                            Generate a Quiz
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
