import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    ArrowRight, BrainCircuit, FileText, Layers, MessageSquare, Zap, Moon, Sun,
    Trophy, Sparkles, Check, ChevronDown, Star, Users,
    Target, Rocket, Play, ArrowUpRight
} from 'lucide-react';
import { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';

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
                className="relative h-full p-8 rounded-[20px] bg-[#fafafa] dark:bg-[#111] border border-[#f0f0f0] dark:border-[#1a1a1a] transition-all duration-500 hover:bg-white dark:hover:bg-[#151515] hover:shadow-[0_20px_60px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)] hover:border-[#e8e8e8] dark:hover:border-[#222] hover:-translate-y-1 overflow-hidden"
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
                    <div className="w-12 h-12 rounded-2xl bg-[#f5f5f5] dark:bg-[#1a1a1a] border border-[#ebebeb] dark:border-[#222] flex items-center justify-center mb-6 group-hover:bg-[#111] dark:group-hover:bg-white group-hover:border-[#111] dark:group-hover:border-white transition-all duration-500">
                        <Icon size={20} className="text-[#888] dark:text-[#888] group-hover:text-white dark:group-hover:text-[#111] transition-colors duration-500" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[15px] font-semibold text-[#111] dark:text-[#eee] mb-2 tracking-[-0.01em]">{title}</h3>
                    <p className="text-[#999] dark:text-[#999] text-[13px] leading-relaxed">{description}</p>
                </div>
            </div>
        </Reveal>
    );
};

/* ─── Testimonial Card ─── */
const TestimonialCard = ({ name, role, content, initials, delay }) => (
    <Reveal delay={delay}>
        <div className="p-8 rounded-[20px] bg-[#fafafa] dark:bg-[#111] border border-[#f0f0f0] dark:border-[#1a1a1a] h-full">
            <div className="flex items-center gap-1 mb-5">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} size={13} className="fill-[#111] dark:fill-[#eee] text-[#111] dark:text-[#eee]" />
                ))}
            </div>
            <p className="text-[#666] dark:text-[#777] mb-6 text-[14px] leading-[1.7]">"{content}"</p>
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#111] dark:bg-[#eee] flex items-center justify-center text-white dark:text-[#111] text-xs font-medium tracking-wide">
                    {initials}
                </div>
                <div>
                    <p className="font-semibold text-[#111] dark:text-[#eee] text-[13px]">{name}</p>
                    <p className="text-[#bbb] dark:text-[#999] text-[12px]">{role}</p>
                </div>
            </div>
        </div>
    </Reveal>
);

/* ─── FAQ Item ─── */
const FAQItem = ({ question, answer, isOpen, onClick }) => (
    <div className="border-b border-[#f0f0f0] dark:border-[#1a1a1a] last:border-0">
        <button onClick={onClick} className="w-full py-6 flex items-center justify-between text-left group">
            <span className="font-medium text-[#111] dark:text-[#eee] text-[14px] group-hover:text-[#555] dark:group-hover:text-[#999] transition-colors">{question}</span>
            <div className={`w-6 h-6 rounded-full border ${isOpen ? 'border-[#111] dark:border-[#eee] bg-[#111] dark:bg-[#eee]' : 'border-[#ddd] dark:border-[#333]'} flex items-center justify-center flex-shrink-0 ml-6 transition-all duration-300`}>
                <ChevronDown size={12} className={`transition-all duration-300 ${isOpen ? 'rotate-180 text-white dark:text-[#111]' : 'text-[#999] dark:text-[#999]'}`} />
            </div>
        </button>
        <div className={`overflow-hidden transition-all duration-400 ${isOpen ? 'max-h-40 pb-6' : 'max-h-0'}`}>
            <p className="text-[#999] dark:text-[#999] text-[13px] leading-relaxed">{answer}</p>
        </div>
    </div>
);

