import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Trophy, Mail, Lock, Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
    const { login } = useAuth();
    const { settings } = useSettings();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            return toast.error('Please fill in all fields');
        }

        setLoading(true);
        try {
            const result = await login(email, password);
            if (result.success) {
                toast.success('Welcome back, Admin!');
                navigate('/admin');
            } else {
                toast.error(result.message);
            }
        } catch (err) {
            toast.error('An unexpected error occurred. Please try again.');
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
                        <h2 className="text-3xl font-black text-primary tracking-tight">Admin Portal</h2>
                        <p className="text-gray-400 font-medium">Please sign in to your account</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-primary uppercase tracking-[0.2em] ml-1">
                            Email Address
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-accent transition-colors">
                                <Mail size={18} />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@pro-tournament.com"
                                className="w-full pl-12 pr-4 py-4 bg-bg-light border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all font-medium text-primary placeholder:text-gray-300"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-xs font-black text-primary uppercase tracking-[0.2em]">
                                Password
                            </label>
                            <button
                                type="button"
                                onClick={() => setIsForgotModalOpen(true)}
                                className="text-[10px] font-black text-accent uppercase tracking-widest hover:text-accent-dark transition-colors"
                            >
                                Forgot?
                            </button>
                        </div>
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

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary-dark text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-primary/30 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:translate-y-0"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                Access Dashboard
                                <ArrowRight size={20} className="text-accent" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-12 pt-8 border-t border-gray-50 text-center">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">
                        Tournament OS © 2024
                    </p>
                </div>
            </div>

            <ForgotPasswordModal
                isOpen={isForgotModalOpen}
                onClose={() => setIsForgotModalOpen(false)}
            />
        </div>
    );
};

export default Login;