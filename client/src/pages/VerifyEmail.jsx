import { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { BrainCircuit, Mail, ShieldCheck, RotateCcw } from 'lucide-react';

const VerifyEmail = () => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [success, setSuccess] = useState('');
    const inputRefs = useRef([]);
    const navigate = useNavigate();
    const location = useLocation();
    const { login: authLogin } = useContext(AuthContext);

    const email = location.state?.email || '';

    useEffect(() => {
        if (!email) {
            navigate('/register');
        }
    }, [email, navigate]);

    // Cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    // Auto-focus first input
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return; // Only numbers

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1); // Take last digit
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pastedData.length === 6) {
            const newOtp = pastedData.split('');
            setOtp(newOtp);
            inputRefs.current[5]?.focus();
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError('Please enter the complete 6-digit code');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/verify-email', { email, otp: otpString });
            // Auto-login
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            // Force reload to pick up new auth state
            window.location.href = '/dashboard';
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed');
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setResendLoading(true);
        setError('');
        setSuccess('');
        try {
            await api.post('/auth/resend-otp', { email });
            setSuccess('New code sent! Check your inbox.');
            setResendCooldown(60);
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } catch (err) {
            if (err.response?.status === 429) {
                setResendCooldown(err.response.data.retryAfter || 60);
                setError(`Please wait ${err.response.data.retryAfter || 60}s before requesting again`);
            } else {
                setError(err.response?.data?.message || 'Failed to resend code');
            }
        } finally {
            setResendLoading(false);
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
                            Almost there.
                        </h1>
                        <p className="text-white/40 dark:text-[#111]/40 text-[14px] leading-relaxed mb-16">
                            We sent a verification code to your email. Just enter it to activate your account.
                        </p>

                        <div className="space-y-4">
                            {[
                                { icon: Mail, text: 'Check your inbox (and spam folder)' },
                                { icon: ShieldCheck, text: 'Enter the 6-digit code below' },
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

            {/* Right Panel — OTP Form */}
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

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-[#111] dark:text-[#eee] tracking-[-0.03em]">Verify your email</h2>
                        <p className="text-[#999] text-[13px] mt-2">
                            We sent a code to <span className="text-[#111] dark:text-[#eee] font-medium">{email}</span>
                        </p>
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

                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#f0fdf4] dark:bg-green-500/10 text-green-600 dark:text-green-400 p-4 rounded-xl mb-6 text-[13px] border border-green-100 dark:border-green-500/20 flex items-center gap-2"
                        >
                            <span>✓</span> {success}
                        </motion.div>
                    )}

                    <form onSubmit={handleVerify}>
                        {/* OTP Inputs */}
                        <div className="flex gap-3 mb-6 justify-center">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={index === 0 ? handlePaste : undefined}
                                    className="w-12 h-14 text-center text-xl font-bold border border-[#f0f0f0] dark:border-[#1a1a1a] rounded-xl bg-[#fafafa] dark:bg-[#111] text-[#111] dark:text-[#eee] outline-none transition-all focus:border-[#111] dark:focus:border-[#eee] focus:bg-white dark:focus:bg-[#151515]"
                                />
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otp.join('').length !== 6}
                            className="w-full bg-[#111] dark:bg-[#eee] text-white dark:text-[#111] py-3 rounded-xl text-[14px] font-semibold hover:bg-[#333] dark:hover:bg-[#ccc] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span className="animate-spin h-4 w-4 border-2 border-white dark:border-[#111] border-t-transparent rounded-full"></span>
                            ) : (
                                <>
                                    <ShieldCheck size={16} strokeWidth={1.5} />
                                    Verify & Continue
                                </>
                            )}
                        </button>
                    </form>

                    {/* Resend */}
                    <div className="mt-6 text-center">
                        <p className="text-[13px] text-[#999]">
                            Didn't receive the code?{' '}
                            <button
                                onClick={handleResend}
                                disabled={resendCooldown > 0 || resendLoading}
                                className="text-[#111] dark:text-[#eee] font-semibold hover:underline disabled:text-[#ccc] dark:disabled:text-[#555] disabled:no-underline transition-colors inline-flex items-center gap-1"
                            >
                                {resendLoading ? (
                                    <span className="animate-spin h-3 w-3 border-2 border-[#111] dark:border-[#eee] border-t-transparent rounded-full"></span>
                                ) : resendCooldown > 0 ? (
                                    `Resend in ${resendCooldown}s`
                                ) : (
                                    <>
                                        <RotateCcw size={12} strokeWidth={2} />
                                        Resend code
                                    </>
                                )}
                            </button>
                        </p>
                    </div>

                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-[#f0f0f0] dark:border-[#1a1a1a]"></div>
                            </div>
                            <div className="relative flex justify-center text-[12px]">
                                <span className="px-4 bg-white dark:bg-[#0a0a0a] text-[#ccc] dark:text-[#555]">Wrong email?</span>
                            </div>
                        </div>
                        <Link
                            to="/register"
                            className="mt-4 w-full flex items-center justify-center gap-2 py-3 border border-[#f0f0f0] dark:border-[#1a1a1a] rounded-xl text-[#111] dark:text-[#eee] text-[13px] font-semibold hover:bg-[#fafafa] dark:hover:bg-[#111] transition-colors"
                        >
                            Go back to Register
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default VerifyEmail;