/* ─── Pricing Card ─── */
const PricingCard = ({ name, price, features, popular, delay }) => (
    <Reveal delay={delay} className={popular ? 'md:-translate-y-2' : ''}>
        <div className={`relative p-8 rounded-[20px] border transition-all duration-500 h-full ${popular
            ? 'bg-[#111] dark:bg-[#eee] border-[#222] dark:border-[#ddd] text-white dark:text-[#111]'
            : 'bg-[#fafafa] dark:bg-[#111] border-[#f0f0f0] dark:border-[#1a1a1a] hover:bg-white dark:hover:bg-[#151515] hover:shadow-[0_20px_60px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)]'
            }`}>
            {popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white dark:bg-[#111] text-[#111] dark:text-[#eee] text-[10px] font-bold uppercase tracking-[0.15em] px-4 py-1 rounded-full border border-[#f0f0f0] dark:border-[#222]">
                    Popular
                </div>
            )}
            <p className={`text-[12px] font-semibold uppercase tracking-[0.15em] mb-1 ${popular ? 'text-white/50 dark:text-[#111]/50' : 'text-[#bbb] dark:text-[#999]'}`}>{name}</p>
            <div className="mb-6">
                <span className={`text-4xl font-bold tracking-tight ${popular ? 'text-white dark:text-[#111]' : 'text-[#111] dark:text-[#eee]'}`}>₹{price}</span>
                <span className={`text-[13px] ${popular ? 'text-white/40 dark:text-[#111]/40' : 'text-[#ccc] dark:text-[#777]'}`}>/mo</span>
            </div>
            <div className={`w-full h-px mb-6 ${popular ? 'bg-white/10 dark:bg-[#111]/10' : 'bg-[#f0f0f0] dark:bg-[#1a1a1a]'}`} />
            <ul className="space-y-3 mb-8">
                {features.map((f, i) => (
                    <li key={i} className={`flex items-center gap-3 text-[13px] ${popular ? 'text-white/70 dark:text-[#111]/70' : 'text-[#888] dark:text-[#888]'}`}>
                        <Check size={14} className={popular ? 'text-white/50 dark:text-[#111]/50' : 'text-[#ccc] dark:text-[#777]'} strokeWidth={2} />
                        {f}
                    </li>
                ))}
            </ul>
            <button className={`w-full py-3 rounded-xl text-[13px] font-semibold transition-all duration-300 ${popular
                ? 'bg-white dark:bg-[#111] text-[#111] dark:text-[#eee] hover:bg-[#f0f0f0] dark:hover:bg-[#222]'
                : 'bg-[#111] dark:bg-[#eee] text-white dark:text-[#111] hover:bg-[#222] dark:hover:bg-[#ddd]'
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
        <div className="overflow-hidden border-y border-[#f0f0f0] dark:border-[#141414] py-3.5 bg-[#fafafa] dark:bg-[#0d0d0d]">
            <div className="flex animate-marquee whitespace-nowrap">
                {[...items, ...items, ...items].map((item, i) => (
                    <span key={i} className="mx-8 text-[12px] font-medium text-[#bbb] dark:text-[#555] uppercase tracking-[0.15em] flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-[#ccc] dark:bg-[#444]" />
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
            .dark .section-divider-inner { background: linear-gradient(to right, transparent, #1a1a1a, transparent) !important; }
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
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-[#111] dark:text-[#eee] antialiased selection:bg-[#111] selection:text-white dark:selection:bg-white dark:selection:text-[#111] transition-colors duration-500" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

            {/* #3 Grain/Noise Texture Overlay */}
            <div className="fixed inset-0 z-[1] pointer-events-none opacity-[0.025] dark:opacity-[0.04]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'repeat',
                    backgroundSize: '128px 128px',
                }}
            />

            {/* ══ NAVBAR ══ */}
            <nav className="fixed w-full z-50 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[#f5f5f5] dark:border-[#151515]">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-[#111] dark:bg-[#eee] rounded-lg flex items-center justify-center">
                                <BrainCircuit className="text-white dark:text-[#111] h-4 w-4" strokeWidth={1.5} />
                            </div>
                            <span className="text-[15px] font-semibold tracking-[-0.02em]">CareerCraft AI</span>
                        </div>
                        <div className="hidden md:flex items-center gap-8">
                            {['Features', 'How it Works', 'Pricing', 'FAQ'].map((item) => (
                                <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} className="text-[#999] dark:text-[#999] hover:text-[#111] dark:hover:text-[#eee] transition-colors text-[13px] font-medium">
                                    {item}
                                </a>
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={toggleTheme} className="w-8 h-8 rounded-lg border border-[#f0f0f0] dark:border-[#1a1a1a] flex items-center justify-center hover:border-[#ddd] dark:hover:border-[#333] transition-colors">
                                {isDark ? <Sun className="h-3.5 w-3.5 text-[#888]" strokeWidth={1.5} /> : <Moon className="h-3.5 w-3.5 text-[#888]" strokeWidth={1.5} />}
                            </button>
                            {user ? (
                                <Link to="/dashboard" className="bg-[#111] dark:bg-[#eee] text-white dark:text-[#111] px-5 py-2 rounded-lg text-[13px] font-semibold hover:bg-[#333] dark:hover:bg-[#ccc] transition-colors">
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link to="/login" className="text-[#999] dark:text-[#999] hover:text-[#111] dark:hover:text-[#eee] font-medium transition-colors hidden sm:block text-[13px]">
                                        Sign in
                                    </Link>
                                    <Link to="/register" className="bg-[#111] dark:bg-[#eee] text-white dark:text-[#111] px-5 py-2 rounded-lg text-[13px] font-semibold hover:bg-[#333] dark:hover:bg-[#ccc] transition-colors">
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* ══ HERO ══ */}
            <section className="pt-40 pb-24 px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 border border-[#eee] dark:border-[#1a1a1a] px-4 py-1.5 rounded-full mb-10"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-[#111] dark:bg-[#eee] animate-pulse" />
                        <span className="text-[#888] dark:text-[#888] text-[12px] font-medium tracking-wide uppercase">AI-Powered Learning</span>
                    </motion.div>

                    {/* #4 Heading with Shimmer Animation */}
                    <motion.h1
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="text-[clamp(2.5rem,7vw,5.5rem)] font-bold tracking-[-0.04em] leading-[0.95] mb-8"
                    >
                        Learn Smarter.
                        <br />
                        <span className="shimmer-text">Ace Every Interview.</span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="max-w-md mx-auto text-[15px] text-[#999] dark:text-[#999] mb-12 leading-relaxed"
                    >
                        Transform your documents into interactive study materials.
                        Practice with AI and reach your full potential.
                    </motion.p>

                    {/* #7 CTA Buttons with micro-interactions */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.3 }}
                        className="flex flex-col sm:flex-row justify-center gap-3"
                    >
                        <Link to={user ? '/dashboard' : '/register'}>
                            <motion.div
                                whileHover={{ scale: 1.03, boxShadow: '0 20px 50px rgba(0,0,0,0.12)' }}
                                whileTap={{ scale: 0.98 }}
                                className="group bg-[#111] dark:bg-[#eee] text-white dark:text-[#111] px-8 py-3.5 rounded-xl text-[14px] font-semibold transition-all duration-300 inline-flex items-center justify-center gap-2 cursor-pointer"
                            >
                                Start Learning Free
                                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
                            </motion.div>
                        </Link>
                        <a href="#features">
                            <motion.div
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                                className="border border-[#eee] dark:border-[#222] text-[#666] dark:text-[#888] px-8 py-3.5 rounded-xl text-[14px] font-semibold hover:border-[#ccc] dark:hover:border-[#444] hover:text-[#111] dark:hover:text-[#eee] transition-all duration-300 inline-flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Play size={15} strokeWidth={2} />
                                See How It Works
                            </motion.div>
                        </a>
                    </motion.div>
                </div>

                {/* ── Stats ── */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="max-w-3xl mx-auto mt-24"
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#f0f0f0] dark:bg-[#1a1a1a] rounded-2xl overflow-hidden border border-[#f0f0f0] dark:border-[#1a1a1a]">
                        {[
                            { target: 10000, suffix: '+', label: 'Active Learners' },
                            { target: 50000, suffix: '+', label: 'Quizzes Created' },
                            { target: 95, suffix: '%', label: 'Success Rate' },
                            { target: 4.9, suffix: '', label: 'User Rating' },
                        ].map(({ target, suffix, label }, i) => (
                            <div key={i} className="bg-white dark:bg-[#0a0a0a] p-6 text-center">
                                <div className="text-2xl md:text-3xl font-bold text-[#111] dark:text-[#eee] tracking-tight">
                                    <AnimatedCounter target={target} suffix={suffix} />
                                </div>
                                <p className="text-[#ccc] dark:text-[#777] text-[11px] mt-1 font-medium uppercase tracking-[0.1em]">{label}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* ── Preview Cards ── */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.7 }}
                    className="max-w-4xl mx-auto mt-16"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { title: 'AI Chat', desc: 'Ask questions about your documents', icon: MessageSquare },
                            { title: 'Quick Quiz', desc: 'Test your knowledge instantly', icon: Zap },
                            { title: 'Flashcards', desc: 'Smart spaced repetition', icon: Layers },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.9 + i * 0.12, duration: 0.5 }}
                                whileHover={{ y: -4, transition: { duration: 0.3 } }}
                                className="group p-6 rounded-[20px] bg-[#fafafa] dark:bg-[#111] border border-[#f0f0f0] dark:border-[#1a1a1a] hover:bg-white dark:hover:bg-[#151515] hover:shadow-[0_12px_40px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:border-[#e8e8e8] dark:hover:border-[#222] transition-all duration-500 cursor-default"
                            >
                                <div className="w-10 h-10 rounded-xl bg-[#f0f0f0] dark:bg-[#1a1a1a] border border-[#e8e8e8] dark:border-[#222] flex items-center justify-center mb-4 group-hover:bg-[#111] dark:group-hover:bg-[#eee] group-hover:border-[#111] dark:group-hover:border-[#eee] transition-all duration-500">
                                    <item.icon size={18} className="text-[#888] dark:text-[#888] group-hover:text-white dark:group-hover:text-[#111] transition-colors duration-500" strokeWidth={1.5} />
                                </div>
                                <h4 className="font-semibold text-[#111] dark:text-[#eee] text-[14px] mb-1">{item.title}</h4>
                                <p className="text-[#999] dark:text-[#999] text-[12px]">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
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
                            <p className="text-[#ccc] dark:text-[#777] text-[11px] font-semibold uppercase tracking-[0.2em] mb-4">Features</p>
                        </Reveal>
                        <Reveal delay={0.05}>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em] mb-4">
                                Everything you need
                            </h2>
                        </Reveal>
                        <Reveal delay={0.1}>
                            <p className="text-[#999] dark:text-[#999] max-w-md mx-auto text-[14px]">
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
                            <p className="text-[#ccc] dark:text-[#777] text-[11px] font-semibold uppercase tracking-[0.2em] mb-4">How It Works</p>
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
                                    className="w-12 h-12 mx-auto mb-6 rounded-full bg-[#fafafa] dark:bg-[#111] border border-[#f0f0f0] dark:border-[#1a1a1a] flex items-center justify-center"
                                >
                                    <span className="text-[13px] font-bold tracking-tight">{step.num}</span>
                                </motion.div>
                                <h3 className="text-[15px] font-semibold mb-2">{step.title}</h3>
                                <p className="text-[#999] dark:text-[#999] text-[13px] max-w-[200px] mx-auto">{step.desc}</p>
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
                            <p className="text-[#ccc] dark:text-[#777] text-[11px] font-semibold uppercase tracking-[0.2em] mb-4">Pricing</p>
                        </Reveal>
                        <Reveal delay={0.05}>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em] mb-4">
                                Simple pricing
                            </h2>
                        </Reveal>
                        <Reveal delay={0.1}>
                            <p className="text-[#999] dark:text-[#999] text-[14px]">No hidden fees. Cancel anytime.</p>
                        </Reveal>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <PricingCard name="Free" price="0" features={['3 Documents', '50 AI Chats/month', '2 Quizzes/day']} delay={0.1} />
                        <PricingCard name="Pro" price="299" features={['Unlimited Documents', '500 AI Chats/month', 'Unlimited Quizzes', 'Mock Interviews']} popular delay={0.15} />
                        <PricingCard name="Enterprise" price="999" features={['Everything in Pro', 'Unlimited AI', 'Priority Support']} delay={0.2} />
                    </div>
                    <div className="text-center mt-10">
                        <Link to="/pricing" className="inline-flex items-center gap-2 text-[#999] dark:text-[#999] hover:text-[#111] dark:hover:text-[#eee] font-medium text-[13px] hover:gap-3 transition-all">
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
                            <p className="text-[#ccc] dark:text-[#777] text-[11px] font-semibold uppercase tracking-[0.2em] mb-4">Testimonials</p>
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
                            <p className="text-[#ccc] dark:text-[#777] text-[11px] font-semibold uppercase tracking-[0.2em] mb-4">FAQ</p>
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
                        <div className="p-16 md:p-20 rounded-[28px] bg-[#111] dark:bg-[#eee] relative overflow-hidden">
                            {/* Subtle radial glow inside CTA */}
                            <div className="absolute inset-0 opacity-30" style={{
                                background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.08), transparent 60%)',
                            }} />
                            <div className="relative z-10">
                                <h2 className="text-3xl md:text-4xl font-bold text-white dark:text-[#111] mb-4 tracking-[-0.03em]">
                                    Ready to start learning?
                                </h2>
                                <p className="text-white/40 dark:text-[#111]/40 mb-8 text-[14px] max-w-sm mx-auto">
                                    Join thousands of students leveling up their skills with CareerCraft AI.
                                </p>
                                <div className="flex flex-col sm:flex-row justify-center gap-3">
                                    <Link to="/register">
                                        <motion.div
                                            whileHover={{ scale: 1.04, boxShadow: '0 12px 40px rgba(255,255,255,0.1)' }}
                                            whileTap={{ scale: 0.97 }}
                                            className="bg-white dark:bg-[#111] text-[#111] dark:text-[#eee] px-8 py-3.5 rounded-xl text-[14px] font-semibold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            Start Free Today
                                            <ArrowRight size={16} strokeWidth={2} />
                                        </motion.div>
                                    </Link>
                                    <Link to="/login" className="border border-white/15 dark:border-[#111]/15 text-white/70 dark:text-[#111]/70 px-8 py-3.5 rounded-xl text-[14px] font-medium hover:text-white dark:hover:text-[#111] hover:border-white/30 dark:hover:border-[#111]/30 transition-all inline-flex items-center justify-center">
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
                    background: 'linear-gradient(to right, transparent, #ddd, transparent)',
                }} />
                <div className="max-w-6xl mx-auto px-6 py-20">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                        <div>
                            <div className="flex items-center gap-2.5 mb-5">
                                <div className="w-7 h-7 bg-[#111] dark:bg-[#eee] rounded-lg flex items-center justify-center">
                                    <BrainCircuit className="text-white dark:text-[#111] h-3.5 w-3.5" strokeWidth={1.5} />
                                </div>
                                <span className="text-[14px] font-semibold">CareerCraft AI</span>
                            </div>
                            <p className="text-[#bbb] dark:text-[#999] text-[13px] leading-relaxed">AI-powered learning for students and professionals.</p>
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
                                                <Link to={link.href} className="text-[#bbb] dark:text-[#999] hover:text-[#111] dark:hover:text-[#eee] transition-colors text-[13px]">{link.label}</Link>
                                            ) : (
                                                <a href={link.href} className="text-[#bbb] dark:text-[#999] hover:text-[#111] dark:hover:text-[#eee] transition-colors text-[13px]">{link.label}</a>
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
                        <p className="text-[#ccc] dark:text-[#777] text-[12px]">© {new Date().getFullYear()} CareerCraft AI</p>
                        <p className="text-[#ddd] dark:text-[#666] text-[12px]">Made with care by Arpit Chhabra</p>
                    </div>
                </div>
            </footer>

            {/* ═══ GLOBAL STYLES for shimmer + marquee ═══ */}
            <style>{`
                /* #4 Shimmer animation on hero text */
                .shimmer-text {
                    background: linear-gradient(90deg, #bbb 0%, #555 25%, #bbb 50%, #555 75%, #bbb 100%);
                    background-size: 300% 100%;
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: shimmer 6s ease-in-out infinite;
                }
                .dark .shimmer-text {
                    background: linear-gradient(90deg, #555 0%, #aaa 25%, #555 50%, #aaa 75%, #555 100%);
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

                /* Dark mode adjustments for gradient dividers */
                .dark footer .footer-border {
                    border-image: linear-gradient(to right, transparent, #1a1a1a, transparent) 1 !important;
                }
            `}</style>
        </div>
    );
};

export default Home;
