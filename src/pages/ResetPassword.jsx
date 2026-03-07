import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { Trophy, Lock, Loader2, Eye, EyeOff, Save, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_URL } from '../services/api';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { settings } = useSettings();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!password || !confirmPassword) {
            return toast.error('Please fill in all fields');
        }

        if (password !== confirmPassword) {
            return toast.error('Passwords do not match');
        }

        if (password.length < 6) {
            return toast.error('Password must be at least 6 characters');
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/resetpassword/${token}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to reset password');
            }

            toast.success('Security update successful! Password reset.');
            navigate('/login');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[70vh] px-4">
            <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 border border-gray-100 animate-in fade-in zoom-in duration-500">
                <div className="text-center space-y-4 mb-10">
                    <div className="mx-auto w-20 h-20 bg-accent/10 rounded-3xl flex items-center justify-center p-3 shadow-inner">
                        {settings?.logoUrl ? (
                            <img
                                src={settings.logoUrl}
                                alt="Tournament Logo"
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <Trophy size={40} className="text-accent" />
                        )}
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-primary tracking-tight">Security Update</h2>
                        <p className="text-gray-400 font-medium">Set your new administrator password</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-primary uppercase tracking-[0.2em] ml-1">
                            New Password
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-accent transition-colors">
                                <Lock size={18} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-12 pr-12 py-4 bg-bg-light border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all font-medium text-primary placeholder:text-gray-300"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-primary transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-primary uppercase tracking-[0.2em] ml-1">
                            Confirm New Password
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-accent transition-colors">
                                <Lock size={18} />
                            </div>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-12 pr-12 py-4 bg-bg-light border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all font-medium text-primary placeholder:text-gray-300"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-primary transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary-dark text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-primary/30 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:translate-y-0"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    Save New Password
                                    <Save size={20} className="text-accent" />
                                </>
                            )}
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="w-full flex items-center justify-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors py-2"
                    >
                        <ArrowLeft size={14} />
                        Back to Login
                    </button>
                </form>

                <div className="mt-10 pt-8 border-t border-gray-50 text-center">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">
                        Tournament OS Security
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
