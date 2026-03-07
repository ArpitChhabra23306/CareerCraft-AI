import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { BrainCircuit, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/forgot-password', { email });
            setSent(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-[#F5F2EA] dark:bg-[#0F1115] transition-colors duration-500">
            {/* Left Panel */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#0F1115] dark:bg-[#F5F2EA] relative overflow-hidden">
                <div className="relative z-10 flex flex-col justify-center items-center p-16 w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="max-w-sm"
                    >
                        <div className="flex items-center gap-3 mb-16">
                            <div className="w-10 h-10 bg-[#F5F2EA]/10 dark:bg-[#0F1115]/10 rounded-xl flex items-center justify-center">
                                <BrainCircuit className="h-5 w-5 text-white dark:text-[#0F1115]" strokeWidth={1.5} />
                            </div>
                            <span className="text-[15px] font-semibold text-white dark:text-[#0F1115] tracking-[-0.02em]">CareerCraft AI</span>
                        </div>

                        <h1 className="text-4xl font-bold text-white dark:text-[#0F1115] tracking-[-0.03em] leading-[1.1] mb-4">
                            Forgot your password?
                        </h1>
                        <p className="text-white/40 dark:text-[#0F1115]/40 text-[14px] leading-relaxed">
                            No worries — it happens. Enter your email and we'll send you a link to reset it.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Right Panel */}
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

                    {sent ? (
                        /* Success State */
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                        >
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#E3DAC6] dark:bg-[#2A2F3A] flex items-center justify-center mb-6">
                                <CheckCircle className="text-[#0F1115] dark:text-[#F5F2EA]" size={28} strokeWidth={1.5} />
                            </div>
                            <h2 className="text-2xl font-bold text-[#0F1115] dark:text-[#F5F2EA] tracking-[-0.03em] mb-2">Check your email</h2>
                            <p className="text-[#8D8474] text-[13px] mb-8">
                                If an account exists for <span className="text-[#0F1115] dark:text-[#F5F2EA] font-medium">{email}</span>, you'll receive a password reset link shortly.
                            </p>
                            <p className="text-[#A79F90] dark:text-[#A79F90] text-[12px] mb-6">
                                Don't see it? Check your spam folder.
                            </p>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 text-[#0F1115] dark:text-[#F5F2EA] text-[13px] font-semibold hover:underline"
                            >
                                <ArrowLeft size={14} strokeWidth={2} />
                                Back to Sign In
                            </Link>
                        </motion.div>
                    ) : (
                        /* Form State */
                        <>
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-[#0F1115] dark:text-[#F5F2EA] tracking-[-0.03em]">Reset password</h2>
                                <p className="text-[#8D8474] text-[13px] mt-2">Enter your email to receive a reset link</p>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-[#fef2f2] dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 text-[13px] border border-red-100 dark:border-red-500/20 flex items-center gap-2"
                                >
                                    <span>⚠</span> {error}
                                </motion.div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
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

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#0F1115] dark:bg-[#F5F2EA] text-white dark:text-[#0F1115] py-3 rounded-xl text-[14px] font-semibold hover:bg-[#E6C55A] dark:hover:bg-[#B8B1A3] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <span className="animate-spin h-4 w-4 border-2 border-white dark:border-[#0F1115] border-t-transparent rounded-full"></span>
                                    ) : (
                                        'Send Reset Link'
                                    )}
                                </button>
                            </form>

                            <p className="mt-8 text-center text-[13px] text-[#8D8474]">
                                Remember your password?{' '}
                                <Link to="/login" className="text-[#0F1115] dark:text-[#F5F2EA] font-semibold hover:underline transition-colors">
                                    Sign in
                                </Link>
                            </p>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default ForgotPassword;
