import React, { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { Trophy, Menu, X, Shield, Star, Info } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const Navbar = () => {
    const { settings } = useSettings();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const navLinks = [
        { to: "/", label: "Home", icon: <Star size={18} /> },
        { to: "/stats", label: "Stats", icon: <Trophy size={18} /> },
        { to: "/calendar", label: "Schedule", icon: <Shield size={18} /> },
    ];

    return (
        <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${scrolled ? 'bg-primary/95 backdrop-blur-md py-3 shadow-2xl' : 'bg-primary py-5'}`}>
            <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-primary shadow-lg shadow-accent/20 group-hover:rotate-12 transition-transform duration-300">
                        {settings.logoUrl ? (
                            <img src={settings.logoUrl} alt="" className="w-7 h-7 object-contain" />
                        ) : (
                            <Trophy size={24} />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-xl tracking-tighter text-white leading-none">THALISS</span>
                        <span className="text-[10px] font-black text-accent tracking-[0.3em] uppercase leading-none mt-1">Tournament</span>
                    </div>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-2">
                    {navLinks.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) =>
                                `px-5 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${isActive
                                    ? 'bg-accent text-primary shadow-lg shadow-accent/20'
                                    : 'text-white/70 hover:text-white hover:bg-white/5'
                                }`
                            }
                        >
                            {link.label}
                        </NavLink>
                    ))}
                    <div className="w-px h-6 bg-white/10 mx-4"></div>
                    <NavLink
                        to="/login"
                        className={`p-2 rounded-xl transition-all duration-300 ${location.pathname === '/login' ? 'bg-accent text-primary' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                    >
                        <Shield size={20} />
                    </NavLink>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 text-white active:scale-90 transition-transform"
                    onClick={toggleMenu}
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <div className={`md:hidden absolute top-full left-0 right-0 bg-primary/98 backdrop-blur-xl border-t border-white/5 py-8 px-6 space-y-4 transition-all duration-500 origin-top ${isMenuOpen ? 'scale-y-100 opacity-100 visible' : 'scale-y-0 opacity-0 invisible'}`}>
                {navLinks.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        onClick={() => setIsMenuOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-4 px-6 py-4 rounded-2xl text-lg font-black uppercase tracking-widest transition-all ${isActive ? 'bg-accent text-primary' : 'text-white bg-white/5'
                            }`
                        }
                    >
                        <span className={isActive ? 'text-primary' : 'text-accent'}>{link.icon}</span>
                        {link.label}
                    </NavLink>
                ))}
                <NavLink
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-4 px-6 py-4 rounded-2xl text-lg font-black uppercase tracking-widest text-white bg-white/5"
                >
                    <Shield size={20} className="text-accent" />
                    Admin Access
                </NavLink>
            </div>
        </nav>
    );
};

const PublicLayout = () => {
    return (
        <div className="min-h-screen flex flex-col bg-bg-light font-sans selection:bg-accent selection:text-primary">
            <Navbar />
            <main className="flex-1 pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-6">
                    <Outlet />
                </div>
            </main>
            <footer className="bg-primary pt-20 pb-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pb-16 border-b border-white/5">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 font-black text-2xl text-white tracking-tighter">
                                <Trophy size={32} className="text-accent" />
                                THALISS
                            </div>
                            <p className="text-gray-400 font-medium max-w-xs leading-relaxed">
                                The ultimate platform for tournament management and live statistics tracking. Experience sports like never before.
                            </p>
                        </div>
                        <div className="space-y-6">
                            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-accent">Quick Links</h4>
                            <div className="flex flex-col gap-4 text-gray-400 font-medium tracking-wide">
                                <Link to="/" className="hover:text-white transition-colors">Home Highlights</Link>
                                <Link to="/stats" className="hover:text-white transition-colors">Player Standings</Link>
                                <Link to="/calendar" className="hover:text-white transition-colors">Match Schedule</Link>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-accent">Newsletter</h4>
                            <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5 focus-within:border-accent transition-colors">
                                <input
                                    type="email"
                                    placeholder="Enter email..."
                                    className="bg-transparent border-none outline-none px-4 py-2 flex-1 text-white placeholder:text-gray-500"
                                />
                                <button className="bg-accent text-primary px-6 py-2 rounded-xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform">
                                    Join
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-500">
                            &copy; 2026 THALISS TOURNAMENT OS • PRO EDITION
                        </p>
                        <div className="flex items-center gap-6">
                            <Link to="/login" className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-accent transition-colors">Admin Dashboard</Link>
                            <span className="text-gray-800">|</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Systems Operational</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PublicLayout;
