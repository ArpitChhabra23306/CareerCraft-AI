import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, BrainCircuit, FileText, Layers, MessageSquare, Zap, Moon, Sun } from 'lucide-react';
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow card-hover"
    >
        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
            <Icon size={24} />
        </div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
    </motion.div>
);

const Home = () => {
    const { user } = useContext(AuthContext);
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        setIsDark(document.documentElement.classList.contains('dark'));
    }, []);

    const toggleTheme = () => {
        document.documentElement.classList.toggle('dark');
        setIsDark(!isDark);
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-700 dark:selection:text-indigo-300">
            {/* Navbar */}
            <nav className="fixed w-full bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <BrainCircuit className="text-indigo-600 dark:text-indigo-400 h-8 w-8" />
                            <span className="text-xl font-bold gradient-text">
                                AI Learn
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                title="Toggle Dark Mode"
                            >
                                {isDark ? (
                                    <Sun className="h-5 w-5 text-yellow-500" />
                                ) : (
                                    <Moon className="h-5 w-5 text-indigo-600" />
                                )}
                            </button>
                            {user ? (
                                <Link
                                    to="/dashboard"
                                    className="bg-indigo-600 text-white px-5 py-2 rounded-full font-medium hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
                                >
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">
                                        Login
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="bg-indigo-600 text-white px-5 py-2 rounded-full font-medium hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
                                    >
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                    <div className="absolute top-20 right-0 w-96 h-96 bg-purple-300 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 dark:opacity-20 animate-blob"></div>
                    <div className="absolute top-20 -left-20 w-96 h-96 bg-indigo-300 dark:bg-indigo-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 dark:opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-32 left-20 w-96 h-96 bg-pink-300 dark:bg-pink-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 dark:opacity-20 animate-blob animation-delay-4000"></div>
                </div>

                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6"
                    >
                        Master Your Learning <br />
                        <span className="gradient-text">
                            Powered by AI
                        </span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-400 mb-10"
                    >
                        Upload documents, generate quizzes, study with flashcards, and practice interviews—all enhanced by intelligent AI to help you learn faster.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="flex justify-center gap-4"
                    >
                        {user ? (
                            <Link
                                to="/dashboard"
                                className="group bg-indigo-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center gap-2"
                            >
                                Go to Dashboard <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        ) : (
                            <Link
                                to="/register"
                                className="group bg-indigo-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center gap-2"
                            >
                                Start Your Journey <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        )}
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-gray-50/50 dark:bg-gray-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Everything You Need to Excel</h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Our platform integrates powerful tools to transform how you study and prepare for your career.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <FeatureCard
                            icon={FileText}
                            title="Smart Documents"
                            description="Upload PDFs and notes. Our AI analyzes them to extract key insights and summaries instantly."
                            delay={0.1}
                        />
                        <FeatureCard
                            icon={Layers}
                            title="AI Flashcards"
                            description="Automatically generate study decks from your materials to reinforce your memory retention."
                            delay={0.2}
                        />
                        <FeatureCard
                            icon={Zap}
                            title="Instant Quizzes"
                            description="Test your knowledge with AI-generated quizzes tailored to your specific study documents."
                            delay={0.3}
                        />
                        <FeatureCard
                            icon={MessageSquare}
                            title="Mock Interviews"
                            description="Practice with a realistic AI interviewer that adapts to your role, difficulty, and skills."
                            delay={0.4}
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4">
                <div className="max-w-5xl mx-auto bg-gradient-to-r from-indigo-600 to-violet-700 rounded-3xl p-10 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>

                    <h2 className="text-3xl md:text-5xl font-bold mb-6 relative z-10">Ready to Transform Your Learning?</h2>
                    <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto relative z-10">
                        Join thousands of students and professionals who are leveling up their skills with AI Learn.
                    </p>
                    <Link
                        to="/register"
                        className="inline-block bg-white text-indigo-600 px-8 py-4 rounded-full text-lg font-bold hover:bg-gray-100 transition-colors shadow-lg relative z-10"
                    >
                        Create Free Account
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 py-12">
                <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex justify-center items-center gap-2 mb-4">
                        <BrainCircuit className="text-indigo-600 dark:text-indigo-400 h-6 w-6" />
                        <span className="text-lg font-bold text-gray-800 dark:text-white">AI Learn</span>
                    </div>
                    <p>&copy; {new Date().getFullYear()} AI Learn Platform. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Home;
