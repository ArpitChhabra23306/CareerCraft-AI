import { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
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

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

// Public Route (redirect to dashboard if already logged in, NOT home)
const PublicRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (user) return <Navigate to="/dashboard" />;
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="docs" element={<Documents />} />
        <Route path="docs/:id" element={<DocumentView />} />
        <Route path="flashcards" element={<Flashcards />} />
        <Route path="quiz" element={<Quiz />} />
        <Route path="interview" element={<Interview />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default App;
