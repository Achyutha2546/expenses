import React, { createContext, useContext, useState, useEffect } from 'react';

const SecurityContext = createContext();

export const useSecurity = () => useContext(SecurityContext);

export const SecurityProvider = ({ children }) => {
    const [pin, setPin] = useState(localStorage.getItem('app_pin') || null);
    const [isLocked, setIsLocked] = useState(!!pin);
    const [privacyMode, setPrivacyMode] = useState(localStorage.getItem('privacy_mode') === 'true');

    useEffect(() => {
        if (privacyMode) {
            document.body.classList.add('privacy-mode');
            localStorage.setItem('privacy_mode', 'true');
        } else {
            document.body.classList.remove('privacy-mode');
            localStorage.setItem('privacy_mode', 'false');
        }
    }, [privacyMode]);

    useEffect(() => {
        // Obscure app when in background to prevent screenshot snooping
        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (pin) {
                    setIsLocked(true);
                }
            }
        };

        // Block print screen key (optional countermeasure)
        const handleKeyDown = (e) => {
            if (e.key === 'PrintScreen') {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(''); // Attempt to clear clipboard
                }
                if (pin) setIsLocked(true);
            }
        };

        const handleContextMenu = (e) => {
            // Optional: Disable long-press context menu on mobile to prevent easy copying of data
            // Only if necessary, but helpful for anti-screenshot tools
            // e.preventDefault(); 
        };

        // Attempting to block shortcuts that lead to screenshot/recording
        const blockShortcuts = (e) => {
            // Command+Shift+5/3/4 on Mac, Win+Shift+S etc. We can't actually catch all OS shortcuts,
            // because OS intercepts them before browser, but we can try to obscure on blur
        };

        window.addEventListener('blur', () => {
            // If window loses focus (like when snip tool opens), lock it
            if (pin) setIsLocked(true);
        });

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('keyup', handleKeyDown);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('keyup', handleKeyDown);
            window.removeEventListener('blur', () => { });
        };
    }, [pin]);

    const savePin = (newPin) => {
        localStorage.setItem('app_pin', newPin);
        setPin(newPin);
        setIsLocked(false);
    };

    const removePin = () => {
        localStorage.removeItem('app_pin');
        setPin(null);
        setIsLocked(false);
    };

    const verifyPin = (inputPin) => {
        if (inputPin === pin) {
            setIsLocked(false);
            return true;
        }
        return false;
    };

    const togglePrivacyMode = () => {
        setPrivacyMode(!privacyMode);
    };

    return (
        <SecurityContext.Provider value={{ pin, isLocked, privacyMode, savePin, removePin, verifyPin, togglePrivacyMode }}>
            {children}
        </SecurityContext.Provider>
    );
};
