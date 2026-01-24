import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { User, Mail, Moon, Sun, Save, Camera, Palette } from 'lucide-react';
import { motion } from 'framer-motion';

const Profile = () => {
    const { user, updateUserProfile, logout } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        bio: '',
        avatar: '',
        theme: 'light'
    });

    useEffect(() => {
        if (user) {
            setFormData({
                bio: user.bio || '',
                avatar: user.avatar || '',
                theme: user.theme || 'light'
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleTheme = async () => {
        const newTheme = formData.theme === 'light' ? 'dark' : 'light';
        setFormData({ ...formData, theme: newTheme });

        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        try {
            const res = await api.put('/user', { ...formData, theme: newTheme });
            updateUserProfile(res.data);
        } catch (err) {
            console.error("Failed to save theme preference", err);
            if (err.response && err.response.status === 404) {
                alert("Session invalid (User not found). Please log in again.");
                logout();
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg('');
        try {
            const res = await api.put('/user', formData);
            updateUserProfile(res.data);
            setMsg('Profile updated successfully!');
        } catch (err) {
            console.error(err);
            setMsg('Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8 animate-fade-in">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100 dark:border-gray-800"
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        <User className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                        Profile Settings
                    </h1>
                    <button
                        onClick={toggleTheme}
                        className="self-start md:self-auto p-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all shadow-sm"
                        title="Toggle Dark Mode"
                    >
                        {formData.theme === 'dark' ? (
                            <Sun className="h-6 w-6 text-yellow-500" />
                        ) : (
                            <Moon className="h-6 w-6 text-indigo-600" />
                        )}
                    </button>
                </div>

                {/* Theme Preview Cards */}
                <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Palette size={16} />
                        Appearance
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => formData.theme !== 'light' && toggleTheme()}
                            className={`p-4 rounded-xl border-2 transition-all ${formData.theme === 'light'
                                    ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                        >
                            <div className="bg-white border border-gray-200 rounded-lg p-3 mb-2 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                </div>
                                <div className="space-y-1">
                                    <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-2 bg-gray-100 rounded w-1/2"></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                <Sun size={16} />
                                Light
                            </div>
                        </button>
                        <button
                            onClick={() => formData.theme !== 'dark' && toggleTheme()}
                            className={`p-4 rounded-xl border-2 transition-all ${formData.theme === 'dark'
                                    ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                        >
                            <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 mb-2 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                </div>
                                <div className="space-y-1">
                                    <div className="h-2 bg-gray-700 rounded w-3/4"></div>
                                    <div className="h-2 bg-gray-800 rounded w-1/2"></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                <Moon size={16} />
                                Dark
                            </div>
                        </button>
                    </div>
                </div>

                {msg && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-xl mb-6 ${msg.includes('success')
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800'
                                : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-100 dark:border-red-800'
                            }`}
                    >
                        {msg}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center space-y-4 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <div className="h-28 w-28 rounded-full overflow-hidden bg-white dark:bg-gray-700 shadow-lg border-4 border-indigo-100 dark:border-indigo-900/50 relative group">
                                {formData.avatar ? (
                                    <img src={formData.avatar} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-indigo-50 dark:bg-gray-800 text-indigo-300 dark:text-gray-500">
                                        <User size={40} />
                                    </div>
                                )}
                            </div>
                            <div className="w-full">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Avatar URL</label>
                                <div className="relative">
                                    <Camera className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                                    <input
                                        type="text"
                                        name="avatar"
                                        value={formData.avatar}
                                        onChange={handleChange}
                                        placeholder="https://example.com/avatar.jpg"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                                    <input
                                        type="text"
                                        value={user?.username || ''}
                                        disabled
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                                    <input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            rows="4"
                            placeholder="Tell us a bit about yourself..."
                            className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                        ></textarea>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                            ) : (
                                <Save className="h-5 w-5" />
                            )}
                            Save Changes
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default Profile;
