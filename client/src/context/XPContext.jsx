import { createContext, useState, useCallback, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Flame, Trophy } from 'lucide-react';

const XPContext = createContext();

export const useXP = () => {
    const context = useContext(XPContext);
    if (!context) {
        throw new Error('useXP must be used within XPProvider');
    }
    return context;
};

const XPNotification = ({ notification, onComplete }) => {
    const { amount, reason, isStreak, streakBonus } = notification;

    const getIcon = () => {
        if (isStreak) return <Flame className="text-orange-400" size={24} />;
        if (streakBonus) return <Trophy className="text-yellow-400" size={24} />;
        return <Star className="text-yellow-400" size={24} />;
    };

    const getMessage = () => {
        if (isStreak) return `${reason} streak bonus!`;
        if (reason === 'daily_login') return 'Daily Login Bonus!';
        if (reason === 'document_upload') return 'Document Uploaded!';
        if (reason === 'quiz_completion') return 'Quiz Completed!';
        if (reason === 'flashcard_creation') return 'Flashcards Created!';
        if (reason === 'interview_completion') return 'Interview Completed!';
        if (reason === 'document_chat') return 'Chat Learning!';
        return 'XP Earned!';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            transition={{ type: 'spring', damping: 15 }}
            onAnimationComplete={() => {
                setTimeout(onComplete, 2000);
            }}
            className="fixed bottom-6 right-6 z-50"
        >
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4">
                <div className="bg-white/20 p-2 rounded-xl">
                    {getIcon()}
                </div>
                <div>
                    <p className="text-sm text-white/80">{getMessage()}</p>
                    <p className="text-2xl font-bold">+{amount} XP</p>
                </div>
            </div>
        </motion.div>
    );
};

export const XPProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const showXPNotification = useCallback((amount, reason = 'activity', options = {}) => {
        if (!amount || amount <= 0) return;

        const id = Date.now();
        const notification = {
            id,
            amount,
            reason,
            isStreak: options.isStreak || false,
            streakBonus: options.streakBonus || 0
        };

        setNotifications(prev => [...prev, notification]);

        // Auto-remove after animation
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 4000);
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    return (
        <XPContext.Provider value={{ showXPNotification }}>
            {children}
            <AnimatePresence>
                {notifications.map((notification, index) => (
                    <motion.div
                        key={notification.id}
                        style={{ bottom: `${24 + index * 100}px` }}
                        className="fixed right-6 z-50"
                    >
                        <XPNotification
                            notification={notification}
                            onComplete={() => removeNotification(notification.id)}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </XPContext.Provider>
    );
};

export default XPContext;
