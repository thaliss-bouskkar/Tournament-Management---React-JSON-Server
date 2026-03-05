import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';

const NotFound = () => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '70vh',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                padding: '2rem',
                borderRadius: '50%',
                marginBottom: '1.5rem'
            }}>
                <ShieldAlert size={64} color="#EF4444" />
            </div>

            <h1 style={{ color: 'var(--primary)', fontSize: '3rem', marginBottom: '0.5rem' }}>404</h1>
            <h2 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Page Not Found</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '400px', marginBottom: '2rem' }}>
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>

            <Link to="/" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Home size={18} /> Back to Homepage
            </Link>
        </div>
    );
};

export default NotFound;
