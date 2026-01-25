import { useState, useContext, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import {
    LayoutDashboard,
    FileText,
    Layers,
    MessageSquare,
    LogOut,
    BrainCircuit,
    ChevronLeft,
    ChevronRight,
    Menu,
    User,
    Moon,
    Sun,
    X,
    Trophy
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, path, active, collapsed }) => (
    <Link
        to={path}
        className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
            : 'text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400'
            } ${collapsed ? 'justify-center px-3' : ''}`}
        title={collapsed ? label : ''}
    >
        <Icon size={20} className={`${active ? '' : 'group-hover:scale-110 transition-transform'}`} />
        {!collapsed && <span className="font-medium">{label}</span>}
    </Link>
);

const Layout = () => {
    const { user, logout, updateUserProfile } = useContext(AuthContext);
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        setIsDark(document.documentElement.classList.contains('dark'));
    }, []);

    const toggleTheme = async () => {
        const newTheme = isDark ? 'light' : 'dark';
        setIsDark(!isDark);

        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Save theme preference
        try {
            const res = await api.put('/user', { theme: newTheme });
            updateUserProfile(res.data);
        } catch (err) {
            console.error("Failed to save theme preference", err);
        }
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: FileText, label: 'Documents', path: '/docs' },
        { icon: Layers, label: 'Flashcards', path: '/flashcards' },
        { icon: BrainCircuit, label: 'Quiz', path: '/quiz' },
        { icon: MessageSquare, label: 'Interview Prep', path: '/interview' },
        { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
        { icon: User, label: 'Profile', path: '/profile' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
            {/* Sidebar (Desktop) */}
            <aside className={`bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 hidden md:flex flex-col transition-all duration-300 relative ${isCollapsed ? 'w-20' : 'w-64'}`}>
                <div className={`p-6 border-b border-gray-100 dark:border-gray-800 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    <Link to="/dashboard" className={`flex items-center gap-2 ${isCollapsed ? 'hidden' : 'flex'}`}>
                        <BrainCircuit className="text-indigo-600 dark:text-indigo-400" size={28} />
                        <span className="text-xl font-bold gradient-text">AI Learn</span>
                    </Link>
                    {isCollapsed && <BrainCircuit className="text-indigo-600 dark:text-indigo-400" size={28} />}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors z-50 ${isCollapsed ? 'absolute -right-3 top-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-md' : ''}`}
                    >
                        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={18} />}
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => (
                        <SidebarItem
                            key={item.path}
                            icon={item.icon}
                            label={item.label}
                            path={item.path}
                            active={location.pathname === item.path}
                            collapsed={isCollapsed}
                        />
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className={`w-full flex items-center space-x-3 p-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
                        title={isCollapsed ? (isDark ? "Light Mode" : "Dark Mode") : ""}
                    >
                        {isDark ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} />}
                        {!isCollapsed && <span className="font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
                    </button>

                    {/* User Info */}
                    {!isCollapsed ? (
                        <Link to="/profile" className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0 overflow-hidden">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    user?.username?.[0]?.toUpperCase() || 'U'
                                )}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{user?.username || 'User'}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                            </div>
                        </Link>
                    ) : (
                        <div className="flex justify-center">
                            <Link to="/profile" className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold cursor-pointer overflow-hidden" title={user?.username}>
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    user?.username?.[0]?.toUpperCase() || 'U'
                                )}
                            </Link>
                        </div>
                    )}

                    <button
                        onClick={logout}
                        className={`w-full flex items-center space-x-3 p-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition ${isCollapsed ? 'justify-center' : ''}`}
                        title={isCollapsed ? "Logout" : ""}
                    >
                        <LogOut size={20} />
                        {!isCollapsed && <span className="font-medium">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 flex justify-between items-center z-20">
                    <Link to="/dashboard" className="flex items-center gap-2">
                        <BrainCircuit className="text-indigo-600 dark:text-indigo-400" size={28} />
                        <span className="text-xl font-bold gradient-text">AI Learn</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                        >
                            {isDark ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} />}
                        </button>
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </header>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="md:hidden fixed inset-0 top-[72px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-40 p-6 flex flex-col animate-fade-in">
                        <nav className="flex-1 space-y-2">
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center space-x-3 px-4 py-4 rounded-xl transition-colors ${location.pathname === item.path
                                        ? 'bg-indigo-600 text-white shadow-lg'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <item.icon size={22} />
                                    <span className="font-medium text-lg">{item.label}</span>
                                </Link>
                            ))}
                        </nav>
                        <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-4">
                            <button
                                onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                                className="w-full flex items-center space-x-3 p-4 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
                            >
                                <LogOut size={22} />
                                <span className="font-medium text-lg">Logout</span>
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-auto p-4 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
