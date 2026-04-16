import React, { createContext, useContext, useEffect, useState } from 'react';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    // '12h' or '24h'
    const [timeFormat, setTimeFormat] = useState(() => {
        return localStorage.getItem('timeFormat') || '12h';
    });

    useEffect(() => {
        localStorage.setItem('timeFormat', timeFormat);
    }, [timeFormat]);

    const toggleTimeFormat = () => {
        setTimeFormat((prev) => (prev === '12h' ? '24h' : '12h'));
    };

    return (
        <SettingsContext.Provider value={{ timeFormat, toggleTimeFormat, setTimeFormat }}>
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
