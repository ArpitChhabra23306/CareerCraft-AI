import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    ArrowRight, BrainCircuit, FileText, Layers, MessageSquare, Zap, Moon, Sun,
    Trophy, Shield, Sparkles, Check, ChevronDown, Star, Users, BookOpen,
    Target, Rocket, Clock, Award, Play, ArrowUpRight
} from 'lucide-react';
import { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';

// Animated counter component
const AnimatedCounter = ({ target, suffix = '', prefix = '' }) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (isInView) {
            const duration = 2000;
            const steps = 60;
            const increment = target / steps;
            let current = 0;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    setCount(target);
                    clearInterval(timer);
                } else {
                    setCount(Math.floor(current));
                }
            }, duration / steps);
            return () => clearInterval(timer);
        }
    }, [isInView, target]);

    return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
};

// Feature card with gradient border
const FeatureCard = ({ icon: Icon, title, description, gradient, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        className="group relative"
    >
        <div className={`absolute inset-0 ${gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />
        <div className="relative bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-transparent dark:hover:border-transparent transition-all duration-300 h-full hover:shadow-2xl hover:-translate-y-1">
            <div className={`w-14 h-14 ${gradient} rounded-xl flex items-center justify-center text-white mb-5 shadow-lg`}>
                <Icon size={26} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
        </div>
    </motion.div>
);

// How it works step
const StepCard = ({ number, title, description, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        className="text-center"
    >
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/30">
            {number}
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
    </motion.div>
);

// Testimonial card
const TestimonialCard = ({ name, role, content, avatar, delay }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg"
    >
        <div className="flex items-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
            ))}
        </div>
        <p className="text-gray-700 dark:text-gray-300 mb-4 italic">"{content}"</p>
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {avatar}
            </div>
            <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{name}</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs">{role}</p>
            </div>
        </div>
    </motion.div>
);

// FAQ Accordion item
const FAQItem = ({ question, answer, isOpen, onClick }) => (
    <div className="border-b border-gray-200 dark:border-gray-800">
        <button
            onClick={onClick}
            className="w-full py-5 flex items-center justify-between text-left"
        >
            <span className="font-semibold text-gray-900 dark:text-white">{question}</span>
            <ChevronDown className={`text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} size={20} />
        </button>
        <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-40 pb-5' : 'max-h-0'}`}>
            <p className="text-gray-600 dark:text-gray-400">{answer}</p>
        </div>
    </div>
);

// Pricing preview card
const PricingPreview = ({ name, price, features, popular, gradient }) => (
    <div className={`relative p-6 rounded-2xl ${popular ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800'}`}>
        {popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Sparkles size={12} /> POPULAR
                </span>
            </div>
        )}
        <h3 className={`text-xl font-bold mb-2 ${popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{name}</h3>
        <div className="mb-4">
            <span className={`text-3xl font-bold ${popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>₹{price}</span>
            <span className={popular ? 'text-indigo-200' : 'text-gray-500'}>/month</span>
        </div>
        <ul className="space-y-2 mb-6">
            {features.map((f, i) => (
                <li key={i} className={`flex items-center gap-2 text-sm ${popular ? 'text-indigo-100' : 'text-gray-600 dark:text-gray-400'}`}>
                    <Check size={16} className={popular ? 'text-green-300' : 'text-green-500'} />
                    {f}
                </li>
            ))}
        </ul>
    </div>
);

const Home = () => {
    const { user } = useContext(AuthContext);
    const [isDark, setIsDark] = useState(false);
    const [openFAQ, setOpenFAQ] = useState(0);

    useEffect(() => {
        setIsDark(document.documentElement.classList.contains('dark'));
    }, []);

    const toggleTheme = () => {
        document.documentElement.classList.toggle('dark');
        setIsDark(!isDark);
    };

    const features = [
        { icon: FileText, title: 'Smart Documents', description: 'Upload PDFs and notes. AI extracts key insights and creates summaries instantly.', gradient: 'bg-gradient-to-br from-blue-500 to-cyan-500' },
        { icon: MessageSquare, title: 'AI Chat', description: 'Have conversations with your documents. Ask questions and get intelligent answers.', gradient: 'bg-gradient-to-br from-purple-500 to-pink-500' },
        { icon: Layers, title: 'Auto Flashcards', description: 'Generate study decks automatically from your materials for better retention.', gradient: 'bg-gradient-to-br from-orange-500 to-red-500' },
        { icon: Zap, title: 'Instant Quizzes', description: 'Test knowledge with AI-generated quizzes tailored to your documents.', gradient: 'bg-gradient-to-br from-green-500 to-emerald-500' },
        { icon: Target, title: 'Mock Interviews', description: 'Practice with realistic AI interviewer that adapts to your role and skills.', gradient: 'bg-gradient-to-br from-indigo-500 to-purple-500' },
        { icon: Trophy, title: 'Gamification', description: 'Earn XP, maintain streaks, climb leaderboards, and unlock achievements.', gradient: 'bg-gradient-to-br from-yellow-500 to-orange-500' },
    ];

    const faqs = [
        { q: 'How does the AI analyze my documents?', a: 'Our AI uses advanced natural language processing to understand context, extract key concepts, and generate relevant study materials from your uploaded documents.' },
        { q: 'Is my data secure?', a: 'Absolutely. All documents are encrypted and stored securely. We never share your data with third parties.' },
        { q: 'Can I cancel my subscription anytime?', a: 'Yes, you can cancel anytime. Your access continues until the end of your billing period.' },
        { q: 'What document formats are supported?', a: 'Currently we support PDF files. We are working on adding support for more formats soon.' },
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100 font-sans overflow-x-hidden">
            {/* Navbar */}
            <nav className="fixed w-full bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                                <BrainCircuit className="text-white h-5 w-5" />
                            </div>
                            <span className="text-xl font-bold gradient-text">CareerCraft AI</span>
                        </div>
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm font-medium">Features</a>
                            <a href="#how-it-works" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm font-medium">How it Works</a>
                            <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm font-medium">Pricing</a>
                            <a href="#faq" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm font-medium">FAQ</a>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                {isDark ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-indigo-600" />}
                            </button>
                            {user ? (
                                <Link to="/dashboard" className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2 rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all">
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors hidden sm:block">
                                        Login
                                    </Link>
                                    <Link to="/register" className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2 rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all">
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-gradient-to-r from-pink-500/20 to-orange-500/20 rounded-full blur-3xl" />
                </div>

                <div className="max-w-6xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 px-4 py-2 rounded-full text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-6"
                    >
                        <Sparkles size={16} />
                        AI-Powered Learning Platform
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6"
                    >
                        <span className="text-gray-900 dark:text-white">Learn Smarter,</span>
                        <br />
                        <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Ace Every Interview
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-400 mb-10"
                    >
                        Transform your documents into interactive study materials. Generate quizzes,
                        flashcards, and practice interviews with the power of AI.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-col sm:flex-row justify-center gap-4"
                    >
                        <Link to={user ? "/dashboard" : "/register"} className="group bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:shadow-xl hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2">
                            Start Learning Free
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <a href="#features" className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2">
                            <Play size={20} />
                            See How It Works
                        </a>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8"
                    >
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                                <AnimatedCounter target={10000} suffix="+" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Active Learners</p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                                <AnimatedCounter target={50000} suffix="+" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Quizzes Generated</p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                                <AnimatedCounter target={95} suffix="%" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Success Rate</p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                                <AnimatedCounter target={4.9} suffix="" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">User Rating</p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-gray-50 dark:bg-gray-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm uppercase tracking-wider"
                        >
                            Features
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mt-3 mb-4"
                        >
                            Everything You Need to Excel
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg"
                        >
                            Powerful AI tools designed to accelerate your learning and career preparation.
                        </motion.p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <FeatureCard key={index} {...feature} delay={index * 0.1} />
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-24">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm uppercase tracking-wider"
                        >
                            How It Works
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mt-3"
                        >
                            Start Learning in 3 Steps
                        </motion.h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        {/* Connection line */}
                        <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500" />

                        <StepCard number="1" title="Upload Documents" description="Drop your PDFs, notes, or study materials into the platform." delay={0.1} />
                        <StepCard number="2" title="AI Generates Content" description="Our AI analyzes and creates quizzes, flashcards, and summaries." delay={0.2} />
                        <StepCard number="3" title="Learn & Practice" description="Study smart, track progress, and ace your interviews." delay={0.3} />
                    </div>
                </div>
            </section>

            {/* Pricing Preview */}
            <section id="pricing" className="py-24 bg-gray-50 dark:bg-gray-900/50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm uppercase tracking-wider"
                        >
                            Pricing
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mt-3 mb-4"
                        >
                            Simple, Transparent Pricing
                        </motion.h2>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        <PricingPreview
                            name="Free"
                            price="0"
                            features={['3 Documents', '50 AI Chats/month', '2 Quizzes/day']}
                        />
                        <PricingPreview
                            name="Pro"
                            price="299"
                            features={['Unlimited Documents', '500 AI Chats/month', 'Unlimited Quizzes', 'Mock Interviews']}
                            popular
                        />
                        <PricingPreview
                            name="Enterprise"
                            price="999"
                            features={['Everything in Pro', 'Unlimited AI', 'Priority Support']}
                        />
                    </motion.div>

                    <div className="text-center mt-8">
                        <Link to="/pricing" className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold hover:gap-3 transition-all">
                            View Full Pricing <ArrowUpRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm uppercase tracking-wider"
                        >
                            Testimonials
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mt-3"
                        >
                            Loved by Learners
                        </motion.h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <TestimonialCard
                            name="Priya Sharma"
                            role="Medical Student"
                            content="CareerCraft AI helped me ace my exams! The AI-generated quizzes are incredibly accurate and saved me hours of study time."
                            avatar="P"
                            delay={0.1}
                        />
                        <TestimonialCard
                            name="Rahul Verma"
                            role="Software Engineer"
                            content="The mock interview feature is a game-changer. Got my dream job at a FAANG company after practicing here!"
                            avatar="R"
                            delay={0.2}
                        />
                        <TestimonialCard
                            name="Ananya Singh"
                            role="MBA Student"
                            content="Love the flashcard generation! It makes studying complex case studies so much easier. Highly recommend!"
                            avatar="A"
                            delay={0.3}
                        />
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-24 bg-gray-50 dark:bg-gray-900/50">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm uppercase tracking-wider"
                        >
                            FAQ
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mt-3"
                        >
                            Common Questions
                        </motion.h2>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6"
                    >
                        {faqs.map((faq, index) => (
                            <FAQItem
                                key={index}
                                question={faq.q}
                                answer={faq.a}
                                isOpen={openFAQ === index}
                                onClick={() => setOpenFAQ(openFAQ === index ? -1 : index)}
                            />
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="max-w-5xl mx-auto bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-12 md:p-16 text-center text-white relative overflow-hidden"
                >
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

                    <div className="relative z-10">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Transform Your Learning?</h2>
                        <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto">
                            Join thousands of students and professionals who are leveling up their skills with CareerCraft AI.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link to="/register" className="bg-white text-indigo-600 px-8 py-4 rounded-xl text-lg font-bold hover:bg-gray-100 transition-colors shadow-xl">
                                Start Free Today
                            </Link>
                            <Link to="/login" className="bg-white/10 backdrop-blur text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-white/20 transition-colors border border-white/30">
                                Sign In
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 dark:bg-gray-950 text-white py-16 border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                                    <BrainCircuit className="text-white h-5 w-5" />
                                </div>
                                <span className="text-xl font-bold">CareerCraft AI</span>
                            </div>
                            <p className="text-gray-400 text-sm">AI-powered learning platform for students and professionals.</p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Product</h4>
                            <ul className="space-y-2 text-gray-400 text-sm">
                                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Company</h4>
                            <ul className="space-y-2 text-gray-400 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Legal</h4>
                            <ul className="space-y-2 text-gray-400 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Refund Policy</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
                        <p>© {new Date().getFullYear()} CareerCraft AI. Made with ❤️ by Arpit Chhabra</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
