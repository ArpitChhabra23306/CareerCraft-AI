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
    Trophy,
    CreditCard,
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, path, active, collapsed }) => (
    <Link
        to={path}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group relative
            ${active
                ? 'bg-[#f5f5f5] dark:bg-[#151515] text-[#111] dark:text-[#eee]'
                : 'text-[#999] hover:text-[#111] dark:hover:text-[#eee] hover:bg-[#fafafa] dark:hover:bg-[#111]'
            } ${collapsed ? 'justify-center px-3' : ''}`}
        title={collapsed ? label : ''}
    >
        {active && (
            <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[#111] dark:bg-[#eee] rounded-r-full transition-all duration-300`} />
        )}
        <Icon size={18} strokeWidth={active ? 1.8 : 1.5} className={active ? '' : 'group-hover:scale-105 transition-transform duration-300'} />
        {!collapsed && <span className={`text-[13px] ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>}
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
        { icon: CreditCard, label: 'Pricing', path: '/pricing' },
        { icon: User, label: 'Profile', path: '/profile' },
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex transition-colors duration-500" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            {/* Sidebar (Desktop) */}
            <aside className={`bg-white dark:bg-[#0a0a0a] border-r border-[#f0f0f0] dark:border-[#1a1a1a] hidden md:flex flex-col transition-all duration-300 relative ${isCollapsed ? 'w-[72px]' : 'w-60'}`}>
                {/* Header */}
                <div className={`p-5 border-b border-[#f0f0f0] dark:border-[#1a1a1a] flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    <Link to="/dashboard" className={`flex items-center gap-2.5 ${isCollapsed ? 'hidden' : 'flex'}`}>
                        <div className="w-8 h-8 bg-[#111] dark:bg-[#eee] rounded-lg flex items-center justify-center">
                            <BrainCircuit className="text-white dark:text-[#111] h-4 w-4" strokeWidth={1.5} />
                        </div>
                        <span className="text-[14px] font-semibold text-[#111] dark:text-[#eee] tracking-[-0.02em]">CareerCraft</span>
                    </Link>
                    {isCollapsed && (
                        <div className="w-8 h-8 bg-[#111] dark:bg-[#eee] rounded-lg flex items-center justify-center">
                            <BrainCircuit className="text-white dark:text-[#111] h-4 w-4" strokeWidth={1.5} />
                        </div>
                    )}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`w-6 h-6 rounded-full border border-[#f0f0f0] dark:border-[#1a1a1a] flex items-center justify-center hover:border-[#ddd] dark:hover:border-[#333] text-[#999] transition-all duration-300 ${isCollapsed ? 'absolute -right-3 top-7 bg-white dark:bg-[#0a0a0a] shadow-sm z-50' : ''}`}
                    >
                        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-0.5">
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

                {/* Footer */}
                <div className="p-3 border-t border-[#f0f0f0] dark:border-[#1a1a1a] space-y-1">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-[#999] hover:text-[#111] dark:hover:text-[#eee] hover:bg-[#fafafa] dark:hover:bg-[#111] transition-all duration-300 ${isCollapsed ? 'justify-center' : ''}`}
                        title={isCollapsed ? (isDark ? "Light Mode" : "Dark Mode") : ""}
                    >
                        {isDark ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
                        {!isCollapsed && <span className="text-[13px] font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
                    </button>

                    {/* User Info */}
                    {!isCollapsed ? (
                        <Link to="/profile" className="flex items-center gap-3 px-2.5 py-2.5 hover:bg-[#fafafa] dark:hover:bg-[#111] rounded-xl transition-all duration-300">
                            <div className="w-8 h-8 rounded-full bg-[#111] dark:bg-[#eee] flex items-center justify-center text-white dark:text-[#111] text-[12px] font-semibold shrink-0 overflow-hidden">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    user?.username?.[0]?.toUpperCase() || 'U'
                                )}
                            </div>
                            <div className="overflow-hidden flex-1">
                                <p className="text-[13px] font-semibold text-[#111] dark:text-[#eee] truncate">{user?.username || 'User'}</p>
                                <p className="text-[11px] text-[#bbb] dark:text-[#666] truncate">{user?.email}</p>
                            </div>
                        </Link>
                    ) : (
                        <div className="flex justify-center">
                            <Link to="/profile" className="w-8 h-8 rounded-full bg-[#111] dark:bg-[#eee] flex items-center justify-center text-white dark:text-[#111] text-[12px] font-semibold cursor-pointer overflow-hidden" title={user?.username}>
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
                        className={`w-full flex items-center gap-3 p-2.5 text-[#999] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all duration-300 ${isCollapsed ? 'justify-center' : ''}`}
                        title={isCollapsed ? "Logout" : ""}
                    >
                        <LogOut size={18} strokeWidth={1.5} />
                        {!isCollapsed && <span className="text-[13px] font-medium">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[#f0f0f0] dark:border-[#1a1a1a] p-4 flex justify-between items-center z-20">
                    <Link to="/dashboard" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#111] dark:bg-[#eee] rounded-lg flex items-center justify-center">
                            <BrainCircuit className="text-white dark:text-[#111]" size={16} strokeWidth={1.5} />
                        </div>
                        <span className="text-[14px] font-semibold text-[#111] dark:text-[#eee] tracking-[-0.02em]">CareerCraft</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className="w-8 h-8 rounded-lg border border-[#f0f0f0] dark:border-[#1a1a1a] flex items-center justify-center text-[#999] hover:border-[#ddd] dark:hover:border-[#333] transition-colors"
                        >
                            {isDark ? <Sun size={14} strokeWidth={1.5} /> : <Moon size={14} strokeWidth={1.5} />}
                        </button>
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="w-8 h-8 rounded-lg border border-[#f0f0f0] dark:border-[#1a1a1a] flex items-center justify-center text-[#999] hover:border-[#ddd] dark:hover:border-[#333] transition-colors">
                            {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
                        </button>
                    </div>
                </header>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="md:hidden fixed inset-0 top-[65px] bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl z-40 p-6 flex flex-col">
                        <nav className="flex-1 space-y-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${location.pathname === item.path
                                        ? 'bg-[#f5f5f5] dark:bg-[#151515] text-[#111] dark:text-[#eee] font-semibold'
                                        : 'text-[#999] hover:text-[#111] dark:hover:text-[#eee] hover:bg-[#fafafa] dark:hover:bg-[#111]'
                                        }`}
                                >
                                    <item.icon size={20} strokeWidth={1.5} />
                                    <span className="text-[15px] font-medium">{item.label}</span>
                                </Link>
                            ))}
                        </nav>
                        <div className="border-t border-[#f0f0f0] dark:border-[#1a1a1a] pt-4 mt-4">
                            <button
                                onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                                className="w-full flex items-center gap-3 p-4 text-[#999] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all duration-300"
                            >
                                <LogOut size={20} strokeWidth={1.5} />
                                <span className="text-[15px] font-medium">Logout</span>
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
