import { useEffect, useState } from 'react';
import api from '../utils/api';
import aiService from '../utils/aiService';
import { Layers, Plus, ChevronLeft, ChevronRight, RotateCcw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Flashcards = () => {
    const [decks, setDecks] = useState([]);
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState('');
    const [activeDeck, setActiveDeck] = useState(null);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        fetchDecks();
        fetchDocs();
    }, []);

    const fetchDecks = async () => {
        try {
            const res = await api.get('/ai/flashcards');
            setDecks(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchDocs = async () => {
        try {
            const res = await api.get('/docs');
            setDocs(res.data);
        } catch (err) { console.error(err); }
    };

    const handleCreate = async () => {
        if (!selectedDoc) return;
        setLoading(true);
        try {
            const deckData = await aiService.generateFlashcards(selectedDoc);

            if (Array.isArray(deckData)) {
                const localDeck = {
                    _id: 'local-' + Date.now(),
                    title: 'Local Flashcards',
                    cards: deckData
                };
                startStudy(localDeck);
            } else {
                fetchDecks();
            }
            setSelectedDoc('');
        } catch (err) {
            alert(err.response?.data?.message || err.response?.data?.error || 'Failed to generate deck');
        } finally {
            setLoading(false);
        }
    };

    const startStudy = (deck) => {
        setActiveDeck(deck);
        setCurrentCardIndex(0);
        setIsFlipped(false);
    };

    const nextCard = () => {
        if (activeDeck && currentCardIndex < activeDeck.cards.length - 1) {
            setIsFlipped(false);
            setTimeout(() => setCurrentCardIndex(prev => prev + 1), 150);
        }
    };

    const prevCard = () => {
        if (currentCardIndex > 0) {
            setIsFlipped(false);
            setTimeout(() => setCurrentCardIndex(prev => prev - 1), 150);
        }
    };

    const resetDeck = () => {
        setCurrentCardIndex(0);
        setIsFlipped(false);
    };

    // Study Mode
    if (activeDeck) {
        const card = activeDeck.cards[currentCardIndex];
        const progress = ((currentCardIndex + 1) / activeDeck.cards.length) * 100;

        return (
            <div className="flex flex-col items-center justify-center p-4 md:p-8 max-w-3xl mx-auto min-h-[80vh]">
                {/* Header */}
                <div className="w-full flex justify-between items-center mb-6">
                    <button
                        onClick={() => setActiveDeck(null)}
                        className="flex items-center gap-2 text-[#999] hover:text-[#111] dark:hover:text-[#eee] transition-colors"
                    >
                        <ChevronLeft size={18} strokeWidth={1.5} />
                        <span className="text-[13px] font-medium">Back</span>
                    </button>
                    <h2 className="text-[15px] font-semibold text-[#111] dark:text-[#eee] truncate px-4">{activeDeck.title}</h2>
                    <button
                        onClick={resetDeck}
                        className="text-[#999] hover:text-[#111] dark:hover:text-[#eee] transition-colors"
                        title="Restart deck"
                    >
                        <RotateCcw size={16} strokeWidth={1.5} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#f0f0f0] dark:bg-[#1a1a1a] rounded-full h-1 mb-8">
                    <motion.div
                        className="bg-[#111] dark:bg-[#eee] h-1 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    />
                </div>

                {/* Card Counter */}
                <div className="text-[12px] font-medium text-[#999] mb-4 tracking-wide">
                    Card {currentCardIndex + 1} of {activeDeck.cards.length}
                </div>

                {/* Flashcard with 3D Flip */}
                <div
                    className="flip-card w-full max-w-lg h-80 cursor-pointer"
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    <motion.div
                        className={`flip-card-inner w-full h-full ${isFlipped ? 'flipped' : ''}`}
                    >
                        {/* Front */}
                        <div className="flip-card-front absolute inset-0 w-full h-full bg-[#fafafa] dark:bg-[#111] rounded-[20px] border border-[#f0f0f0] dark:border-[#1a1a1a] flex flex-col items-center justify-center p-8 text-center">
                            <div className="absolute top-4 left-4 px-2.5 py-1 bg-[#f0f0f0] dark:bg-[#1a1a1a] text-[#999] text-[10px] font-semibold rounded-lg uppercase tracking-wider">
                                Question
                            </div>
                            <p className="text-lg md:text-xl font-medium text-[#111] dark:text-[#eee] leading-relaxed">
                                {card.front}
                            </p>
                            <p className="absolute bottom-4 text-[10px] text-[#bbb] dark:text-[#666]">
                                Tap to reveal answer
                            </p>
                        </div>

                        {/* Back */}
                        <div className="flip-card-back absolute inset-0 w-full h-full bg-[#111] dark:bg-[#eee] rounded-[20px] flex flex-col items-center justify-center p-8 text-center">
                            <div className="absolute top-4 left-4 px-2.5 py-1 bg-white/10 dark:bg-[#111]/10 text-white/50 dark:text-[#111]/50 text-[10px] font-semibold rounded-lg uppercase tracking-wider">
                                Answer
                            </div>
                            <p className="text-lg md:text-xl font-medium text-white dark:text-[#111] leading-relaxed">
                                {card.back}
                            </p>
                            <p className="absolute bottom-4 text-[10px] text-white/30 dark:text-[#111]/30">
                                Tap to see question
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Navigation */}
                <div className="flex gap-3 mt-8">
                    <motion.button
                        onClick={prevCard}
                        disabled={currentCardIndex === 0}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-6 py-3 bg-[#fafafa] dark:bg-[#111] border border-[#f0f0f0] dark:border-[#1a1a1a] text-[#111] dark:text-[#eee] rounded-xl disabled:opacity-30 hover:border-[#e8e8e8] dark:hover:border-[#222] transition-all duration-300 flex items-center gap-2 text-[13px] font-medium"
                    >
                        <ChevronLeft size={16} strokeWidth={1.5} />
                        Previous
                    </motion.button>
                    <motion.button
                        onClick={nextCard}
                        disabled={currentCardIndex === activeDeck.cards.length - 1}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-6 py-3 bg-[#111] dark:bg-[#eee] text-white dark:text-[#111] rounded-xl disabled:opacity-30 transition-all duration-300 flex items-center gap-2 text-[13px] font-semibold"
                    >
                        Next
                        <ChevronRight size={16} strokeWidth={1.5} />
                    </motion.button>
                </div>

                {/* Completion */}
                {currentCardIndex === activeDeck.cards.length - 1 && (
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 text-center text-[#999] text-[13px]"
                    >
                        🎉 You've reached the end! <button onClick={resetDeck} className="text-[#111] dark:text-[#eee] font-medium hover:opacity-70 transition-opacity underline underline-offset-2">Start over?</button>
                    </motion.p>
                )}
            </div>
        );
    }

    // List Mode
    return (
        <div className="space-y-6">
            <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold text-[#111] dark:text-[#eee] tracking-[-0.03em]"
            >
                Flashcard Decks
            </motion.h1>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-[20px] bg-[#fafafa] dark:bg-[#111] border border-[#f0f0f0] dark:border-[#1a1a1a]"
            >
                <h2 className="text-[15px] font-semibold mb-4 text-[#111] dark:text-[#eee] flex items-center gap-2">
                    <Sparkles size={16} strokeWidth={1.5} className="text-[#888]" />
                    Generate New Deck
                </h2>
                <div className="flex gap-3 flex-wrap">
                    <select
                        value={selectedDoc}
                        onChange={(e) => setSelectedDoc(e.target.value)}
                        className="flex-1 min-w-[200px] border border-[#f0f0f0] dark:border-[#1a1a1a] p-3 rounded-xl bg-white dark:bg-[#0a0a0a] text-[#111] dark:text-[#eee] text-[13px] focus:border-[#111] dark:focus:border-[#eee] outline-none transition-colors duration-300"
                    >
                        <option value="">Select a Document</option>
                        {docs.map(d => <option key={d._id} value={d._id}>{d.filename}</option>)}
                    </select>
                    <motion.button
                        onClick={handleCreate}
                        disabled={loading || !selectedDoc}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-[#111] dark:bg-[#eee] text-white dark:text-[#111] px-6 py-3 rounded-xl disabled:opacity-40 flex items-center gap-2 text-[13px] font-semibold transition-all duration-300"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin h-3.5 w-3.5 border-2 border-white dark:border-[#111] border-t-transparent rounded-full"></span>
                                Generating...
                            </>
                        ) : (
                            <>
                                <Plus size={16} strokeWidth={1.5} />
                                Generate with AI
                            </>
                        )}
                    </motion.button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {decks.map((deck, idx) => (
                    <motion.div
                        key={deck._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        onClick={() => startStudy(deck)}
                        className="p-6 rounded-[20px] bg-[#fafafa] dark:bg-[#111] border border-[#f0f0f0] dark:border-[#1a1a1a] hover:bg-white dark:hover:bg-[#151515] hover:shadow-[0_20px_60px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)] hover:border-[#e8e8e8] dark:hover:border-[#222] transition-all duration-500 cursor-pointer group"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#f0f0f0] dark:bg-[#1a1a1a] border border-[#e8e8e8] dark:border-[#222] flex items-center justify-center group-hover:bg-[#111] dark:group-hover:bg-[#eee] group-hover:border-[#111] dark:group-hover:border-[#eee] transition-all duration-500">
                                <Layers size={18} strokeWidth={1.5} className="text-[#888] group-hover:text-white dark:group-hover:text-[#111] transition-colors duration-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-[14px] truncate text-[#111] dark:text-[#eee]">{deck.title}</h3>
                                <p className="text-[#999] text-[12px]">{deck.cards.length} Cards</p>
                            </div>
                        </div>
                        <button className="w-full bg-[#f0f0f0] dark:bg-[#1a1a1a] text-[#111] dark:text-[#eee] py-2.5 rounded-xl text-[13px] font-medium hover:bg-[#111] dark:hover:bg-[#eee] hover:text-white dark:hover:text-[#111] transition-all duration-500">
                            Study Now
                        </button>
                    </motion.div>
                ))}
            </div>

            {decks.length === 0 && !loading && (
                <div className="text-center py-20">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-[#f0f0f0] dark:bg-[#1a1a1a] border border-[#e8e8e8] dark:border-[#222] flex items-center justify-center mb-4">
                        <Layers size={24} className="text-[#888]" strokeWidth={1.5} />
                    </div>
                    <p className="text-[#999] text-[14px]">No flashcard decks yet. Generate one from your documents!</p>
                </div>
            )}
        </div>
    );
};

export default Flashcards;
