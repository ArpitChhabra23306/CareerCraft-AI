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
    // Study Mode State
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

    // Render Study Mode
    if (activeDeck) {
        const card = activeDeck.cards[currentCardIndex];
        const progress = ((currentCardIndex + 1) / activeDeck.cards.length) * 100;

        return (
            <div className="flex flex-col items-center justify-center p-4 md:p-8 max-w-3xl mx-auto min-h-[80vh]">
                {/* Header */}
                <div className="w-full flex justify-between items-center mb-6">
                    <button
                        onClick={() => setActiveDeck(null)}
                        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span className="font-medium">Back</span>
                    </button>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white truncate px-4">{activeDeck.title}</h2>
                    <button
                        onClick={resetDeck}
                        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        title="Restart deck"
                    >
                        <RotateCcw size={18} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-8">
                    <motion.div
                        className="bg-gradient-to-r from-indigo-600 to-purple-500 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>

                {/* Card Counter */}
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
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
                        {/* Front of card */}
                        <div className="flip-card-front absolute inset-0 w-full h-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center p-8 text-center">
                            <div className="absolute top-4 left-4 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-lg">
                                Question
                            </div>
                            <p className="text-xl md:text-2xl font-medium text-gray-800 dark:text-white leading-relaxed">
                                {card.front}
                            </p>
                            <p className="absolute bottom-4 text-xs text-gray-400 dark:text-gray-500">
                                Tap to reveal answer
                            </p>
                        </div>

                        {/* Back of card */}
                        <div className="flip-card-back absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-xl flex flex-col items-center justify-center p-8 text-center">
                            <div className="absolute top-4 left-4 px-2 py-1 bg-white/20 text-white text-xs font-semibold rounded-lg">
                                Answer
                            </div>
                            <p className="text-xl md:text-2xl font-medium text-white leading-relaxed">
                                {card.back}
                            </p>
                            <p className="absolute bottom-4 text-xs text-white/60">
                                Tap to see question
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Navigation */}
                <div className="flex gap-4 mt-8">
                    <button
                        onClick={prevCard}
                        disabled={currentCardIndex === 0}
                        className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center gap-2 font-medium"
                    >
                        <ChevronLeft size={18} />
                        Previous
                    </button>
                    <button
                        onClick={nextCard}
                        disabled={currentCardIndex === activeDeck.cards.length - 1}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl disabled:opacity-30 hover:bg-indigo-700 transition-all flex items-center gap-2 font-medium shadow-lg shadow-indigo-500/25"
                    >
                        Next
                        <ChevronRight size={18} />
                    </button>
                </div>

                {/* Completion Message */}
                {currentCardIndex === activeDeck.cards.length - 1 && (
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 text-center text-gray-500 dark:text-gray-400"
                    >
                        🎉 You've reached the end! <button onClick={resetDeck} className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Start over?</button>
                    </motion.p>
                )}
            </div>
        );
    }

    // Render List Mode
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Flashcard Decks</h1>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800"
            >
                <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                    <Sparkles className="text-amber-500" size={20} />
                    Generate New Deck
                </h2>
                <div className="flex gap-4 flex-wrap">
                    <select
                        value={selectedDoc}
                        onChange={(e) => setSelectedDoc(e.target.value)}
                        className="flex-1 min-w-[200px] border border-gray-200 dark:border-gray-700 p-3 rounded-xl dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    >
                        <option value="">Select a Document</option>
                        {docs.map(d => <option key={d._id} value={d._id}>{d.filename}</option>)}
                    </select>
                    <button
                        onClick={handleCreate}
                        disabled={loading || !selectedDoc}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 font-medium shadow-lg shadow-indigo-500/25 transition-all"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                Generating...
                            </>
                        ) : (
                            <>
                                <Plus size={18} />
                                Generate with AI
                            </>
                        )}
                    </button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {decks.map((deck, idx) => (
                    <motion.div
                        key={deck._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => startStudy(deck)}
                        className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-all cursor-pointer card-hover group"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl group-hover:scale-110 transition-transform">
                                <Layers size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg truncate text-gray-800 dark:text-white">{deck.title}</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">{deck.cards.length} Cards</p>
                            </div>
                        </div>
                        <button className="w-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 py-2.5 rounded-xl font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
                            Study Now
                        </button>
                    </motion.div>
                ))}
            </div>

            {decks.length === 0 && !loading && (
                <div className="text-center py-16 text-gray-400 dark:text-gray-500">
                    <Layers size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No flashcard decks yet. Generate one from your documents!</p>
                </div>
            )}
        </div>
    );
};

export default Flashcards;
