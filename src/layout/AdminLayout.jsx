import React, { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Trophy,
    Calendar,
    Settings,
    LogOut,
    X,
    Menu,
    ChevronRight,
    BarChart,
    Shield
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

const SidebarItem = ({ to, icon: Icon, label, collapsed, onClick }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
            `flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 mb-2 truncate ${isActive
                ? 'bg-accent/10 text-accent font-semibold'
                : 'text-white hover:bg-white/5 hover:text-accent-light'
            }`
        }
    >
        {Icon && <Icon size={20} className="shrink-0" />}
        {(!collapsed || typeof onClick === 'function') && <span className="text-sm font-medium">{label}</span>}
    </NavLink>
);

const AdminLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const { settings } = useSettings();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        setShowLogoutConfirm(false);
        navigate('/login');
    };

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    const menuItems = [
        { to: "/admin", icon: LayoutDashboard, label: "Overview" },
        { to: "/admin/groups", icon: Trophy, label: "Groups" },
        { to: "/admin/teams", icon: Users, label: "Teams & Players" },
        { to: "/admin/matches", icon: Calendar, label: "Matches" },
        { to: "/admin/statistics", icon: BarChart, label: "Statistics" },
        { to: "/admin/admins", icon: Shield, label: "Admins" },
    ];

    return (
        <div className="flex min-h-screen bg-bg-light font-sans">
            {/* Sidebar - Desktop */}
            <aside className={`hidden md:flex flex-col bg-primary text-white transition-all duration-300 shadow-xl sticky top-0 h-screen ${collapsed ? 'w-20' : 'w-64'}`}>
                <div className={`flex items-center p-6 h-20 ${collapsed ? 'justify-center' : 'justify-between'}`}>
                    {!collapsed && (
                        <Link to="/admin" className="text-accent font-bold text-lg flex items-center gap-3 truncate">
                            {settings?.logoUrl && (
                                <img src={settings.logoUrl} alt="Logo" className="h-10 w-10 object-contain rounded" />
                            )}
                            <span>DASHBOARD</span>
                        </Link>
                    )}
                    <button onClick={() => setCollapsed(!collapsed)} className="text-white hover:text-accent transition-colors">
                        {collapsed ? <ChevronRight size={24} /> : <X size={24} />}
                    </button>
                </div>

                <nav className="flex-1 px-4 mt-4 overflow-y-auto custom-scrollbar">
                    {menuItems.map((item) => (
                        <SidebarItem key={item.to} {...item} collapsed={collapsed} />
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10 space-y-2">
                    <SidebarItem to="/admin/profile" icon={Settings} label="Profile" collapsed={collapsed} />
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className={`flex items-center gap-4 px-4 py-3 rounded-lg text-white hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 w-full mb-2 ${collapsed ? 'justify-center' : ''}`}
                    >
                        <LogOut size={20} className="shrink-0" />
                        {!collapsed && <span className="text-sm font-medium">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Mobile Sidebar / Drawer */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[150] md:hidden">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={closeMobileMenu}></div>
                    <aside className="fixed inset-y-0 left-0 w-72 bg-primary text-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
                        <div className="flex items-center justify-between p-6 h-20 border-b border-white/10">
                            <Link to="/admin" onClick={closeMobileMenu} className="text-accent font-bold text-lg flex items-center gap-3">
                                {settings?.logoUrl && <img src={settings.logoUrl} alt="Logo" className="h-10 w-10 object-contain" />}
                                <span>DASHBOARD</span>
                            </Link>
                            <button onClick={closeMobileMenu} className="text-white"><X size={24} /></button>
                        </div>
                        <nav className="flex-1 p-4 mt-2 overflow-y-auto">
                            {menuItems.map((item) => (
                                <SidebarItem key={item.to} {...item} onClick={closeMobileMenu} />
                            ))}
                        </nav>
                        <div className="p-4 border-t border-white/10 space-y-2">
                            <SidebarItem to="/admin/profile" icon={Settings} label="Profile" onClick={closeMobileMenu} />
                            <button
                                onClick={() => setShowLogoutConfirm(true)}
                                className="flex items-center gap-4 px-4 py-3 rounded-lg text-white hover:bg-red-500/10 hover:text-red-400 transition-all w-full"
                            >
                                <LogOut size={20} />
                                <span className="font-medium">Logout</span>
                            </button>
                        </div>
                    </aside>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-20 bg-white border-b border-gray-100 px-4 md:px-8 flex items-center justify-between sticky top-0 z-50 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button onClick={toggleMobileMenu} className="md:hidden p-2 text-primary hover:bg-gray-100 rounded-lg transition-colors">
                            <Menu size={24} />
                        </button>
                        <h1 className="text-lg md:text-2xl font-bold text-primary truncate">Admin Panel</h1>
                    </div>

                    <div className="flex items-center gap-3 md:gap-4 ml-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-gray-900">{user?.name || 'Admin'}</p>
                            <p className="text-xs text-gray-500">Administrator</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-accent border-2 border-accent-light flex items-center justify-center text-primary font-bold overflow-hidden shadow-sm">
                            {user?.image ? (
                                <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                user?.name?.[0]?.toUpperCase() || 'A'
                            )}
                        </div>
                    </div>
                </header>

                <main className="p-4 md:p-8 flex-1 overflow-x-hidden">
                    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Logout Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)}></div>
                    <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                            <LogOut size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Logout</h3>
                        <p className="text-gray-500 mb-8 text-sm">Are you sure you want to exit the dashboard safely?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Keep Browsing
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                            >
                                Log Me Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLayout;