import { useState, useContext } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
    LayoutDashboard,
    FileText,
    Layers,
    MessageSquare,
    LogOut,
    BrainCircuit,
    ChevronLeft,
    ChevronRight,
    Menu
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, path, active, collapsed }) => (
    <Link
        to={path}
        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${active
            ? 'bg-indigo-600 text-white shadow-md'
            : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
            } ${collapsed ? 'justify-center px-2' : ''}`}
        title={collapsed ? label : ''}
    >
        <Icon size={20} />
        {!collapsed && <span className="font-medium">{label}</span>}
    </Link>
);

const Layout = () => {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: FileText, label: 'Documents', path: '/docs' },
        { icon: Layers, label: 'Flashcards', path: '/flashcards' },
        { icon: BrainCircuit, label: 'Quiz', path: '/quiz' },
        { icon: MessageSquare, label: 'Interview Prep', path: '/interview' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar (Desktop) */}
            <aside className={`bg-white border-r border-gray-200 hidden md:flex flex-col transition-all duration-300 relative ${isCollapsed ? 'w-20' : 'w-64'}`}>
                <div className={`p-6 border-b border-gray-100 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    <h1 className={`text-2xl font-bold text-indigo-600 flex items-center gap-2 ${isCollapsed ? 'hidden' : 'flex'}`}>
                        <BrainCircuit className="text-indigo-600" />
                        AI Learn
                    </h1>
                    {isCollapsed && <BrainCircuit className="text-indigo-600" size={24} />}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors z-50 ${isCollapsed ? 'mb-4 absolute -right-3 top-8 bg-white border border-gray-200 shadow-md' : ''}`}
                    >
                        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={20} />}
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

                <div className="p-4 border-t border-gray-100">
                    {!isCollapsed ? (
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                                {user?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium text-gray-800 truncate">{user?.username || 'User'}</p>
                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center mb-4">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold cursor-help" title={user?.username}>
                                {user?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                        </div>
                    )}
                    <button
                        onClick={logout}
                        className={`w-full flex items-center space-x-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition ${isCollapsed ? 'justify-center' : ''}`}
                        title={isCollapsed ? "Logout" : ""}
                    >
                        <LogOut size={18} />
                        {!isCollapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center z-20">
                    <h1 className="text-xl font-bold text-indigo-600 flex gap-2 items-center">
                        <BrainCircuit /> AI Learn
                    </h1>
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600">
                        <Menu size={24} />
                    </button>
                </header>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-[60px] left-0 right-0 bg-white shadow-lg border-b border-gray-200 z-10 p-4 flex flex-col space-y-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === item.path
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-gray-600 hover:bg-indigo-50'
                                    }`}
                            >
                                <item.icon size={20} />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        ))}
                        <div className="border-t border-gray-100 pt-2 mt-2">
                            <button
                                onClick={logout}
                                className="w-full flex items-center space-x-3 p-3 text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                                <LogOut size={20} />
                                <span>Logout</span>
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
