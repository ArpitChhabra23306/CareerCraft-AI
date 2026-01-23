import { useEffect, useState } from 'react';
import api from '../utils/api';
import aiService from '../utils/aiService';
import { Layers, Plus, RotateCcw } from 'lucide-react';

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
                // Local AI returned cards array
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
            setCurrentCardIndex(prev => prev + 1);
            setIsFlipped(false);
        }
    };

    const prevCard = () => {
        if (currentCardIndex > 0) {
            setCurrentCardIndex(prev => prev - 1);
            setIsFlipped(false);
        }
    };

    // Render Study Mode
    if (activeDeck) {
        const card = activeDeck.cards[currentCardIndex];
        return (
            <div className="flex flex-col items-center justify-center p-8 max-w-2xl mx-auto h-full">
                <div className="mb-6 flex justify-between w-full items-center">
                    <button onClick={() => setActiveDeck(null)} className="text-gray-500 hover:text-gray-800">Back to Decks</button>
                    <h2 className="text-xl font-bold">{activeDeck.title}</h2>
                    <span className="text-sm font-medium">{currentCardIndex + 1} / {activeDeck.cards.length}</span>
                </div>

                <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="w-full h-80 bg-white rounded-2xl shadow-lg cursor-pointer perspective-1000 group relative flex items-center justify-center p-8 text-center transition-all hover:shadow-xl"
                >
                    <div className="text-2xl font-medium text-gray-800">
                        {isFlipped ? card.back : card.front}
                    </div>
                    <div className="absolute bottom-4 right-4 text-xs text-gray-400">
                        Click to Flip
                    </div>
                </div>

                <div className="flex gap-4 mt-8">
                    <button
                        onClick={prevCard}
                        disabled={currentCardIndex === 0}
                        className="px-6 py-2 bg-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300"
                    >
                        Previous
                    </button>
                    <button
                        onClick={nextCard}
                        disabled={currentCardIndex === activeDeck.cards.length - 1}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 hover:bg-indigo-700"
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    }

    // Render List Mode
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Flashcard Decks</h1>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold mb-4">Generate New Deck</h2>
                <div className="flex gap-4">
                    <select
                        value={selectedDoc}
                        onChange={(e) => setSelectedDoc(e.target.value)}
                        className="flex-1 border p-2 rounded-lg"
                    >
                        <option value="">Select a Document</option>
                        {docs.map(d => <option key={d._id} value={d._id}>{d.filename}</option>)}
                    </select>
                    <button
                        onClick={handleCreate}
                        disabled={loading || !selectedDoc}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? 'Generating...' : <><Plus size={18} /> Generate with AI</>}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {decks.map(deck => (
                    <div key={deck._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer" onClick={() => startStudy(deck)}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg"><Layers size={24} /></div>
                            <h3 className="font-semibold text-lg truncate">{deck.title}</h3>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">{deck.cards.length} Cards</p>
                        <button className="w-full bg-indigo-50 text-indigo-700 py-2 rounded-lg font-medium">Study Now</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Flashcards;
