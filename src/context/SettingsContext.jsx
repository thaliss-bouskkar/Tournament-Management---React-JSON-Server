import React, { createContext, useState, useContext, useEffect } from 'react';
import { settingService } from '../services/api';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        logoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Tournament&backgroundColor=064e3b'
    });
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            const { data } = await settingService.get();
            setSettings(data);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const updateLogo = async (newLogoUrl) => {
        try {
            await settingService.update({ logoUrl: newLogoUrl });
            setSettings(prev => ({ ...prev, logoUrl: newLogoUrl }));
            return true;
        } catch (error) {
            console.error('Failed to update logo:', error);
            return false;
        }
    };

    return (
        <SettingsContext.Provider value={{ settings, loading, updateLogo, refreshSettings: fetchSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
