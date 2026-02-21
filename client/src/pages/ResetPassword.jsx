import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { BrainCircuit, Lock, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

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
            await api.post('/auth/reset-password', { token, password });
            setSuccess(true);
            // Redirect to login after 3 seconds
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white dark:bg-[#0a0a0a] transition-colors duration-500">
            {/* Left Panel */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#111] dark:bg-[#eee] relative overflow-hidden">
                <div className="relative z-10 flex flex-col justify-center items-center p-16 w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="max-w-sm"
                    >
                        <div className="flex items-center gap-3 mb-16">
                            <div className="w-10 h-10 bg-white/10 dark:bg-[#111]/10 rounded-xl flex items-center justify-center">
                                <BrainCircuit className="h-5 w-5 text-white dark:text-[#111]" strokeWidth={1.5} />
                            </div>
                            <span className="text-[15px] font-semibold text-white dark:text-[#111] tracking-[-0.02em]">CareerCraft AI</span>
                        </div>

                        <h1 className="text-4xl font-bold text-white dark:text-[#111] tracking-[-0.03em] leading-[1.1] mb-4">
                            Set a new password.
                        </h1>
                        <p className="text-white/40 dark:text-[#111]/40 text-[14px] leading-relaxed">
                            Choose a strong password to secure your account.
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
                        <div className="w-8 h-8 bg-[#111] dark:bg-[#eee] rounded-lg flex items-center justify-center">
                            <BrainCircuit className="h-4 w-4 text-white dark:text-[#111]" strokeWidth={1.5} />
                        </div>
                        <span className="text-[15px] font-semibold text-[#111] dark:text-[#eee] tracking-[-0.02em]">CareerCraft AI</span>
                    </div>

                    {success ? (
                        /* Success State */
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                        >
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#f0f0f0] dark:bg-[#1a1a1a] flex items-center justify-center mb-6">
                                <CheckCircle className="text-[#111] dark:text-[#eee]" size={28} strokeWidth={1.5} />
                            </div>
                            <h2 className="text-2xl font-bold text-[#111] dark:text-[#eee] tracking-[-0.03em] mb-2">Password updated!</h2>
                            <p className="text-[#999] text-[13px] mb-6">
                                Your password has been reset successfully. Redirecting to login...
                            </p>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 bg-[#111] dark:bg-[#eee] text-white dark:text-[#111] px-6 py-3 rounded-xl text-[13px] font-semibold hover:bg-[#333] dark:hover:bg-[#ccc] transition-all"
                            >
                                Sign In Now <ArrowRight size={14} strokeWidth={2} />
                            </Link>
                        </motion.div>
                    ) : (
                        /* Form State */
                        <>
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-[#111] dark:text-[#eee] tracking-[-0.03em]">New password</h2>
                                <p className="text-[#999] text-[13px] mt-2">Enter your new password below</p>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-[#fef2f2] dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 text-[13px] border border-red-100 dark:border-red-500/20 flex items-center gap-2"
                                >
                                    <AlertCircle size={14} strokeWidth={1.5} /> {error}
                                </motion.div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[12px] font-semibold text-[#111] dark:text-[#eee] uppercase tracking-[0.05em] mb-2">New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ccc] dark:text-[#555] h-4 w-4" strokeWidth={1.5} />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 border border-[#f0f0f0] dark:border-[#1a1a1a] rounded-xl outline-none transition-all bg-[#fafafa] dark:bg-[#111] text-[#111] dark:text-[#eee] placeholder-[#ccc] dark:placeholder-[#555] text-[14px] focus:border-[#111] dark:focus:border-[#eee] focus:bg-white dark:focus:bg-[#151515]"
                                            placeholder="Min. 6 characters"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[12px] font-semibold text-[#111] dark:text-[#eee] uppercase tracking-[0.05em] mb-2">Confirm Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ccc] dark:text-[#555] h-4 w-4" strokeWidth={1.5} />
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 border border-[#f0f0f0] dark:border-[#1a1a1a] rounded-xl outline-none transition-all bg-[#fafafa] dark:bg-[#111] text-[#111] dark:text-[#eee] placeholder-[#ccc] dark:placeholder-[#555] text-[14px] focus:border-[#111] dark:focus:border-[#eee] focus:bg-white dark:focus:bg-[#151515]"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#111] dark:bg-[#eee] text-white dark:text-[#111] py-3 rounded-xl text-[14px] font-semibold hover:bg-[#333] dark:hover:bg-[#ccc] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                                >
                                    {loading ? (
                                        <span className="animate-spin h-4 w-4 border-2 border-white dark:border-[#111] border-t-transparent rounded-full"></span>
                                    ) : (
                                        <>
                                            Reset Password
                                            <ArrowRight size={16} strokeWidth={2} />
                                        </>
                                    )}
                                </button>
                            </form>

                            <p className="mt-8 text-center text-[13px] text-[#999]">
                                Remember your password?{' '}
                                <Link to="/login" className="text-[#111] dark:text-[#eee] font-semibold hover:underline transition-colors">
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

export default ResetPassword;
