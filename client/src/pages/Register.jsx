import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, BrainCircuit, ArrowRight, Check, Shield, Rocket } from 'lucide-react';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await register(name, email, password);
            navigate('/verify-email', { state: { email } });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    const benefits = [
        'Upload documents & chat with AI',
        'Auto-generate quizzes & flashcards',
        'Practice mock interviews',
        'Track progress & earn XP',
    ];

    return (
        <div className="min-h-screen flex bg-[#F5F2EA] dark:bg-[#0F1115] transition-colors duration-500">
            {/* Left Panel — Minimal Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#0F1115] dark:bg-[#F5F2EA] relative overflow-hidden">
                <div className="relative z-10 flex flex-col justify-center items-center p-16 w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="max-w-sm"
                    >
                        {/* Logo */}
                        <div className="flex items-center gap-3 mb-16">
                            <div className="w-10 h-10 bg-[#F5F2EA]/10 dark:bg-[#0F1115]/10 rounded-xl flex items-center justify-center">
                                <BrainCircuit className="h-5 w-5 text-white dark:text-[#0F1115]" strokeWidth={1.5} />
                            </div>
                            <span className="text-[15px] font-semibold text-white dark:text-[#0F1115] tracking-[-0.02em]">CareerCraft AI</span>
                        </div>

                        {/* Heading */}
                        <h1 className="text-4xl font-bold text-white dark:text-[#0F1115] tracking-[-0.03em] leading-[1.1] mb-4">
                            Start your journey.
                        </h1>
                        <p className="text-white/40 dark:text-[#0F1115]/40 text-[14px] leading-relaxed mb-16">
                            Join thousands of learners accelerating their careers with AI.
                        </p>

                        {/* Benefits list */}
                        <div className="space-y-3">
                            {benefits.map((benefit, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                                    className="flex items-center gap-3"
                                >
                                    <div className="w-5 h-5 rounded-full bg-[#F5F2EA]/10 dark:bg-[#0F1115]/10 flex items-center justify-center flex-shrink-0">
                                        <Check size={11} className="text-white/60 dark:text-[#0F1115]/60" strokeWidth={2.5} />
                                    </div>
                                    <span className="text-[13px] text-white/60 dark:text-[#0F1115]/60">{benefit}</span>
                                </motion.div>
                            ))}
                        </div>

                        {/* Trust badges */}
                        <div className="mt-16 pt-8 border-t border-white/10 dark:border-[#0F1115]/10 flex items-center gap-8">
                            <div className="flex items-center gap-2">
                                <Shield size={14} className="text-white/30 dark:text-[#0F1115]/30" strokeWidth={1.5} />
                                <span className="text-[11px] text-white/30 dark:text-[#0F1115]/30 font-medium uppercase tracking-[0.1em]">Secure</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Rocket size={14} className="text-white/30 dark:text-[#0F1115]/30" strokeWidth={1.5} />
                                <span className="text-[11px] text-white/30 dark:text-[#0F1115]/30 font-medium uppercase tracking-[0.1em]">Free to Start</span>
                            </div>
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
                        <div className="w-8 h-8 bg-[#0F1115] dark:bg-[#F5F2EA] rounded-lg flex items-center justify-center">
                            <BrainCircuit className="h-4 w-4 text-white dark:text-[#0F1115]" strokeWidth={1.5} />
                        </div>
                        <span className="text-[15px] font-semibold text-[#0F1115] dark:text-[#F5F2EA] tracking-[-0.02em]">CareerCraft AI</span>
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-[#0F1115] dark:text-[#F5F2EA] tracking-[-0.03em]">Create account</h2>
                        <p className="text-[#8D8474] text-[13px] mt-2">Get started with your free account today</p>
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
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[12px] font-semibold text-[#0F1115] dark:text-[#F5F2EA] uppercase tracking-[0.05em] mb-2">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B8B1A3] dark:text-[#8D8474] h-4 w-4" strokeWidth={1.5} />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 border border-[#E3DAC6] dark:border-[#2A2F3A] rounded-xl outline-none transition-all bg-[#F2EEE4] dark:bg-[#0F1115] text-[#0F1115] dark:text-[#F5F2EA] placeholder-[#B8B1A3] dark:placeholder-[#8D8474] text-[14px] focus:border-[#0F1115] dark:focus:border-[#F5F2EA] focus:bg-[#F5F2EA] dark:focus:bg-[#1F2430]"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-[#0F1115] dark:text-[#F5F2EA] uppercase tracking-[0.05em] mb-2">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B8B1A3] dark:text-[#8D8474] h-4 w-4" strokeWidth={1.5} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 border border-[#E3DAC6] dark:border-[#2A2F3A] rounded-xl outline-none transition-all bg-[#F2EEE4] dark:bg-[#0F1115] text-[#0F1115] dark:text-[#F5F2EA] placeholder-[#B8B1A3] dark:placeholder-[#8D8474] text-[14px] focus:border-[#0F1115] dark:focus:border-[#F5F2EA] focus:bg-[#F5F2EA] dark:focus:bg-[#1F2430]"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-[#0F1115] dark:text-[#F5F2EA] uppercase tracking-[0.05em] mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B8B1A3] dark:text-[#8D8474] h-4 w-4" strokeWidth={1.5} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 border border-[#E3DAC6] dark:border-[#2A2F3A] rounded-xl outline-none transition-all bg-[#F2EEE4] dark:bg-[#0F1115] text-[#0F1115] dark:text-[#F5F2EA] placeholder-[#B8B1A3] dark:placeholder-[#8D8474] text-[14px] focus:border-[#0F1115] dark:focus:border-[#F5F2EA] focus:bg-[#F5F2EA] dark:focus:bg-[#1F2430]"
                                    placeholder="Min. 6 characters"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-[#0F1115] dark:text-[#F5F2EA] uppercase tracking-[0.05em] mb-2">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B8B1A3] dark:text-[#8D8474] h-4 w-4" strokeWidth={1.5} />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 border border-[#E3DAC6] dark:border-[#2A2F3A] rounded-xl outline-none transition-all bg-[#F2EEE4] dark:bg-[#0F1115] text-[#0F1115] dark:text-[#F5F2EA] placeholder-[#B8B1A3] dark:placeholder-[#8D8474] text-[14px] focus:border-[#0F1115] dark:focus:border-[#F5F2EA] focus:bg-[#F5F2EA] dark:focus:bg-[#1F2430]"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#0F1115] dark:bg-[#F5F2EA] text-white dark:text-[#0F1115] py-3 rounded-xl text-[14px] font-semibold hover:bg-[#E6C55A] dark:hover:bg-[#B8B1A3] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-2"
                        >
                            {loading ? (
                                <span className="animate-spin h-4 w-4 border-2 border-white dark:border-[#0F1115] border-t-transparent dark:border-t-transparent rounded-full"></span>
                            ) : (
                                <>
                                    Create Account
                                    <ArrowRight className="group-hover:translate-x-0.5 transition-transform" size={16} strokeWidth={2} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer links */}
                    <p className="mt-8 text-center text-[13px] text-[#8D8474]">
                        Already have an account?{' '}
                        <Link to="/login" className="text-[#0F1115] dark:text-[#F5F2EA] font-semibold hover:underline transition-colors">
                            Sign in
                        </Link>
                    </p>

                    <p className="mt-4 text-center text-[11px] text-[#B8B1A3] dark:text-[#8D8474]">
                        By creating an account, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default Register;
