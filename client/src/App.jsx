import { useContext } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import DocumentView from './pages/DocumentView';
import Flashcards from './pages/Flashcards';
import Quiz from './pages/Quiz';
import Interview from './pages/Interview';
import Profile from './pages/Profile';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import Pricing from './pages/Pricing';

/* Branded loading screen */
const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-[#0a0a0a] transition-colors" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
    <div className="w-10 h-10 bg-[#111] dark:bg-[#eee] rounded-xl flex items-center justify-center mb-4 animate-pulse">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white dark:text-[#111]">
        <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
        <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
        <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
        <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
        <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
        <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
        <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
        <path d="M6 18a4 4 0 0 1-1.967-.516" />
        <path d="M19.967 17.484A4 4 0 0 1 18 18" />
      </svg>
    </div>
    <p className="text-[13px] text-[#999] font-medium tracking-wide">Loading...</p>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  return children;
};

// Public Route (redirect to dashboard if already logged in, NOT home)
const PublicRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/dashboard" />;
  return children;
};

/* Page transition wrapper */
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

function App() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/login" element={<PublicRoute><PageTransition><Login /></PageTransition></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><PageTransition><Register /></PageTransition></PublicRoute>} />
        <Route path="/verify-email" element={<PageTransition><VerifyEmail /></PageTransition>} />
        <Route path="/forgot-password" element={<PublicRoute><PageTransition><ForgotPassword /></PageTransition></PublicRoute>} />
        <Route path="/reset-password/:token" element={<PublicRoute><PageTransition><ResetPassword /></PageTransition></PublicRoute>} />

        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
          <Route path="docs" element={<PageTransition><Documents /></PageTransition>} />
          <Route path="docs/:id" element={<PageTransition><DocumentView /></PageTransition>} />
          <Route path="flashcards" element={<PageTransition><Flashcards /></PageTransition>} />
          <Route path="quiz" element={<PageTransition><Quiz /></PageTransition>} />
          <Route path="interview" element={<PageTransition><Interview /></PageTransition>} />
          <Route path="leaderboard" element={<PageTransition><Leaderboard /></PageTransition>} />
          <Route path="pricing" element={<PageTransition><Pricing /></PageTransition>} />
          <Route path="profile" element={<PageTransition><Profile /></PageTransition>} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default App;
