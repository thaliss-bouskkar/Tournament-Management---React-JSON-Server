import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // ===== Load user from localStorage on mount =====
    useEffect(() => {
        const loadUser = () => {
            const savedUser = localStorage.getItem('tournament_admin');
            if (savedUser) {
                setUser(JSON.parse(savedUser));
            }
            setLoading(false);
        };
        queueMicrotask(loadUser);
    }, []);

    // ===== Login =====
    const login = async (email, password) => {
        try {
            const { data: admins } = await api.get(`/admins?email=${email}&password=${password}`);
            if (admins.length > 0) {
                const admin = admins[0];
                setUser(admin);
                localStorage.setItem('tournament_admin', JSON.stringify(admin));
                return { success: true };
            }
            return { success: false, message: 'Invalid email or password' };
        } catch {
            return { success: false, message: 'Server error. Please try again.' };
        }
    };

    // ===== Logout =====
    const logout = () => {
        setUser(null);
        localStorage.removeItem('tournament_admin');
    };

    // ===== Update Profile / Delete Self =====
    const updateProfile = async (data) => {
        // ===== Delete account =====
        if (data.deleteSelf) {
            try {
                // Option 1: Delete from API
                await api.delete(`/admins/${user.id}`);
            } catch {
                // Optionally ignore if using mock/localStorage
            }
            setUser(null);
            localStorage.removeItem('tournament_admin');
            return { success: true };
        }

        // ===== Update profile =====
        try {
            let updatedUser = { ...user, ...data };

            // Option 1: Update via API
            try {
                const { data: apiUser } = await api.put(`/admins/${user.id}`, updatedUser);
                updatedUser = apiUser;
            } catch {
                // fallback: mock update only in localStorage
            }

            setUser(updatedUser);
            localStorage.setItem('tournament_admin', JSON.stringify(updatedUser));
            return { success: true };
        } catch {
            return { success: false, message: 'Failed to update profile' };
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateProfile, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);