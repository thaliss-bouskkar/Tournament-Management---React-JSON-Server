import React from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const Navbar = () => {
    const { settings } = useSettings();
    return (
        <nav style={{ backgroundColor: 'var(--primary)', color: 'var(--white)', padding: '1rem 0', position: 'sticky', top: 0, zIndex: 100, boxShadow: 'var(--shadow)' }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.5rem', color: 'var(--accent)' }}>
                    <img
                        src={settings.logoUrl}
                        alt="Logo"
                        style={{ height: '40px', width: '40px', objectFit: 'contain', borderRadius: '4px' }}
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                        }}
                    />
                    <Trophy size={32} style={{ display: 'none' }} />
                    <span>TOURNAMENT</span>
                </Link>
                <div style={{ display: 'flex', gap: '2rem' }}>
                    <NavLink to="/" style={({ isActive }) => ({ color: isActive ? 'var(--accent)' : 'var(--white)', fontWeight: isActive ? '700' : '400', transition: 'var(--transition)' })}>Home</NavLink>
                    <NavLink to="/stats" style={({ isActive }) => ({ color: isActive ? 'var(--accent)' : 'var(--white)', fontWeight: isActive ? '700' : '400', transition: 'var(--transition)' })}>Statistics</NavLink>
                    <NavLink to="/calendar" style={({ isActive }) => ({ color: isActive ? 'var(--accent)' : 'var(--white)', fontWeight: isActive ? '700' : '400', transition: 'var(--transition)' })}>Calendar</NavLink>
                    <NavLink to="/login" style={{ backgroundColor: 'var(--accent)', color: 'var(--primary)', padding: '0.3rem 1rem', borderRadius: 'var(--radius)', fontWeight: 'bold' }}>Admin</NavLink>
                </div>
            </div>
        </nav>
    );
};

const PublicLayout = () => {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <main style={{ flex: 1, padding: '2rem 0' }}>
                <div className="container">
                    <Outlet />
                </div>
            </main>
            <footer style={{ backgroundColor: 'var(--primary)', color: 'var(--white)', padding: '2rem 0', marginTop: 'auto' }}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <p>&copy; 2026 Tournament Management System. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default PublicLayout;
