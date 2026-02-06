import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, BrainCircuit, ArrowRight, Sparkles, FileText, Zap, MessageSquare } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
                {/* Background patterns */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center max-w-md"
                    >
                        <div className="inline-flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                                <BrainCircuit className="h-7 w-7" />
                            </div>
                            <span className="text-2xl font-bold">CareerCraft AI</span>
                        </div>

                        <h1 className="text-4xl font-bold mb-4">Welcome back!</h1>
                        <p className="text-indigo-100 text-lg mb-12">
                            Continue your learning journey and achieve your career goals.
                        </p>

                        {/* Feature highlights */}
                        <div className="space-y-4 text-left">
                            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <FileText size={20} />
                                </div>
                                <span>Upload documents & learn smarter</span>
                            </div>
                            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <Zap size={20} />
                                </div>
                                <span>AI-generated quizzes & flashcards</span>
                            </div>
                            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <MessageSquare size={20} />
                                </div>
                                <span>Practice with AI mock interviews</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-gray-950 relative">
                {/* Background decoration for mobile */}
                <div className="lg:hidden absolute top-0 right-0 w-64 h-64 bg-indigo-100 dark:bg-indigo-900/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="lg:hidden absolute bottom-0 left-0 w-64 h-64 bg-purple-100 dark:bg-purple-900/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md relative z-10"
                >
                    {/* Mobile logo */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                                <BrainCircuit className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xl font-bold gradient-text">CareerCraft AI</span>
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Sign in</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Enter your credentials to access your account</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 text-sm border border-red-100 dark:border-red-900 flex items-center gap-2"
                        >
                            <span className="text-red-500">⚠</span> {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                        >
                            {loading ? (
                                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white dark:bg-gray-950 text-gray-500">New to CareerCraft AI?</span>
                            </div>
                        </div>
                        <Link
                            to="/register"
                            className="mt-6 w-full flex items-center justify-center gap-2 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                        >
                            <Sparkles size={18} className="text-indigo-500" />
                            Create an account
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
