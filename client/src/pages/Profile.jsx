import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { User, Mail, Moon, Sun, Save, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

const Profile = () => {
    const { user, updateUserProfile, logout } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

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
        <div className="max-w-4xl mx-auto space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[20px] bg-[#fafafa] dark:bg-[#111] border border-[#f0f0f0] dark:border-[#1a1a1a] p-6 md:p-8"
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <h1 className="text-2xl font-bold text-[#111] dark:text-[#eee] tracking-[-0.03em]">
                        Profile Settings
                    </h1>
                    <button
                        onClick={toggleTheme}
                        className="self-start md:self-auto w-10 h-10 rounded-xl bg-[#f0f0f0] dark:bg-[#1a1a1a] border border-[#e8e8e8] dark:border-[#222] hover:bg-[#e8e8e8] dark:hover:bg-[#222] transition-all duration-300 flex items-center justify-center"
                        title="Toggle Dark Mode"
                    >
                        {formData.theme === 'dark' ? (
                            <Sun size={16} className="text-[#888]" strokeWidth={1.5} />
                        ) : (
                            <Moon size={16} className="text-[#888]" strokeWidth={1.5} />
                        )}
                    </button>
                </div>

                {/* Theme Picker */}
                <div className="mb-8">
                    <label className="block text-[12px] font-medium text-[#999] mb-3 uppercase tracking-wider">
                        Appearance
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => formData.theme !== 'light' && toggleTheme()}
                            className={`p-4 rounded-[14px] border-2 transition-all duration-300 ${formData.theme === 'light'
                                ? 'border-[#111] dark:border-[#eee]'
                                : 'border-[#f0f0f0] dark:border-[#1a1a1a] hover:border-[#e8e8e8] dark:hover:border-[#222]'
                                }`}
                        >
                            <div className="bg-white border border-[#f0f0f0] rounded-xl p-3 mb-2">
                                <div className="space-y-1.5">
                                    <div className="h-1.5 bg-[#f0f0f0] rounded w-3/4"></div>
                                    <div className="h-1.5 bg-[#f5f5f5] rounded w-1/2"></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-center gap-2 text-[12px] font-medium text-[#111] dark:text-[#eee]">
                                <Sun size={14} strokeWidth={1.5} />
                                Light
                            </div>
                        </button>
                        <button
                            onClick={() => formData.theme !== 'dark' && toggleTheme()}
                            className={`p-4 rounded-[14px] border-2 transition-all duration-300 ${formData.theme === 'dark'
                                ? 'border-[#111] dark:border-[#eee]'
                                : 'border-[#f0f0f0] dark:border-[#1a1a1a] hover:border-[#e8e8e8] dark:hover:border-[#222]'
                                }`}
                        >
                            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-3 mb-2">
                                <div className="space-y-1.5">
                                    <div className="h-1.5 bg-[#1a1a1a] rounded w-3/4"></div>
                                    <div className="h-1.5 bg-[#111] rounded w-1/2"></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-center gap-2 text-[12px] font-medium text-[#111] dark:text-[#eee]">
                                <Moon size={14} strokeWidth={1.5} />
                                Dark
                            </div>
                        </button>
                    </div>
                </div>

                {msg && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-[14px] mb-6 text-[13px] font-medium ${msg.includes('success')
                            ? 'bg-[#f0f0f0] dark:bg-[#1a1a1a] text-[#111] dark:text-[#eee] border border-[#e8e8e8] dark:border-[#222]'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800'
                            }`}
                    >
                        {msg}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center space-y-4 p-6 bg-white dark:bg-[#0a0a0a] rounded-[16px] border border-[#f0f0f0] dark:border-[#1a1a1a]">
                            <div className="h-24 w-24 rounded-2xl overflow-hidden bg-[#f0f0f0] dark:bg-[#1a1a1a] border-2 border-[#e8e8e8] dark:border-[#222] relative">
                                {formData.avatar ? (
                                    <img src={formData.avatar} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-[#bbb] dark:text-[#555]">
                                        <User size={36} strokeWidth={1.5} />
                                    </div>
                                )}
                            </div>
                            <div className="w-full">
                                <label className="block text-[11px] font-medium text-[#999] mb-2 uppercase tracking-wider">Avatar URL</label>
                                <div className="relative">
                                    <Camera className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb] dark:text-[#555]" size={14} strokeWidth={1.5} />
                                    <input
                                        type="text"
                                        name="avatar"
                                        value={formData.avatar}
                                        onChange={handleChange}
                                        placeholder="https://example.com/avatar.jpg"
                                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-[#f0f0f0] dark:border-[#1a1a1a] bg-[#fafafa] dark:bg-[#111] text-[#111] dark:text-[#eee] text-[13px] focus:border-[#111] dark:focus:border-[#eee] outline-none transition-colors duration-300 placeholder-[#bbb] dark:placeholder-[#555]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="space-y-5">
                            <div>
                                <label className="block text-[11px] font-medium text-[#999] mb-2 uppercase tracking-wider">Username</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb] dark:text-[#555]" size={14} strokeWidth={1.5} />
                                    <input
                                        type="text"
                                        value={user?.username || ''}
                                        disabled
                                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-[#f0f0f0] dark:border-[#1a1a1a] bg-[#f5f5f5] dark:bg-[#0a0a0a] text-[#999] text-[13px] cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-[#999] mb-2 uppercase tracking-wider">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb] dark:text-[#555]" size={14} strokeWidth={1.5} />
                                    <input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-[#f0f0f0] dark:border-[#1a1a1a] bg-[#f5f5f5] dark:bg-[#0a0a0a] text-[#999] text-[13px] cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="block text-[11px] font-medium text-[#999] mb-2 uppercase tracking-wider">Bio</label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            rows="4"
                            placeholder="Tell us a bit about yourself..."
                            className="w-full p-4 rounded-xl border border-[#f0f0f0] dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] text-[#111] dark:text-[#eee] text-[13px] focus:border-[#111] dark:focus:border-[#eee] outline-none transition-colors duration-300 resize-none placeholder-[#bbb] dark:placeholder-[#555]"
                        ></textarea>
                    </div>

                    <div className="flex justify-end pt-2">
                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-[#111] dark:bg-[#eee] text-white dark:text-[#111] px-8 py-3 rounded-xl text-[13px] font-semibold flex items-center gap-2 disabled:opacity-40 transition-all duration-300"
                        >
                            {loading ? (
                                <span className="animate-spin h-4 w-4 border-2 border-white dark:border-[#111] border-t-transparent rounded-full"></span>
                            ) : (
                                <Save size={16} strokeWidth={1.5} />
                            )}
                            Save Changes
                        </motion.button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default Profile;
