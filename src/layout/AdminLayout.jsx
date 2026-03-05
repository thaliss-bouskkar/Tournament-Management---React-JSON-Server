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
    ChevronRight,
    BarChart,
    Shield
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

const SidebarItem = ({ to, icon: Icon, label, collapsed }) => (
    <NavLink
        to={to}
        style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius)',
            backgroundColor: isActive ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
            color: isActive ? 'var(--accent)' : 'var(--white)',
            transition: 'var(--transition)',
            marginBottom: '0.5rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden'
        })}
    >
        {Icon && <Icon size={20} />}
        {!collapsed && <span>{label}</span>}
    </NavLink>
);

const AdminLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const { settings } = useSettings();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // ✅ Handle logout
    const handleLogout = () => {
        logout();                 // clear auth (json/localStorage)
        setShowLogoutConfirm(false);
        navigate('/login');       // redirect
    };

    return (
        <>
            <div style={{ display: 'flex', minHeight: '100vh' }}>
                {/* Sidebar */}
                <aside style={{
                    width: collapsed ? '80px' : '260px',
                    backgroundColor: 'var(--primary)',
                    color: 'var(--white)',
                    transition: 'width 0.3s ease',
                    padding: '1.5rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '4px 0 10px rgba(0,0,0,0.1)',
                    position: 'sticky',
                    top: 0,
                    height: '100vh'
                }}>
                    <div style={{ display: 'flex', justifyContent: collapsed ? 'center' : 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        {!collapsed && (
                            <Link to="/admin" style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <img
                                    src={settings?.logoUrl}
                                    alt="Logo"
                                    style={{ height: '42px', width: '42px', objectFit: 'contain', borderRadius: '4px' }}
                                />
                                <span>DASHBOARD</span>
                            </Link>
                        )}
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            style={{ color: 'var(--white)', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            {collapsed ? <ChevronRight size={24} /> : <X size={24} />}
                        </button>
                    </div>

                    <nav style={{ flex: 1 }}>
                        <SidebarItem to="/admin" icon={LayoutDashboard} label="Overview" collapsed={collapsed} />
                        <SidebarItem to="/admin/groups" icon={Trophy} label="Groups" collapsed={collapsed} />
                        <SidebarItem to="/admin/teams" icon={Users} label="Teams & Players" collapsed={collapsed} />
                        <SidebarItem to="/admin/matches" icon={Calendar} label="Matches" collapsed={collapsed} />
                        <SidebarItem to="/admin/statistics" icon={BarChart} label="Statistics" collapsed={collapsed} />
                        <SidebarItem to="/admin/admins" icon={Shield} label="Admins" collapsed={collapsed} />
                    </nav>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', marginTop: '1rem' }}>
                        <SidebarItem to="/admin/profile" icon={Settings} label="Profile" collapsed={collapsed} />

                        <button
                            onClick={() => setShowLogoutConfirm(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '0.75rem 1rem',
                                width: '100%',
                                color: 'var(--white)',
                                borderRadius: 'var(--radius)',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <LogOut size={20} />
                            {!collapsed && <span>Logout</span>}
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main style={{ flex: 1, backgroundColor: 'var(--bg-light)', padding: '2rem' }}>
                    <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h1 style={{ color: 'var(--primary)', fontSize: '1.8rem', fontWeight: '700' }}>Admin Panel</h1>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>
                                Welcome, {user?.name || 'Admin'}
                            </span>

                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--accent)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                fontWeight: 'bold',
                                color: 'var(--primary)',
                                overflow: 'hidden'
                            }}>
                                {user?.image ? (
                                    <img
                                        src={user.image}
                                        alt={user.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    user?.name?.[0]?.toUpperCase() || 'A'
                                )}
                            </div>
                        </div>
                    </header>

                    <Outlet />
                </main>
            </div>

            {/* ✅ Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 999
                }}>
                    <div style={{
                        background: '#1c1c1c',
                        padding: '2rem',
                        borderRadius: '16px',
                        width: '320px',
                        textAlign: 'center',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                    }}>
                        <LogOut size={40} color="#EF4444" style={{ marginBottom: '1rem' }} />

                        <h3 style={{ marginBottom: '0.5rem',color: '#717070' }}>Confirm Logout</h3>
                        <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Are you sure you want to logout?
                        </p>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                style={{
                                    flex: 1,
                                    padding: '0.6rem',
                                    borderRadius: '8px',
                                    border: '1px solid #333',
                                    background: 'transparent',
                                    color: '#fff',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleLogout}
                                style={{
                                    flex: 1,
                                    padding: '0.6rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: '#EF4444',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminLayout;