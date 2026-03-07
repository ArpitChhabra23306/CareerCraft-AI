import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    ArrowRight, BrainCircuit, FileText, Layers, MessageSquare, Zap, Moon, Sun,
    Trophy, Sparkles, Check, ChevronDown, Star, Users,
    Target, Rocket, Play, ArrowUpRight
} from 'lucide-react';
import { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';

/* ─── Branded Ambient Aurora + Grain ─── */
const AmbientLighting = () => {
    const planeRef = useRef(null);
    const pointerX = useMotionValue(0);
    const pointerY = useMotionValue(0);

    const farX = useTransform(pointerX, [-0.5, 0.5], [-16, 16]);
    const farY = useTransform(pointerY, [-0.5, 0.5], [-12, 12]);
    const midX = useTransform(pointerX, [-0.5, 0.5], [-28, 28]);
    const midY = useTransform(pointerY, [-0.5, 0.5], [-20, 20]);
    const nearX = useTransform(pointerX, [-0.5, 0.5], [-40, 40]);
    const nearY = useTransform(pointerY, [-0.5, 0.5], [-28, 28]);

    const handleMove = (e) => {
        const rect = planeRef.current?.getBoundingClientRect();
        if (!rect) return;

        const normalizedX = (e.clientX - rect.left) / rect.width - 0.5;
        const normalizedY = (e.clientY - rect.top) / rect.height - 0.5;
        pointerX.set(normalizedX);
        pointerY.set(normalizedY);
    };

    const handleLeave = () => {
        pointerX.set(0);
        pointerY.set(0);
    };

    return (
        <div
            ref={planeRef}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
            className="absolute inset-0 z-[1] overflow-hidden pointer-events-none"
        >
            <motion.div
                style={{ x: farX, y: farY }}
                className="ambient-blob absolute -top-24 -left-24 w-[36rem] h-[36rem] rounded-full"
            />

            <motion.div
                style={{ x: midX, y: midY }}
                className="ambient-blob ambient-blob-gold absolute top-[12%] right-[-12rem] w-[34rem] h-[34rem] rounded-full"
            />

            <motion.div
                style={{ x: nearX, y: nearY }}
                className="ambient-blob ambient-blob-charcoal absolute bottom-[-14rem] left-[20%] w-[40rem] h-[40rem] rounded-full"
            />

            <div className="ambient-grain absolute inset-0" />
        </div>
    );
};

/* ─── Interactive 3D Device Mockup ─── */
const MockupDevice = ({ className = "" }) => {
    const mockRef = useRef(null);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    const handleMouseMove = useCallback((e) => {
        if (!mockRef.current) return;
        const rect = mockRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        setTilt({ x: y * -8, y: x * 12 });
    }, []);

    const handleMouseLeave = useCallback(() => {
        setTilt({ x: 0, y: 0 });
    }, []);

    return (
        <motion.div
            ref={mockRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            initial={{ opacity: 0, y: 60, rotateX: 25 }}
            animate={{ opacity: 1, y: 0, rotateX: 8 }}
            transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`max-w-4xl w-full cursor-default ${className}`}
            style={{ perspective: '1200px' }}
        >
            <div
                className="relative transition-transform duration-200 ease-out"
                style={{
                    transform: `perspective(1200px) rotateX(${8 + tilt.x}deg) rotateY(${tilt.y}deg)`,
                    transformStyle: 'preserve-3d',
                }}
            >
                {/* Laptop body */}
                <div className="rounded-xl overflow-hidden border border-[#e0e0e0] dark:border-[#2A2F3A] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] bg-[#f8f8f8] dark:bg-[#0F1115]">
                    {/* Browser chrome */}
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-[#E3DAC6] dark:bg-[#0d0d0d] border-b border-[#e0e0e0] dark:border-[#2A2F3A]">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                            <div className="w-2.5 h-2.5 rounded-full bg-[#27ca3f]" />
                        </div>
                        <div className="flex-1 mx-8">
                            <div className="bg-[#F5F2EA] dark:bg-[#2A2F3A] rounded-md h-6 flex items-center px-3 text-[10px] text-[#aaa] dark:text-[#8D8474] font-mono">
                                careercraft.ai/dashboard
                            </div>
                        </div>
                    </div>

                    {/* Dashboard preview content */}
                    <div className="p-6 space-y-4 bg-[#F5F2EA] dark:bg-[#0F1115]">
                        {/* Top bar */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[#0F1115] dark:bg-[#F5F2EA] flex items-center justify-center">
                                    <BrainCircuit className="w-4 h-4 text-white dark:text-[#0F1115]" strokeWidth={1.5} />
                                </div>
                                <div className="h-3 w-24 bg-[#E3DAC6] dark:bg-[#2A2F3A] rounded-full" />
                            </div>
                            <div className="flex gap-2">
                                <div className="h-7 w-7 rounded-lg bg-[#EEE7D8] dark:bg-[#1F2430]" />
                                <div className="h-7 w-7 rounded-lg bg-[#EEE7D8] dark:bg-[#1F2430]" />
                                <div className="h-7 w-20 rounded-lg bg-[#0F1115] dark:bg-[#F5F2EA]" />
                            </div>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-4 gap-3">
                            {[{ l: 'Documents', v: '24' }, { l: 'Quizzes', v: '12' }, { l: 'XP', v: '2,840' }, { l: 'Streak', v: '7d' }].map((s, i) => (
                                <div key={i} className="p-3 rounded-xl bg-[#F2EEE4] dark:bg-[#0F1115] border border-[#E3DAC6] dark:border-[#2A2F3A]">
                                    <p className="text-[9px] text-[#aaa] dark:text-[#A79F90] uppercase tracking-wider">{s.l}</p>
                                    <p className="text-[16px] font-bold text-[#0F1115] dark:text-[#F5F2EA] mt-0.5">{s.v}</p>
                                </div>
                            ))}
                        </div>

                        {/* Content area */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2 p-4 rounded-xl bg-[#F2EEE4] dark:bg-[#0F1115] border border-[#E3DAC6] dark:border-[#2A2F3A]">
                                <div className="flex items-center gap-2 mb-3">
                                    <MessageSquare size={12} className="text-[#7C7365]" />
                                    <span className="text-[10px] font-medium text-[#7C7365]">AI Chat</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <div className="h-6 w-6 rounded-full bg-[#D6CCB5] dark:bg-[#2A2F3A] flex-shrink-0" />
                                        <div className="h-6 flex-1 bg-[#E3DAC6] dark:bg-[#2A2F3A] rounded-lg" />
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <div className="h-6 w-2/3 bg-[#0F1115] dark:bg-[#F5F2EA] rounded-lg opacity-80" />
                                        <div className="h-6 w-6 rounded-full bg-[#0F1115] dark:bg-[#F5F2EA] flex-shrink-0" />
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="h-6 w-6 rounded-full bg-[#D6CCB5] dark:bg-[#2A2F3A] flex-shrink-0" />
                                        <div className="h-6 w-3/4 bg-[#E3DAC6] dark:bg-[#2A2F3A] rounded-lg" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="p-3 rounded-xl bg-[#F2EEE4] dark:bg-[#0F1115] border border-[#E3DAC6] dark:border-[#2A2F3A]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Zap size={10} className="text-[#7C7365]" />
                                        <span className="text-[9px] font-medium text-[#7C7365]">Quiz</span>
                                    </div>
                                    <div className="w-full h-2 bg-[#E3DAC6] dark:bg-[#2A2F3A] rounded-full overflow-hidden">
                                        <div className="h-full w-3/4 bg-[#0F1115] dark:bg-[#F5F2EA] rounded-full" />
                                    </div>
                                    <p className="text-[9px] text-[#aaa] mt-1">75% complete</p>
                                </div>
                                <div className="p-3 rounded-xl bg-[#F2EEE4] dark:bg-[#0F1115] border border-[#E3DAC6] dark:border-[#2A2F3A]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Trophy size={10} className="text-[#7C7365]" />
                                        <span className="text-[9px] font-medium text-[#7C7365]">Level</span>
                                    </div>
                                    <p className="text-[14px] font-bold text-[#0F1115] dark:text-[#F5F2EA]">12</p>
                                    <p className="text-[9px] text-[#aaa]">840 / 1000 XP</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reflection/glow underneath */}
                <div className="absolute -bottom-8 left-[10%] right-[10%] h-16 bg-gradient-to-b from-black/[0.04] dark:from-white/[0.03] to-transparent rounded-full blur-2xl" />
            </div>
        </motion.div>
    );
};

/* ─── #8 Smooth Animated Counter with easeOut ─── */
const AnimatedCounter = ({ target, suffix = '' }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    const motionVal = useMotionValue(0);
    const rounded = useTransform(motionVal, v => {
        if (target < 10) return v.toFixed(1);
        return Math.floor(v).toLocaleString();
    });
    const [display, setDisplay] = useState(target < 10 ? '0.0' : '0');

    useEffect(() => {
        if (isInView) {
            const controls = animate(motionVal, target, {
                duration: 2.4,
                ease: [0.22, 1, 0.36, 1], // smooth easeOut
            });
            const unsub = rounded.on('change', v => setDisplay(v));
            return () => { controls.stop(); unsub(); };
        }
    }, [isInView, target, motionVal, rounded]);

    return <span ref={ref}>{display}{suffix}</span>;
};

/* ─── #2 Staggered Reveal with configurable direction ─── */
const Reveal = ({ children, delay = 0, className = '', from = 'bottom' }) => {
    const dirs = {
        bottom: { y: 30, x: 0 },
        left: { y: 0, x: -30 },
        right: { y: 0, x: 30 },
        top: { y: -30, x: 0 },
    };
    const d = dirs[from] || dirs.bottom;
    return (
        <motion.div
            initial={{ opacity: 0, y: d.y, x: d.x }}
            whileInView={{ opacity: 1, y: 0, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

/* ─── #5 Feature Card with Cursor Glow / Spotlight ─── */
const FeatureCard = ({ icon: Icon, title, description, delay }) => {
    const cardRef = useRef(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouse = useCallback((e) => {
        const rect = cardRef.current?.getBoundingClientRect();
        if (rect) {
            setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }
    }, []);

    return (
        <Reveal delay={delay} className="group">
            <div
                ref={cardRef}
                onMouseMove={handleMouse}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="relative h-full p-8 rounded-[20px] bg-[#F2EEE4] dark:bg-[#0F1115] border border-[#E3DAC6] dark:border-[#2A2F3A] transition-all duration-500 hover:bg-[#F5F2EA] dark:hover:bg-[#1F2430] hover:shadow-[0_20px_60px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)] hover:border-[#D6CCB5] dark:hover:border-[#2A2F3A] hover:-translate-y-1 overflow-hidden"
            >
                {/* Cursor glow spotlight */}
                {isHovered && (
                    <div
                        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
                        style={{
                            background: `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, rgba(17,17,17,0.03), transparent 60%)`,
                        }}
                    />
                )}
                <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-[#EEE7D8] dark:bg-[#2A2F3A] border border-[#ebebeb] dark:border-[#2A2F3A] flex items-center justify-center mb-6 group-hover:bg-[#0F1115] dark:group-hover:bg-[#F5F2EA] group-hover:border-[#0F1115] dark:group-hover:border-white transition-all duration-500">
                        <Icon size={20} className="text-[#7C7365] dark:text-[#7C7365] group-hover:text-white dark:group-hover:text-[#0F1115] transition-colors duration-500" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[15px] font-semibold text-[#0F1115] dark:text-[#F5F2EA] mb-2 tracking-[-0.01em]">{title}</h3>
                    <p className="text-[#8D8474] dark:text-[#8D8474] text-[13px] leading-relaxed">{description}</p>
                </div>
            </div>
        </Reveal>
    );
};

/* ─── Testimonial Card ─── */
const TestimonialCard = ({ name, role, content, initials, delay }) => (
    <Reveal delay={delay}>
        <div className="p-8 rounded-[20px] bg-[#F2EEE4] dark:bg-[#0F1115] border border-[#E3DAC6] dark:border-[#2A2F3A] h-full">
            <div className="flex items-center gap-1 mb-5">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} size={13} className="fill-[#0F1115] dark:fill-[#F5F2EA] text-[#0F1115] dark:text-[#F5F2EA]" />
                ))}
            </div>
            <p className="text-[#A79F90] dark:text-[#B8B1A3] mb-6 text-[14px] leading-[1.7]">"{content}"</p>
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#0F1115] dark:bg-[#F5F2EA] flex items-center justify-center text-white dark:text-[#0F1115] text-xs font-medium tracking-wide">
                    {initials}
                </div>
                <div>
                    <p className="font-semibold text-[#0F1115] dark:text-[#F5F2EA] text-[13px]">{name}</p>
                    <p className="text-[#A79F90] dark:text-[#8D8474] text-[12px]">{role}</p>
                </div>
            </div>
        </div>
    </Reveal>
);

/* ─── FAQ Item ─── */
const FAQItem = ({ question, answer, isOpen, onClick }) => (
    <div className="border-b border-[#E3DAC6] dark:border-[#2A2F3A] last:border-0">
        <button onClick={onClick} className="w-full py-6 flex items-center justify-between text-left group">
            <span className="font-medium text-[#0F1115] dark:text-[#F5F2EA] text-[14px] group-hover:text-[#8D8474] dark:group-hover:text-[#8D8474] transition-colors">{question}</span>
            <div className={`w-6 h-6 rounded-full border ${isOpen ? 'border-[#0F1115] dark:border-[#F5F2EA] bg-[#0F1115] dark:bg-[#F5F2EA]' : 'border-[#CFC3A8] dark:border-[#E6C55A]'} flex items-center justify-center flex-shrink-0 ml-6 transition-all duration-300`}>
                <ChevronDown size={12} className={`transition-all duration-300 ${isOpen ? 'rotate-180 text-white dark:text-[#0F1115]' : 'text-[#8D8474] dark:text-[#8D8474]'}`} />
            </div>
        </button>
        <div className={`overflow-hidden transition-all duration-400 ${isOpen ? 'max-h-40 pb-6' : 'max-h-0'}`}>
            <p className="text-[#8D8474] dark:text-[#8D8474] text-[13px] leading-relaxed">{answer}</p>
        </div>
    </div>
);

/* ─── Pricing Card ─── */
const PricingCard = ({ name, price, features, popular, delay }) => (
    <Reveal delay={delay} className={popular ? 'md:-translate-y-2' : ''}>
        <div className={`relative p-8 rounded-[20px] border transition-all duration-500 h-full ${popular
            ? 'bg-[#0F1115] dark:bg-[#F5F2EA] border-[#2A2F3A] dark:border-[#CFC3A8] text-white dark:text-[#0F1115]'
            : 'bg-[#F2EEE4] dark:bg-[#0F1115] border-[#E3DAC6] dark:border-[#2A2F3A] hover:bg-[#F5F2EA] dark:hover:bg-[#1F2430] hover:shadow-[0_20px_60px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)]'
            }`}>
            {popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F5F2EA] dark:bg-[#0F1115] text-[#0F1115] dark:text-[#F5F2EA] text-[10px] font-bold uppercase tracking-[0.15em] px-4 py-1 rounded-full border border-[#E3DAC6] dark:border-[#2A2F3A]">
                    Popular
                </div>
            )}
            <p className={`text-[12px] font-semibold uppercase tracking-[0.15em] mb-1 ${popular ? 'text-white/50 dark:text-[#0F1115]/50' : 'text-[#A79F90] dark:text-[#8D8474]'}`}>{name}</p>
            <div className="mb-6">
                <span className={`text-4xl font-bold tracking-tight ${popular ? 'text-white dark:text-[#0F1115]' : 'text-[#0F1115] dark:text-[#F5F2EA]'}`}>₹{price}</span>
                <span className={`text-[13px] ${popular ? 'text-white/40 dark:text-[#0F1115]/40' : 'text-[#B8B1A3] dark:text-[#B8B1A3]'}`}>/mo</span>
            </div>
            <div className={`w-full h-px mb-6 ${popular ? 'bg-[#F5F2EA]/10 dark:bg-[#0F1115]/10' : 'bg-[#E3DAC6] dark:bg-[#2A2F3A]'}`} />
            <ul className="space-y-3 mb-8">
                {features.map((f, i) => (
                    <li key={i} className={`flex items-center gap-3 text-[13px] ${popular ? 'text-white/70 dark:text-[#0F1115]/70' : 'text-[#7C7365] dark:text-[#7C7365]'}`}>
                        <Check size={14} className={popular ? 'text-white/50 dark:text-[#0F1115]/50' : 'text-[#B8B1A3] dark:text-[#B8B1A3]'} strokeWidth={2} />
                        {f}
                    </li>
                ))}
            </ul>
            <button className={`w-full py-3 rounded-xl text-[13px] font-semibold transition-all duration-300 ${popular
                ? 'bg-[#F5F2EA] dark:bg-[#0F1115] text-[#0F1115] dark:text-[#F5F2EA] hover:bg-[#E3DAC6] dark:hover:bg-[#2A2F3A]'
                : 'bg-[#0F1115] dark:bg-[#F5F2EA] text-white dark:text-[#0F1115] hover:bg-[#2A2F3A] dark:hover:bg-[#CFC3A8]'
                }`}>
                Get Started
            </button>
        </div>
    </Reveal>
);

/* ─── #6 Marquee Ticker ─── */
const Marquee = () => {
    const items = ['Trusted by 10,000+ learners', '4.9★ average rating', 'AI-Powered', 'Free to start', '24/7 AI assistance', 'Secure & Private'];
    return (
        <div className="overflow-hidden border-y border-[#E3DAC6] dark:border-[#141414] py-3.5 bg-[#F2EEE4] dark:bg-[#0d0d0d]">
            <div className="flex animate-marquee whitespace-nowrap">
                {[...items, ...items, ...items].map((item, i) => (
                    <span key={i} className="mx-8 text-[12px] font-medium text-[#A79F90] dark:text-[#8D8474] uppercase tracking-[0.15em] flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-[#B8B1A3] dark:bg-[#444]" />
                        {item}
                    </span>
                ))}
            </div>
        </div>
    );
};

/* ─── #9 Gradient-faded Section Divider ─── */
const SectionDivider = () => (
    <div className="max-w-6xl mx-auto px-6">
        <div className="h-px" style={{
            background: 'linear-gradient(to right, transparent, #e5e5e5, transparent)',
        }} />
        <style>{`
            .dark .section-divider-inner { background: linear-gradient(to right, transparent, #2A2F3A, transparent) !important; }
        `}</style>
    </div>
);

/* ════════════════════════════════════════════════════════════ */
/*                    HOME PREMIUM                             */
/* ════════════════════════════════════════════════════════════ */

const Home = () => {
    const { user } = useContext(AuthContext);
    const [openFAQ, setOpenFAQ] = useState(0);
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        setIsDark(document.documentElement.classList.contains('dark'));
    }, []);

    const toggleTheme = () => {
        document.documentElement.classList.toggle('dark');
        setIsDark(!isDark);
    };

    const features = [
        { icon: FileText, title: 'Smart Documents', description: 'Upload PDFs and notes. AI extracts key insights and creates summaries instantly.' },
        { icon: MessageSquare, title: 'AI Chat', description: 'Have intelligent conversations with your documents. Ask anything, get answers.' },
        { icon: Layers, title: 'Auto Flashcards', description: 'Generate study decks automatically from your materials for effortless retention.' },
        { icon: Zap, title: 'Instant Quizzes', description: 'Test your knowledge with AI-generated quizzes tailored to your content.' },
        { icon: Target, title: 'Mock Interviews', description: 'Practice with a realistic AI interviewer that adapts to your target role.' },
        { icon: Trophy, title: 'Gamification', description: 'Earn XP, maintain streaks, climb leaderboards, and unlock achievements.' },
    ];

    const faqs = [
        { q: 'How does the AI analyze my documents?', a: 'Our AI uses advanced natural language processing to understand context, extract key concepts, and generate relevant study materials from your uploaded documents.' },
        { q: 'Is my data secure?', a: 'Absolutely. All documents are encrypted and stored securely. We never share your data with third parties.' },
        { q: 'Can I cancel my subscription anytime?', a: 'Yes, you can cancel anytime. Your access continues until the end of your billing period.' },
        { q: 'What document formats are supported?', a: 'Currently we support PDF files. We are working on adding support for more formats soon.' },
    ];

    return (
        <div className="min-h-screen bg-[#F5F2EA] dark:bg-[#0F1115] text-[#0F1115] dark:text-[#F5F2EA] antialiased selection:bg-[#0F1115] selection:text-white dark:selection:bg-[#F5F2EA] dark:selection:text-[#0F1115] transition-colors duration-500" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

            {/* #3 Grain/Noise Texture Overlay */}
            <div className="fixed inset-0 z-[1] pointer-events-none opacity-[0.025] dark:opacity-[0.04]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'repeat',
                    backgroundSize: '128px 128px',
                }}
            />

            {/* ══ NAVBAR ══ */}
            <nav className="fixed w-full z-50 bg-[#F5F2EA]/80 dark:bg-[#0F1115]/80 backdrop-blur-xl border-b border-[#EEE7D8] dark:border-[#1F2430]">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-[#0F1115] dark:bg-[#F5F2EA] rounded-lg flex items-center justify-center">
                                <BrainCircuit className="text-white dark:text-[#0F1115] h-4 w-4" strokeWidth={1.5} />
                            </div>
                            <span className="text-[15px] font-semibold tracking-[-0.02em]">CareerCraft AI</span>
                        </div>
                        <div className="hidden md:flex items-center gap-8">
                            {['Features', 'How it Works', 'Pricing', 'FAQ'].map((item) => (
                                <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} className="text-[#8D8474] dark:text-[#8D8474] hover:text-[#0F1115] dark:hover:text-[#F5F2EA] transition-colors text-[13px] font-medium">
                                    {item}
                                </a>
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={toggleTheme} className="w-8 h-8 rounded-lg border border-[#E3DAC6] dark:border-[#2A2F3A] flex items-center justify-center hover:border-[#CFC3A8] dark:hover:border-[#E6C55A] transition-colors">
                                {isDark ? <Sun className="h-3.5 w-3.5 text-[#7C7365]" strokeWidth={1.5} /> : <Moon className="h-3.5 w-3.5 text-[#7C7365]" strokeWidth={1.5} />}
                            </button>
                            {user ? (
                                <Link to="/dashboard" className="bg-[#0F1115] dark:bg-[#F5F2EA] text-white dark:text-[#0F1115] px-5 py-2 rounded-lg text-[13px] font-semibold hover:bg-[#E6C55A] dark:hover:bg-[#B8B1A3] transition-colors">
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link to="/login" className="text-[#8D8474] dark:text-[#8D8474] hover:text-[#0F1115] dark:hover:text-[#F5F2EA] font-medium transition-colors hidden sm:block text-[13px]">
                                        Sign in
                                    </Link>
                                    <Link to="/register" className="bg-[#0F1115] dark:bg-[#F5F2EA] text-white dark:text-[#0F1115] px-5 py-2 rounded-lg text-[13px] font-semibold hover:bg-[#E6C55A] dark:hover:bg-[#B8B1A3] transition-colors">
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* ══ HERO with Ambient Lighting + SaaS Composition ══ */}
            <section className="pt-34 md:pt-40 pb-16 px-4 relative z-10 overflow-hidden">
                {/* Branded Ambient Background */}
                <div className="absolute inset-0">
                    <AmbientLighting />
                </div>

                <div className="max-w-6xl mx-auto relative z-10 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
                    {/* Left: Message + CTAs */}
                    <div className="text-center lg:text-left">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="inline-flex items-center gap-2 border border-[#F5F2EA] dark:border-[#2A2F3A] px-4 py-1.5 rounded-full mb-8 bg-[#F5F2EA]/60 dark:bg-[#0F1115]/60 backdrop-blur-sm"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-[#0F1115] dark:bg-[#F5F2EA] animate-pulse" />
                            <span className="text-[#7C7365] dark:text-[#7C7365] text-[12px] font-medium tracking-wide uppercase">AI-Powered Learning</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                            className="text-[clamp(2.5rem,5.4vw,4.8rem)] font-bold tracking-[-0.045em] leading-[0.95] mb-6"
                        >
                            Learn Smarter.
                            <br />
                            <span className="shimmer-text">Ace Every Interview.</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                            className="max-w-xl mx-auto lg:mx-0 text-[16px] text-[#8D8474] dark:text-[#8D8474] mb-10 leading-relaxed"
                        >
                            Upload your study material, get AI-powered explanations, and train for real interviews — all in one focused workflow.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.3 }}
                            className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3"
                        >
                            <Link to={user ? '/dashboard' : '/register'}>
                                <motion.div
                                    whileHover={{ scale: 1.03, boxShadow: '0 20px 50px rgba(0,0,0,0.12)' }}
                                    whileTap={{ scale: 0.98 }}
                                    className="group bg-[#0F1115] dark:bg-[#F5F2EA] text-white dark:text-[#0F1115] px-8 py-3.5 rounded-xl text-[14px] font-semibold transition-all duration-300 inline-flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    Start Learning Free
                                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
                                </motion.div>
                            </Link>
                            <a href="#features">
                                <motion.div
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="border border-[#F5F2EA] dark:border-[#2A2F3A] text-[#A79F90] dark:text-[#7C7365] px-8 py-3.5 rounded-xl text-[14px] font-semibold hover:border-[#B8B1A3] dark:hover:border-[#444] hover:text-[#0F1115] dark:hover:text-[#F5F2EA] transition-all duration-300 inline-flex items-center justify-center gap-2 cursor-pointer bg-[#F5F2EA]/60 dark:bg-[#0F1115]/60 backdrop-blur-sm"
                                >
                                    <Play size={15} strokeWidth={2} />
                                    See How It Works
                                </motion.div>
                            </a>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.45 }}
                            className="mt-9"
                        >
                            <p className="text-[11px] uppercase tracking-[0.16em] text-[#A79F90] dark:text-[#8D8474] mb-3">Trusted by learners from</p>
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
                                {['IIT', 'NIT', 'Scaler', 'Masai', 'Apna College'].map((brand) => (
                                    <span
                                        key={brand}
                                        className="px-3.5 py-1.5 rounded-lg bg-[#EEE7D8]/80 dark:bg-[#1F2430]/70 border border-[#E3DAC6] dark:border-[#2A2F3A] text-[#7C7365] dark:text-[#B8B1A3] text-[11px] font-semibold tracking-wide"
                                    >
                                        {brand}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Right: Single visual anchor */}
                    <div className="relative">
                        <div className="absolute -inset-6 bg-gradient-to-br from-[#D4AF37]/22 via-transparent to-[#1F2430]/25 rounded-[32px] blur-3xl" />
                        <MockupDevice className="mt-0 mx-auto" />
                    </div>
                </div>
            </section>

            {/* ── #6 Marquee Strip ── */}
            <Marquee />

            {/* ── #9 Section Divider ── */}
            <SectionDivider />

            {/* ══ FEATURES ══ */}
            <section id="features" className="py-28 px-4 relative z-10">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <Reveal>
                            <p className="text-[#B8B1A3] dark:text-[#B8B1A3] text-[11px] font-semibold uppercase tracking-[0.2em] mb-4">Features</p>
                        </Reveal>
                        <Reveal delay={0.05}>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em] mb-4">
                                Everything you need
                            </h2>
                        </Reveal>
                        <Reveal delay={0.1}>
                            <p className="text-[#8D8474] dark:text-[#8D8474] max-w-md mx-auto text-[14px]">
                                Powerful AI tools to accelerate your learning and career growth.
                            </p>
                        </Reveal>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {features.map((f, i) => <FeatureCard key={i} {...f} delay={i * 0.06} />)}
                    </div>
                </div>
            </section>

            <SectionDivider />

            {/* ══ HOW IT WORKS ══ */}
            <section id="how-it-works" className="py-28 px-4 relative z-10">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-20">
                        <Reveal>
                            <p className="text-[#B8B1A3] dark:text-[#B8B1A3] text-[11px] font-semibold uppercase tracking-[0.2em] mb-4">How It Works</p>
                        </Reveal>
                        <Reveal delay={0.05}>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em]">
                                Three simple steps
                            </h2>
                        </Reveal>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                        <div className="hidden md:block absolute top-6 left-[20%] right-[20%] h-px" style={{
                            background: 'linear-gradient(to right, transparent, #e0e0e0, transparent)',
                        }} />
                        {[
                            { num: '01', title: 'Upload', desc: 'Drop your PDFs, notes, or study materials.' },
                            { num: '02', title: 'Generate', desc: 'AI creates quizzes, flashcards, and summaries.' },
                            { num: '03', title: 'Practice', desc: 'Study smart, track progress, and ace interviews.' },
                        ].map((step, i) => (
                            <Reveal key={i} delay={i * 0.12} className="text-center">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    className="w-12 h-12 mx-auto mb-6 rounded-full bg-[#F2EEE4] dark:bg-[#0F1115] border border-[#E3DAC6] dark:border-[#2A2F3A] flex items-center justify-center"
                                >
                                    <span className="text-[13px] font-bold tracking-tight">{step.num}</span>
                                </motion.div>
                                <h3 className="text-[15px] font-semibold mb-2">{step.title}</h3>
                                <p className="text-[#8D8474] dark:text-[#8D8474] text-[13px] max-w-[200px] mx-auto">{step.desc}</p>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            <SectionDivider />

            {/* ══ PRICING ══ */}
            <section id="pricing" className="py-28 px-4 relative z-10">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <Reveal>
                            <p className="text-[#B8B1A3] dark:text-[#B8B1A3] text-[11px] font-semibold uppercase tracking-[0.2em] mb-4">Pricing</p>
                        </Reveal>
                        <Reveal delay={0.05}>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em] mb-4">
                                Simple pricing
                            </h2>
                        </Reveal>
                        <Reveal delay={0.1}>
                            <p className="text-[#8D8474] dark:text-[#8D8474] text-[14px]">No hidden fees. Cancel anytime.</p>
                        </Reveal>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <PricingCard name="Free" price="0" features={['3 Documents', '50 AI Chats/month', '2 Quizzes/day']} delay={0.1} />
                        <PricingCard name="Pro" price="299" features={['Unlimited Documents', '500 AI Chats/month', 'Unlimited Quizzes', 'Mock Interviews']} popular delay={0.15} />
                        <PricingCard name="Enterprise" price="999" features={['Everything in Pro', 'Unlimited AI', 'Priority Support']} delay={0.2} />
                    </div>
                    <div className="text-center mt-10">
                        <Link to="/pricing" className="inline-flex items-center gap-2 text-[#8D8474] dark:text-[#8D8474] hover:text-[#0F1115] dark:hover:text-[#F5F2EA] font-medium text-[13px] hover:gap-3 transition-all">
                            View full comparison <ArrowUpRight size={14} />
                        </Link>
                    </div>
                </div>
            </section>

            <SectionDivider />

            {/* ══ TESTIMONIALS ══ */}
            <section className="py-28 px-4 relative z-10">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <Reveal>
                            <p className="text-[#B8B1A3] dark:text-[#B8B1A3] text-[11px] font-semibold uppercase tracking-[0.2em] mb-4">Testimonials</p>
                        </Reveal>
                        <Reveal delay={0.05}>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em]">
                                Loved by learners
                            </h2>
                        </Reveal>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <TestimonialCard name="Priya Sharma" role="Medical Student" content="CareerCraft AI helped me ace my exams. The AI-generated quizzes saved me hours of study time." initials="PS" delay={0.1} />
                        <TestimonialCard name="Rahul Verma" role="Software Engineer" content="The mock interview feature is a game-changer. I got my dream job after practicing here." initials="RV" delay={0.15} />
                        <TestimonialCard name="Ananya Singh" role="MBA Student" content="The flashcard generation makes studying complex case studies so much easier and effective." initials="AS" delay={0.2} />
                    </div>
                </div>
            </section>

            <SectionDivider />

            {/* ══ FAQ ══ */}
            <section id="faq" className="py-28 px-4 relative z-10">
                <div className="max-w-xl mx-auto">
                    <div className="text-center mb-16">
                        <Reveal>
                            <p className="text-[#B8B1A3] dark:text-[#B8B1A3] text-[11px] font-semibold uppercase tracking-[0.2em] mb-4">FAQ</p>
                        </Reveal>
                        <Reveal delay={0.05}>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em]">
                                Questions & answers
                            </h2>
                        </Reveal>
                    </div>
                    <Reveal delay={0.1}>
                        <div>
                            {faqs.map((faq, index) => (
                                <FAQItem key={index} question={faq.q} answer={faq.a} isOpen={openFAQ === index} onClick={() => setOpenFAQ(openFAQ === index ? -1 : index)} />
                            ))}
                        </div>
                    </Reveal>
                </div>
            </section>

            <SectionDivider />

            {/* ══ CTA ══ */}
            <section className="py-28 px-4 relative z-10">
                <Reveal>
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="p-16 md:p-20 rounded-[28px] bg-[#0F1115] dark:bg-[#F5F2EA] relative overflow-hidden">
                            {/* Subtle radial glow inside CTA */}
                            <div className="absolute inset-0 opacity-30" style={{
                                background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.08), transparent 60%)',
                            }} />
                            <div className="relative z-10">
                                <h2 className="text-3xl md:text-4xl font-bold text-white dark:text-[#0F1115] mb-4 tracking-[-0.03em]">
                                    Ready to start learning?
                                </h2>
                                <p className="text-white/40 dark:text-[#0F1115]/40 mb-8 text-[14px] max-w-sm mx-auto">
                                    Join thousands of students leveling up their skills with CareerCraft AI.
                                </p>
                                <div className="flex flex-col sm:flex-row justify-center gap-3">
                                    <Link to="/register">
                                        <motion.div
                                            whileHover={{ scale: 1.04, boxShadow: '0 12px 40px rgba(255,255,255,0.1)' }}
                                            whileTap={{ scale: 0.97 }}
                                            className="bg-[#F5F2EA] dark:bg-[#0F1115] text-[#0F1115] dark:text-[#F5F2EA] px-8 py-3.5 rounded-xl text-[14px] font-semibold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            Start Free Today
                                            <ArrowRight size={16} strokeWidth={2} />
                                        </motion.div>
                                    </Link>
                                    <Link to="/login" className="border border-white/15 dark:border-[#0F1115]/15 text-white/70 dark:text-[#0F1115]/70 px-8 py-3.5 rounded-xl text-[14px] font-medium hover:text-white dark:hover:text-[#0F1115] hover:border-white/30 dark:hover:border-[#0F1115]/30 transition-all inline-flex items-center justify-center">
                                        Sign In
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </Reveal>
            </section>

            {/* ══ #10 REFINED FOOTER ══ */}
            <footer className="relative z-10">
                {/* Gradient top border */}
                <div className="h-px" style={{
                    background: 'linear-gradient(to right, transparent, #CFC3A8, transparent)',
                }} />
                <div className="max-w-6xl mx-auto px-6 py-20">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                        <div>
                            <div className="flex items-center gap-2.5 mb-5">
                                <div className="w-7 h-7 bg-[#0F1115] dark:bg-[#F5F2EA] rounded-lg flex items-center justify-center">
                                    <BrainCircuit className="text-white dark:text-[#0F1115] h-3.5 w-3.5" strokeWidth={1.5} />
                                </div>
                                <span className="text-[14px] font-semibold">CareerCraft AI</span>
                            </div>
                            <p className="text-[#A79F90] dark:text-[#8D8474] text-[13px] leading-relaxed">AI-powered learning for students and professionals.</p>
                        </div>
                        {[
                            { title: 'Product', links: [{ label: 'Features', href: '#features' }, { label: 'Pricing', href: '/pricing', isRoute: true }, { label: 'FAQ', href: '#faq' }] },
                            { title: 'Company', links: [{ label: 'About', href: '#' }, { label: 'Blog', href: '#' }, { label: 'Careers', href: '#' }] },
                            { title: 'Legal', links: [{ label: 'Privacy', href: '#' }, { label: 'Terms', href: '#' }, { label: 'Refunds', href: '#' }] },
                        ].map((col, i) => (
                            <div key={i}>
                                <h4 className="text-[12px] font-semibold uppercase tracking-[0.1em] mb-5">{col.title}</h4>
                                <ul className="space-y-3">
                                    {col.links.map((link, j) => (
                                        <li key={j}>
                                            {link.isRoute ? (
                                                <Link to={link.href} className="text-[#A79F90] dark:text-[#8D8474] hover:text-[#0F1115] dark:hover:text-[#F5F2EA] transition-colors text-[13px]">{link.label}</Link>
                                            ) : (
                                                <a href={link.href} className="text-[#A79F90] dark:text-[#8D8474] hover:text-[#0F1115] dark:hover:text-[#F5F2EA] transition-colors text-[13px]">{link.label}</a>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4" style={{
                        borderTop: '1px solid',
                        borderImage: 'linear-gradient(to right, transparent, #e5e5e5, transparent) 1',
                    }}>
                        <p className="text-[#B8B1A3] dark:text-[#B8B1A3] text-[12px]">© {new Date().getFullYear()} CareerCraft AI</p>
                        <p className="text-[#CFC3A8] dark:text-[#A79F90] text-[12px]">Made with care by Arpit Chhabra</p>
                    </div>
                </div>
            </footer>

            {/* ═══ GLOBAL STYLES for shimmer + marquee ═══ */}
            <style>{`
                /* #4 Shimmer animation on hero text */
                .shimmer-text {
                    background: linear-gradient(90deg, #A79F90 0%, #8D8474 25%, #A79F90 50%, #8D8474 75%, #A79F90 100%);
                    background-size: 300% 100%;
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: shimmer 6s ease-in-out infinite;
                }
                .dark .shimmer-text {
                    background: linear-gradient(90deg, #8D8474 0%, #aaa 25%, #8D8474 50%, #aaa 75%, #8D8474 100%);
                    background-size: 300% 100%;
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: shimmer 6s ease-in-out infinite;
                }
                @keyframes shimmer {
                    0% { background-position: 100% 50%; }
                    50% { background-position: 0% 50%; }
                    100% { background-position: 100% 50%; }
                }

                /* #6 Marquee infinite scroll */
                @keyframes marquee {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(-33.33%); }
                }
                .animate-marquee {
                    animation: marquee 25s linear infinite;
                }

                .ambient-blob {
                    background: radial-gradient(circle, rgba(212, 175, 55, 0.18) 0%, rgba(212, 175, 55, 0.07) 34%, rgba(15, 17, 21, 0) 72%);
                    filter: blur(42px);
                    animation: auroraFloat 18s ease-in-out infinite alternate;
                }
                .ambient-blob-gold {
                    background: radial-gradient(circle, rgba(230, 197, 90, 0.16) 0%, rgba(230, 197, 90, 0.06) 35%, rgba(15, 17, 21, 0) 70%);
                    animation-duration: 24s;
                }
                .ambient-blob-charcoal {
                    background: radial-gradient(circle, rgba(31, 36, 48, 0.2) 0%, rgba(31, 36, 48, 0.08) 38%, rgba(15, 17, 21, 0) 72%);
                    animation-duration: 30s;
                }
                .dark .ambient-blob {
                    background: radial-gradient(circle, rgba(212, 175, 55, 0.22) 0%, rgba(212, 175, 55, 0.09) 34%, rgba(15, 17, 21, 0) 72%);
                }
                .dark .ambient-blob-gold {
                    background: radial-gradient(circle, rgba(230, 197, 90, 0.22) 0%, rgba(230, 197, 90, 0.08) 35%, rgba(15, 17, 21, 0) 70%);
                }
                .dark .ambient-blob-charcoal {
                    background: radial-gradient(circle, rgba(42, 47, 58, 0.45) 0%, rgba(42, 47, 58, 0.14) 40%, rgba(15, 17, 21, 0) 72%);
                }

                .ambient-grain {
                    opacity: 0.16;
                    mix-blend-mode: multiply;
                    background-image:
                        radial-gradient(rgba(15, 17, 21, 0.2) 0.6px, transparent 0.6px),
                        radial-gradient(rgba(230, 197, 90, 0.06) 0.6px, transparent 0.6px);
                    background-size: 3px 3px, 4px 4px;
                    background-position: 0 0, 1px 1px;
                    animation: grainShift 12s steps(8) infinite;
                }

                .dark .ambient-grain {
                    opacity: 0.22;
                    mix-blend-mode: screen;
                    background-image:
                        radial-gradient(rgba(245, 242, 234, 0.09) 0.6px, transparent 0.6px),
                        radial-gradient(rgba(212, 175, 55, 0.08) 0.6px, transparent 0.6px);
                }

                @keyframes auroraFloat {
                    0% { transform: translate3d(0, 0, 0) scale(1); }
                    100% { transform: translate3d(0, -18px, 0) scale(1.08); }
                }

                @keyframes grainShift {
                    0% { transform: translate(0, 0); }
                    25% { transform: translate(-2%, 1%); }
                    50% { transform: translate(1%, -2%); }
                    75% { transform: translate(2%, 1%); }
                    100% { transform: translate(0, 0); }
                }

                /* Dark mode adjustments for gradient dividers */
                .dark footer .footer-border {
                    border-image: linear-gradient(to right, transparent, #2A2F3A, transparent) 1 !important;
                }
            `}</style>
        </div>
    );
};

export default Home;
