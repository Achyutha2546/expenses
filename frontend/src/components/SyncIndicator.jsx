import React, { useState, useEffect, useCallback } from 'react';
import { Cloud, CloudOff, RefreshCw, Check, AlertTriangle } from 'lucide-react';
import { getPendingCount } from '../utils/api';

/**
 * Sync status indicator that shows:
 * - Online/Offline status
 * - Pending offline operations count
 * - Syncing animation
 * - Sync success/failure feedback
 */
const SyncIndicator = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingCount, setPendingCount] = useState(getPendingCount());
    const [syncState, setSyncState] = useState('idle'); // 'idle' | 'syncing' | 'success' | 'error'
    const [syncProgress, setSyncProgress] = useState({ synced: 0, total: 0 });
    const [visible, setVisible] = useState(false);

    const refreshPendingCount = useCallback(() => {
        setPendingCount(getPendingCount());
    }, []);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            refreshPendingCount();
        };
        const handleOffline = () => {
            setIsOnline(false);
            setVisible(true);
        };
        const handleOfflineSaved = (e) => {
            refreshPendingCount();
            setVisible(true);
            // Auto-hide after 4 seconds if online (sync will happen)
            if (navigator.onLine) {
                setTimeout(() => setVisible(false), 4000);
            }
        };
        const handleSyncStart = (e) => {
            setSyncState('syncing');
            setSyncProgress({ synced: 0, total: e.detail.total });
            setVisible(true);
        };
        const handleSyncProgress = (e) => {
            setSyncProgress(e.detail);
        };
        const handleSyncComplete = () => {
            setSyncState('success');
            setPendingCount(0);
            // Show success for 3 seconds, then hide
            setTimeout(() => {
                setSyncState('idle');
                setVisible(false);
            }, 3000);
        };
        const handleSyncError = (e) => {
            setSyncState('error');
            setPendingCount(e.detail.remaining);
            setTimeout(() => {
                setSyncState('idle');
            }, 4000);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('offline-saved', handleOfflineSaved);
        window.addEventListener('sync-start', handleSyncStart);
        window.addEventListener('sync-progress', handleSyncProgress);
        window.addEventListener('sync-complete', handleSyncComplete);
        window.addEventListener('sync-error', handleSyncError);

        // Check initial state
        if (!navigator.onLine || getPendingCount() > 0) {
            setVisible(true);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('offline-saved', handleOfflineSaved);
            window.removeEventListener('sync-start', handleSyncStart);
            window.removeEventListener('sync-progress', handleSyncProgress);
            window.removeEventListener('sync-complete', handleSyncComplete);
            window.removeEventListener('sync-error', handleSyncError);
        };
    }, [refreshPendingCount]);

    // Nothing to show
    if (!visible && syncState === 'idle' && isOnline && pendingCount === 0) return null;

    const getContent = () => {
        if (!isOnline) {
            return (
                <>
                    <div className="sync-indicator-dot offline" />
                    <CloudOff size={14} />
                    <span>Offline{pendingCount > 0 ? ` · ${pendingCount} pending` : ''}</span>
                </>
            );
        }

        if (syncState === 'syncing') {
            return (
                <>
                    <RefreshCw size={14} className="sync-spinning" />
                    <span>Syncing {syncProgress.synced}/{syncProgress.total}...</span>
                </>
            );
        }

        if (syncState === 'success') {
            return (
                <>
                    <div className="sync-indicator-dot success" />
                    <Check size={14} />
                    <span>Synced successfully</span>
                </>
            );
        }

        if (syncState === 'error') {
            return (
                <>
                    <div className="sync-indicator-dot error" />
                    <AlertTriangle size={14} />
                    <span>{pendingCount} failed to sync</span>
                </>
            );
        }

        if (pendingCount > 0) {
            return (
                <>
                    <div className="sync-indicator-dot pending" />
                    <Cloud size={14} />
                    <span>{pendingCount} pending sync</span>
                </>
            );
        }

        return null;
    };

    const content = getContent();
    if (!content) return null;

    const stateClass = !isOnline ? 'offline' :
        syncState === 'syncing' ? 'syncing' :
        syncState === 'success' ? 'success' :
        syncState === 'error' ? 'error' :
        pendingCount > 0 ? 'pending' : '';

    return (
        <div className={`sync-indicator ${stateClass}`}>
            {content}
        </div>
    );
};

export default SyncIndicator;
