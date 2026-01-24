import { useEffect, useState } from 'react';
import api from '../utils/api';
import { FileText, Layers, BrainCircuit, MessageSquare, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ icon: Icon, label, value, colorClass, path }) => (
    <Link to={path} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition cursor-pointer hover:scale-[1.02] transform duration-200">
        <div className={`p-3 rounded-full ${colorClass} bg-opacity-10`}>
            <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
        </div>
        <div>
            <p className="text-gray-500 text-sm font-medium">{label}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </Link>
);

const Dashboard = () => {
    const [stats, setStats] = useState({ documents: 0, flashcards: 0, quizzes: 0, interviews: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/user/stats');
                setStats(res.data);
            } catch (err) {
                console.error("Failed to fetch stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="p-8">Loading dashboard...</div>;

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                <p className="text-gray-500 mt-1">Welcome back! Here's an overview of your learning progress.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={FileText} label="Documents" value={stats.documents || 0} colorClass="text-blue-600 bg-blue-50" path="/docs" />
                <StatCard icon={Layers} label="Flashcard Decks" value={stats.flashcards || 0} colorClass="text-yellow-600 bg-yellow-50" path="/flashcards" />
                <StatCard icon={BrainCircuit} label="Quizzes Taken" value={stats.quizzes || 0} colorClass="text-purple-600 bg-purple-50" path="/quiz" />
                <StatCard icon={MessageSquare} label="Interviews" value={stats.interviews || 0} colorClass="text-green-600 bg-green-50" path="/interview" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-4 text-gray-800">Quick Actions</h2>
                    <div className="space-y-4">
                        <Link to="/docs" className="block w-full text-left p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition flex items-center gap-4 group">
                            <div className="bg-blue-100 p-3 rounded-lg text-blue-600 group-hover:bg-blue-200 transition"><Plus size={20} /></div>
                            <div>
                                <span className="font-semibold block text-gray-800">Upload New Document</span>
                                <span className="text-sm text-gray-500">Start learning from a new PDF</span>
                            </div>
                        </Link>
                        <Link to="/interview" className="block w-full text-left p-4 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50 transition flex items-center gap-4 group">
                            <div className="bg-green-100 p-3 rounded-lg text-green-600 group-hover:bg-green-200 transition"><MessageSquare size={20} /></div>
                            <div>
                                <span className="font-semibold block text-gray-800">Start Mock Interview</span>
                                <span className="text-sm text-gray-500">Practice with AI interviewer</span>
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
    );
};

export default Dashboard;
