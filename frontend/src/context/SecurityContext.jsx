import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../utils/api';
import bcrypt from 'bcryptjs';

const SecurityContext = createContext();

export const useSecurity = () => useContext(SecurityContext);

export const SecurityProvider = ({ children }) => {
    const { user } = useAuth();
    const [hasLock, setHasLock] = useState(false);
    const [lockType, setLockType] = useState('pin');
    const [isLocked, setIsLocked] = useState(false);
    const [hasRecovery, setHasRecovery] = useState(false);
    const [securityQuestion, setSecurityQuestion] = useState('');
    const [privacyMode, setPrivacyMode] = useState(localStorage.getItem('privacy_mode') === 'true');
    const [loadingLock, setLoadingLock] = useState(true);

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
        let isMounted = true;
        const fetchLockStatus = async () => {
            if (!user) {
                if (isMounted) {
                    setIsLocked(false);
                    setHasLock(false);
                    setLoadingLock(false);
                }
                return;
            }
            try {
                if (navigator.onLine) {
                    const res = await api.get('/lock/status');
                    if (res.data.hasLock && isMounted) {
                        setHasLock(true);
                        setLockType(res.data.lockType);
                        setHasRecovery(res.data.hasRecovery);
                        setSecurityQuestion(res.data.securityQuestion);
                        
                        // Check if we just logged in without unlocking
                        // If session storage says 'unlocked_this_session', skip locking? No, PWA requires lock on open.
                        if (!sessionStorage.getItem('app_unlocked')) {
                            setIsLocked(true);
                        }

                        localStorage.setItem('offline_lock', 'true');
                        localStorage.setItem('offline_lockType', res.data.lockType);
                        if (res.data.pinHash) localStorage.setItem('offline_pinHash', res.data.pinHash);
                        if (res.data.pattern) localStorage.setItem('offline_pattern', res.data.pattern);
                        if (res.data.securityQuestion) localStorage.setItem('offline_securityQuestion', res.data.securityQuestion);
                    } else if (isMounted) {
                        setHasLock(false);
                        setIsLocked(false);
                        setHasRecovery(false);
                        localStorage.removeItem('offline_lock');
                    }
                } else {
                    if (localStorage.getItem('offline_lock') && isMounted) {
                        setHasLock(true);
                        setLockType(localStorage.getItem('offline_lockType') || 'pin');
                        setHasRecovery(!!localStorage.getItem('offline_securityQuestion'));
                        setSecurityQuestion(localStorage.getItem('offline_securityQuestion') || '');
                        if (!sessionStorage.getItem('app_unlocked')) {
                            setIsLocked(true);
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to get lock status', err);
            } finally {
                if (isMounted) setLoadingLock(false);
            }
        };

        fetchLockStatus();
        return () => { isMounted = false; };
    }, [user, isLocked]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && hasLock) {
                setIsLocked(true);
                sessionStorage.removeItem('app_unlocked');
            }
        };
        const handleKeyDown = (e) => {
            if (e.key === 'PrintScreen') {
                if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText('');
                if (hasLock) setIsLocked(true);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('keyup', handleKeyDown);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('keyup', handleKeyDown);
        };
    }, [hasLock]);

    // Inactivity Auto-Lock Feature
    useEffect(() => {
        if (!hasLock || isLocked) return;

        let timeout;
        const resetTimer = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                setIsLocked(true);
                sessionStorage.removeItem('app_unlocked');
            }, 30000); // 30 seconds
        };

        resetTimer(); // Initialize timer

        const events = ['mousemove', 'keydown', 'touchstart', 'click', 'scroll'];
        events.forEach(e => window.addEventListener(e, resetTimer));

        return () => {
            clearTimeout(timeout);
            events.forEach(e => window.removeEventListener(e, resetTimer));
        };
    }, [hasLock, isLocked]);

    const configureLock = async (type, credentials) => {
        try {
            const res = await api.post('/lock/set', { lockType: type, ...credentials });
            setHasLock(true);
            setLockType(type);
            setIsLocked(false);
            sessionStorage.setItem('app_unlocked', 'true');
            
            localStorage.setItem('offline_lock', 'true');
            localStorage.setItem('offline_lockType', type);
            if (res.data.pinHash) localStorage.setItem('offline_pinHash', res.data.pinHash);
            if (res.data.pattern) localStorage.setItem('offline_pattern', res.data.pattern);
        } catch (err) {
            throw err.response?.data?.message || 'Error setting lock';
        }
    };

    const configureRecovery = async (question, answer) => {
        try {
            await api.post('/lock/set-recovery', { question, answer });
            setHasRecovery(true);
            setSecurityQuestion(question);
            localStorage.setItem('offline_securityQuestion', question);
        } catch (err) {
            throw err.response?.data?.message || 'Error setting recovery';
        }
    };

    const removeLock = async () => {
        try {
            await api.delete('/lock/remove');
            setHasLock(false);
            setIsLocked(false);
            setHasRecovery(false);
            setSecurityQuestion('');
            localStorage.removeItem('offline_lock');
            localStorage.removeItem('offline_lockType');
            localStorage.removeItem('offline_pinHash');
            localStorage.removeItem('offline_pattern');
            localStorage.removeItem('offline_securityQuestion');
            sessionStorage.removeItem('app_unlocked');
        } catch (err) {
            throw err.response?.data?.message || 'Error removing lock';
        }
    };

    const verifyLock = async (credentials) => {
        // Fallback for offline or test mode
        if (!navigator.onLine) {
            let isValid = false;
            if (lockType === 'pattern' && credentials.pattern) {
                isValid = (credentials.pattern === localStorage.getItem('offline_pattern'));
            } else if (lockType === 'pin' && credentials.pin) {
                const storedHash = localStorage.getItem('offline_pinHash');
                if (storedHash) {
                    isValid = bcrypt.compareSync(credentials.pin, storedHash);
                }
            }
            
            if (isValid) {
                // delayed unlock to allow UI animations
                setTimeout(() => setIsLocked(false), 400);
                sessionStorage.setItem('app_unlocked', 'true');
                return { success: true };
            }
            return { success: false, message: 'Invalid offline credentials' };
        }

        // Standard Online Backend Validation
        try {
            await api.post('/lock/verify', credentials);
            setTimeout(() => setIsLocked(false), 400);
            sessionStorage.setItem('app_unlocked', 'true');
            return { success: true };
        } catch (err) {
            return { 
                success: false, 
                message: err.response?.data?.message || 'Invalid input', 
                locked: err.response?.data?.locked 
            };
        }
    };

    const recoverLockAPI = async (answer) => {
        if (!navigator.onLine) {
            return { success: false, message: 'Recovery requires active internet connection.' };
        }
        try {
            const res = await api.post('/lock/recover', { answer });
            if (res.data.success) {
                // Backend removed the lock
                setHasLock(false);
                setIsLocked(false);
                setHasRecovery(false);
                setSecurityQuestion('');
                localStorage.removeItem('offline_lock');
                localStorage.removeItem('offline_lockType');
                localStorage.removeItem('offline_pinHash');
                localStorage.removeItem('offline_pattern');
                localStorage.removeItem('offline_securityQuestion');
                sessionStorage.setItem('app_unlocked', 'true');
                return { success: true };
            }
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Recovery failed' };
        }
    };

    const sendOtpAPI = async (email) => {
        if (!navigator.onLine) {
            return { success: false, message: 'Recovery requires active internet connection.' };
        }
        try {
            const res = await api.post('/lock/send-otp', { email });
            return { success: true, message: res.data.message };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Failed to send OTP' };
        }
    };

    const verifyOtpAPI = async (email, otp) => {
        if (!navigator.onLine) {
            return { success: false, message: 'Recovery requires active internet connection.' };
        }
        try {
            const res = await api.post('/lock/verify-otp', { email, otp });
            if (res.data.success) {
                // Backend removed the lock
                setHasLock(false);
                setIsLocked(false);
                setHasRecovery(false);
                setSecurityQuestion('');
                localStorage.removeItem('offline_lock');
                localStorage.removeItem('offline_lockType');
                localStorage.removeItem('offline_pinHash');
                localStorage.removeItem('offline_pattern');
                localStorage.removeItem('offline_securityQuestion');
                sessionStorage.setItem('app_unlocked', 'true');
                return { success: true };
            }
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Invalid OTP' };
        }
    };

    const togglePrivacyMode = () => setPrivacyMode(!privacyMode);

    return (
        <SecurityContext.Provider value={{ 
            hasLock, lockType, loadingLock, isLocked, privacyMode, hasRecovery, securityQuestion,
            configureLock, removeLock, verifyLock, togglePrivacyMode, configureRecovery, recoverLockAPI,
            sendOtpAPI, verifyOtpAPI
        }}>
            {children}
        </SecurityContext.Provider>
    );
};
