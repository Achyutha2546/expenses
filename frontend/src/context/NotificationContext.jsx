import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { requestNotificationPermission, onForegroundMessage } from '../firebase';
import { useAuth } from './AuthContext';
import api from '../utils/api';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [permission, setPermission] = useState('default');
    const [preferences, setPreferences] = useState({
        budgetWarning: true,
        budgetExceeded: true,
        dailyReminder: true,
        reminderTime: '20:00',
        hasTokens: false
    });
    const [fcmToken, setFcmToken] = useState(null);
    const [foregroundNotification, setForegroundNotification] = useState(null);
    const foregroundListenerSet = useRef(false);

    // Check current permission state
    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    // Fetch preferences when user is available
    useEffect(() => {
        if (user?.token) {
            fetchPreferences();
        }
    }, [user?.token]);

    // Set up foreground message listener
    useEffect(() => {
        if (permission !== 'granted' || foregroundListenerSet.current) return;

        foregroundListenerSet.current = true;
        onForegroundMessage((payload) => {
            console.log('Foreground notification received:', payload);
            setForegroundNotification({
                id: Date.now(),
                title: payload.notification?.title || 'Spendly',
                body: payload.notification?.body || '',
                type: payload.data?.type || 'info',
                link: payload.data?.link || '/dashboard'
            });

            // Auto-dismiss after 6 seconds
            setTimeout(() => {
                setForegroundNotification(null);
            }, 6000);
        });
    }, [permission]);

    const fetchPreferences = async () => {
        try {
            const { data } = await api.get('/notifications/preferences');
            setPreferences(data);
        } catch (error) {
            console.error('Failed to fetch notification preferences:', error);
        }
    };

    /**
     * Request push notification permission, get FCM token, and register with backend
     */
    const requestPermission = useCallback(async () => {
        try {
            const token = await requestNotificationPermission();
            setPermission(Notification.permission);

            if (token && user?.token) {
                setFcmToken(token);

                // Send token to backend
                await api.post('/notifications/subscribe', {
                    token,
                    device: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop'
                });

                // Refresh preferences to show hasTokens = true
                await fetchPreferences();

                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to request notification permission:', error);
            return false;
        }
    }, [user?.token]);

    /**
     * Update notification preferences on backend
     */
    const updatePreferences = useCallback(async (newPrefs) => {
        try {
            const { data } = await api.put('/notifications/preferences', newPrefs);
            setPreferences(prev => ({ ...prev, ...data }));
            return true;
        } catch (error) {
            console.error('Failed to update notification preferences:', error);
            return false;
        }
    }, []);

    /**
     * Dismiss the foreground notification toast
     */
    const dismissNotification = useCallback(() => {
        setForegroundNotification(null);
    }, []);

    return (
        <NotificationContext.Provider value={{
            permission,
            preferences,
            fcmToken,
            foregroundNotification,
            requestPermission,
            updatePreferences,
            dismissNotification,
            fetchPreferences
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
