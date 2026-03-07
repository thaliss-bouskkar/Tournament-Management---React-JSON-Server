import React, { useState } from 'react';
import { Mail, Loader2, X, CheckCircle, AlertCircle } from 'lucide-react';
import { API_URL } from '../services/api';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
    const [errorMessage, setErrorMessage] = useState('');

    if (!isOpen) return null;

    const validateEmail = (email) => {
        const re = /^[a-zA-Z0-0._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        return re.test(String(email).toLowerCase());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        if (!email.trim()) {
            setStatus('error');
            setErrorMessage('Please enter your email address.');
            return;
        }

        if (!validateEmail(email)) {
            setStatus('error');
            setErrorMessage('Please enter a valid email address.');
            return;
        }

        setStatus('loading');

        try {
            const response = await fetch(`${API_URL}/api/auth/forgotpassword`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            setStatus('success');

            // Helpful for localhost testing without a real SMTP configured
            if (data.debugUrl) {
                console.log("Password Reset Link (Local Testing): ", data.debugUrl);
            }
        } catch (error) {
            setStatus('error');
            setErrorMessage(error.message);
        }
    };

    const handleClose = () => {
        // Reset state when closing
        setTimeout(() => {
            setEmail('');
            setStatus('idle');
            setErrorMessage('');
        }, 300); // Wait for fade out animation if any
        onClose();
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease'
        }}>
            <div className="card" style={{
                width: '100%',
                maxWidth: '420px',
                position: 'relative',
                margin: '0 1rem',
                transform: 'translateY(0)',
                animation: 'slideUp 0.4s ease-out'
            }}>
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        transition: 'background-color 0.2s, color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                        e.currentTarget.style.color = 'var(--text-main)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-muted)';
                    }}
                    aria-label="Close modal"
                >
                    <X size={20} />
                </button>

                {status === 'success' ? (
                    <div style={{ textAlign: 'center', padding: '1rem 0', animation: 'fadeIn 0.5s ease' }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            backgroundColor: '#ecfdf5',
                            color: 'var(--primary)',
                            marginBottom: '1rem'
                        }}>
                            <CheckCircle size={32} />
                        </div>
                        <h2 style={{ color: 'var(--primary)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Check your email</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                            We've sent a password reset link to <br />
                            <strong style={{ color: 'var(--text-main)' }}>{email}</strong>
                        </p>
                        <button
                            onClick={handleClose}
                            className="btn-primary"
                            style={{ width: '100%' }}
                        >
                            Back to Login
                        </button>
                    </div>
                ) : (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem', marginTop: '0.5rem' }}>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '56px',
                                height: '56px',
                                borderRadius: '50%',
                                backgroundColor: '#f0fdf4',
                                color: 'var(--primary)',
                                marginBottom: '1rem'
                            }}>
                                <Mail size={28} />
                            </div>
                            <h2 style={{ color: 'var(--primary)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Reset Password</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                Enter your email address and we'll send you a link to securely reset your password.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-main)' }}>
                                    Email Address
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (status === 'error') setStatus('idle'); // clear error on type
                                        }}
                                        placeholder="admin@example.com"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                            borderRadius: 'var(--radius)',
                                            border: status === 'error' ? '1px solid #ef4444' : '1px solid #ddd',
                                            outlineColor: status === 'error' ? '#ef4444' : 'var(--primary)',
                                            transition: 'border-color 0.2s',
                                            fontSize: '0.95rem'
                                        }}
                                        autoFocus
                                    />
                                    <Mail
                                        size={18}
                                        color={status === 'error' ? '#ef4444' : '#9ca3af'}
                                        style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                                    />
                                </div>

                                {status === 'error' && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#ef4444', fontSize: '0.85rem', marginTop: '0.5rem', animation: 'fadeIn 0.3s ease' }}>
                                        <AlertCircle size={14} />
                                        <span>{errorMessage}</span>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={status === 'loading'}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    opacity: status === 'loading' ? 0.8 : 1
                                }}
                            >
                                {status === 'loading' ? (
                                    <>
                                        <Loader2 className="spinner" size={18} style={{ animation: 'spin 1s linear infinite' }} />
                                        Sending Link...
                                    </>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </button>
                        </form>
                    </>
                )}
            </div>

            {/* Inline keyframes for animation since it might not be in the global css */}
            <style>
                {`
@keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
}
@keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
}
`}
            </style>
        </div>
    );
};

export default ForgotPasswordModal;
