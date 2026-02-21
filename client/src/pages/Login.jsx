import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, BrainCircuit, ArrowRight, FileText, Zap, MessageSquare } from 'lucide-react';

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
            // If user hasn't verified their email, redirect to verify page
            if (err.response?.data?.requiresVerification) {
                navigate('/verify-email', { state: { email: err.response.data.email || email } });
                return;
            }
            setError(err.response?.data?.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white dark:bg-[#0a0a0a] transition-colors duration-500">
            {/* Left Panel — Minimal Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#111] dark:bg-[#eee] relative overflow-hidden">
                <div className="relative z-10 flex flex-col justify-center items-center p-16 w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="max-w-sm"
                    >
                        {/* Logo */}
                        <div className="flex items-center gap-3 mb-16">
                            <div className="w-10 h-10 bg-white/10 dark:bg-[#111]/10 rounded-xl flex items-center justify-center">
                                <BrainCircuit className="h-5 w-5 text-white dark:text-[#111]" strokeWidth={1.5} />
                            </div>
                            <span className="text-[15px] font-semibold text-white dark:text-[#111] tracking-[-0.02em]">CareerCraft AI</span>
                        </div>

                        {/* Heading */}
                        <h1 className="text-4xl font-bold text-white dark:text-[#111] tracking-[-0.03em] leading-[1.1] mb-4">
                            Welcome back.
                        </h1>
                        <p className="text-white/40 dark:text-[#111]/40 text-[14px] leading-relaxed mb-16">
                            Continue your learning journey and achieve your career goals.
                        </p>

                        {/* Feature list */}
                        <div className="space-y-4">
                            {[
                                { icon: FileText, text: 'Upload documents & learn smarter' },
                                { icon: Zap, text: 'AI-generated quizzes & flashcards' },
                                { icon: MessageSquare, text: 'Practice with AI mock interviews' },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                                    className="flex items-center gap-4"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-white/5 dark:bg-[#111]/5 border border-white/10 dark:border-[#111]/10 flex items-center justify-center flex-shrink-0">
                                        <item.icon size={16} className="text-white/50 dark:text-[#111]/50" strokeWidth={1.5} />
                                    </div>
                                    <span className="text-[13px] text-white/60 dark:text-[#111]/60">{item.text}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Panel — Form */}
            <div className="flex-1 flex items-center justify-center p-8 relative">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-sm"
                >
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-2.5 mb-12">
                        <div className="w-8 h-8 bg-[#111] dark:bg-[#eee] rounded-lg flex items-center justify-center">
                            <BrainCircuit className="h-4 w-4 text-white dark:text-[#111]" strokeWidth={1.5} />
                        </div>
                        <span className="text-[15px] font-semibold text-[#111] dark:text-[#eee] tracking-[-0.02em]">CareerCraft AI</span>
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-[#111] dark:text-[#eee] tracking-[-0.03em]">Sign in</h2>
                        <p className="text-[#999] text-[13px] mt-2">Enter your credentials to access your account</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#fef2f2] dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 text-[13px] border border-red-100 dark:border-red-500/20 flex items-center gap-2"
                        >
                            <span>⚠</span> {error}
                        </motion.div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-[12px] font-semibold text-[#111] dark:text-[#eee] uppercase tracking-[0.05em] mb-2">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ccc] dark:text-[#555] h-4 w-4" strokeWidth={1.5} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 border border-[#f0f0f0] dark:border-[#1a1a1a] rounded-xl outline-none transition-all bg-[#fafafa] dark:bg-[#111] text-[#111] dark:text-[#eee] placeholder-[#ccc] dark:placeholder-[#555] text-[14px] focus:border-[#111] dark:focus:border-[#eee] focus:bg-white dark:focus:bg-[#151515]"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-[#111] dark:text-[#eee] uppercase tracking-[0.05em] mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ccc] dark:text-[#555] h-4 w-4" strokeWidth={1.5} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 border border-[#f0f0f0] dark:border-[#1a1a1a] rounded-xl outline-none transition-all bg-[#fafafa] dark:bg-[#111] text-[#111] dark:text-[#eee] placeholder-[#ccc] dark:placeholder-[#555] text-[14px] focus:border-[#111] dark:focus:border-[#eee] focus:bg-white dark:focus:bg-[#151515]"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <div className="flex justify-end mt-1.5">
                                <Link
                                    to="/forgot-password"
                                    className="text-[12px] text-[#999] hover:text-[#111] dark:hover:text-[#eee] transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#111] dark:bg-[#eee] text-white dark:text-[#111] py-3 rounded-xl text-[14px] font-semibold hover:bg-[#333] dark:hover:bg-[#ccc] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-2"
                        >
                            {loading ? (
                                <span className="animate-spin h-4 w-4 border-2 border-white dark:border-[#111] border-t-transparent dark:border-t-transparent rounded-full"></span>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="group-hover:translate-x-0.5 transition-transform" size={16} strokeWidth={2} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-[#f0f0f0] dark:border-[#1a1a1a]"></div>
                            </div>
                            <div className="relative flex justify-center text-[12px]">
                                <span className="px-4 bg-white dark:bg-[#0a0a0a] text-[#ccc] dark:text-[#555]">New to CareerCraft AI?</span>
                            </div>
                        </div>
                        <Link
                            to="/register"
                            className="mt-4 w-full flex items-center justify-center gap-2 py-3 border border-[#f0f0f0] dark:border-[#1a1a1a] rounded-xl text-[#111] dark:text-[#eee] text-[13px] font-semibold hover:bg-[#fafafa] dark:hover:bg-[#111] transition-colors"
                        >
                            Create an account
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
