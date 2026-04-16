import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import {
    TrendingDown,
    Calendar,
    ArrowUpRight,
    Filter,
    ArrowLeft,
    TrendingUp,
    Wallet,
    User as UserIcon,
    ChevronLeft,
    ChevronRight,
    ArrowRight,
    Sun,
    Moon,
    Lock,
    LogOut,
    Share2,
    Download,
    Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useSecurity } from '../context/SecurityContext';
import { PinPad, PatternPad } from '../components/LockScreen';

const Account = () => {
    const [filter, setFilter] = useState('monthly'); // 'daily', 'monthly', 'yearly'
    const [currentDate, setCurrentDate] = useState(new Date());
    const [displayType, setDisplayType] = useState('all'); // 'all', 'income', 'expense'
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { timeFormat, toggleTimeFormat } = useSettings();
    const { hasLock, lockType, configureLock, removeLock, verifyLock } = useSecurity();
    const [settingLock, setSettingLock] = useState(null); // 'pin', 'pattern', 'verify-remove', 'verify-reset'
    const [tempLockObj, setTempLockObj] = useState('');
    const [setupStep, setSetupStep] = useState(1);
    const [setupVal, setSetupVal] = useState('');
    const [setupError, setSetupError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const res = await api.get('/transactions');
                setTransactions(res.data);
            } catch (err) {
                console.error('Error fetching transactions', err);
                if (err.response?.status === 401) {
                    logout();
                    navigate('/auth');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchTransactions();
    }, []);

    const navigateDate = (direction) => {
        const newDate = new Date(currentDate);
        if (filter === 'daily') {
            newDate.setDate(newDate.getDate() + direction);
        } else if (filter === 'monthly') {
            newDate.setMonth(newDate.getMonth() + direction);
        } else if (filter === 'yearly') {
            newDate.setFullYear(newDate.getFullYear() + direction);
        }
        setCurrentDate(newDate);
    };

    const filterTransactions = () => {
        return transactions.filter(t => {
            const tDate = new Date(t.date);
            let matchesDate = false;

            if (filter === 'daily') {
                matchesDate = tDate.toDateString() === currentDate.toDateString();
            } else if (filter === 'monthly') {
                matchesDate = tDate.getMonth() === currentDate.getMonth() && tDate.getFullYear() === currentDate.getFullYear();
            } else if (filter === 'yearly') {
                matchesDate = tDate.getFullYear() === currentDate.getFullYear();
            }

            if (!matchesDate) return false;

            if (displayType === 'income') return t.type === 'income';
            if (displayType === 'expense') return t.type === 'expense';
            return true; // 'all'
        });
    };

    const getDateDisplay = () => {
        if (filter === 'daily') {
            return currentDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
        } else if (filter === 'monthly') {
            return currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        } else if (filter === 'yearly') {
            return currentDate.getFullYear().toString();
        }
    };

    const currentTransactions = filterTransactions();
    const totalExpense = currentTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = currentTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const exportData = () => {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('offline_cache_') || key === 'pending_sync_operations') {
                data[key] = localStorage.getItem(key);
            }
        }
        if (Object.keys(data).length === 0) {
            alert('No offline data found to export.');
            return;
        }
        const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
        navigator.clipboard.writeText(encoded).then(() => {
            alert('Your offline data has been copied to the clipboard! Open the Render link and use the "Import" button there.');
        }).catch(err => {
            alert('Failed to copy: ' + encoded);
        });
    };

    const importData = () => {
        const code = window.prompt('Paste the export code you copied from your other link:');
        if (!code) return;
        try {
            const data = JSON.parse(decodeURIComponent(escape(atob(code))));
            Object.keys(data).forEach(key => {
                localStorage.setItem(key, data[key]);
            });
            alert('Data imported successfully! The app will now reload to sync your transactions.');
            window.location.reload();
        } catch (err) {
            alert('Invalid migration code. Please make sure you copied the entire code.');
        }
    };

    if (loading) return (
        <div className="container animate-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="loader"></div>
        </div>
    );

    return (
        <div className="container animate-in" style={{ paddingBottom: '100px' }}>
            {/* Header */}
            <header className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{
                            background: 'var(--glass)',
                            color: 'var(--text-primary)',
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Account Settings</h1>
                </div>
                <button
                    onClick={toggleTheme}
                    style={{ background: 'var(--glass)', color: 'var(--text-primary)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </header>

            {/* User Account Info Section */}
            <div className="glass-card mb-6" style={{
                padding: '24px',
                borderRadius: '24px',
                display: 'flex',
                background: 'var(--card-gradient)',
                alignItems: 'center',
                gap: '20px',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-lg)'
            }}>
                {user?.photoURL ? (
                    <img
                        src={user.photoURL}
                        alt={user.name || 'Profile'}
                        referrerPolicy="no-referrer"
                        style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '20px',
                            objectFit: 'cover',
                            boxShadow: '0 8px 16px -4px rgba(139, 92, 246, 0.5)'
                        }}
                    />
                ) : (
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '20px',
                        background: 'var(--primary-gradient)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 16px -4px rgba(139, 92, 246, 0.5), inset 0 2px 4px rgba(255,255,255,0.2)'
                    }}>
                        <UserIcon size={32} color="white" />
                    </div>
                )}
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '4px' }}>
                        {user?.name || user?.email?.split('@')[0] || 'User Profile'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {user?.email || 'user@example.com'}
                    </p>
                    <div style={{
                        marginTop: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        background: 'rgba(52, 168, 83, 0.12)',
                        color: '#34a853',
                        fontSize: '0.7rem',
                        fontWeight: '600'
                    }}>
                        <svg width="12" height="12" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                        </svg>
                        Google Verified
                    </div>
                </div>
            </div>

            {/* Security Settings Area */}
            <div className="glass-card mb-6" style={{ padding: '20px', borderRadius: '24px' }}>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Lock size={20} color="var(--primary)" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>App Security</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {hasLock ? `Secured with ${lockType.toUpperCase()} lock` : 'Lock your app for privacy'}
                            </p>
                        </div>
                    </div>
                    <div onClick={() => {
                        if (hasLock) {
                            setSettingLock('verify-remove');
                        } else {
                            setSettingLock('pin');
                        }
                    }}>
                        <div style={{ position: 'relative', width: '48px', height: '24px', background: hasLock ? 'var(--primary)' : 'rgba(100,100,100,0.3)', borderRadius: '12px', transition: 'all 0.3s', cursor: 'pointer', border: '1px solid var(--border)' }}>
                            <div style={{ position: 'absolute', top: '1px', left: hasLock ? '25px' : '2px', width: '20px', height: '20px', background: 'white', borderRadius: '50%', transition: 'all 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                        </div>
                    </div>
                </div>
                
                {hasLock && !settingLock && (
                    <div className="flex gap-2 mt-4 flex-wrap">
                        <button onClick={() => setSettingLock('verify-change-pin')} style={{ background: 'var(--glass)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: '10px', fontSize: '0.8rem', flex: 1, border: '1px solid var(--border)', fontWeight: '600' }}>Change PIN</button>
                        <button onClick={() => setSettingLock('verify-change-pattern')} style={{ background: 'var(--glass)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: '10px', fontSize: '0.8rem', flex: 1, border: '1px solid var(--border)', fontWeight: '600' }}>Change Pattern</button>
                        <button onClick={() => {
                                setSettingLock('verify-reset');
                            }}
                            style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--expense)', padding: '10px 12px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '600', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                        >Reset Lock</button>
                    </div>
                )}

                {settingLock && (
                    <div className="flex flex-col gap-4 mt-4 pt-6 pb-2 items-center" style={{ borderTop: '1px solid var(--border)' }}>
                        <h3 className={settingLock.startsWith('verify') ? '' : 'fade-in-text'} style={{ fontSize: '1.2rem', fontWeight: '700', textAlign: 'center' }}>
                            {settingLock.startsWith('verify') 
                                ? `Verify your current ${lockType.toUpperCase()} to continue` 
                                : (setupStep === 1 
                                    ? (settingLock === 'pin' ? 'Set your new PIN' : 'Draw your new pattern') 
                                    : (settingLock === 'pin' ? 'Confirm your new PIN' : 'Draw pattern again to confirm')
                                  )}
                        </h3>
                        {setupError && <p style={{ color: 'var(--expense)', fontSize: '0.85rem', marginTop: '-8px' }}>{setupError}</p>}
                        
                        {(settingLock === 'pin' || (settingLock.startsWith('verify') && lockType === 'pin')) ? (
                            <PinPad 
                                hasError={!!setupError} 
                                resetError={() => setSetupError('')}
                                onComplete={async (val) => {
                                    if (settingLock.startsWith('verify')) {
                                        try {
                                            const res = await verifyLock({ pin: val });
                                            if (res.success) {
                                                if (settingLock.includes('change')) {
                                                    setSettingLock(settingLock.split('-')[2]);
                                                    setSetupStep(1);
                                                    setSetupError('');
                                                } else {
                                                    await removeLock();
                                                    alert(settingLock === 'verify-reset' ? 'Lock reset successfully.' : 'Security lock disabled.');
                                                    setSettingLock(null);
                                                    setSetupError('');
                                                }
                                            } else {
                                                setSetupError(res.message || 'Incorrect PIN');
                                            }
                                        } catch (err) { setSetupError('Error verifying lock'); }
                                    } else if (setupStep === 1) {
                                        setSetupVal(val);
                                        setSetupStep(2);
                                    } else if (setupStep === 2) {
                                        if (val === setupVal) {
                                            try {
                                                await configureLock('pin', { pin: val });
                                                setSettingLock(null);
                                                setSetupStep(1);
                                                setSetupVal('');
                                                alert('PIN saved successfully!');
                                            } catch (err) { setSetupError('Error saving PIN'); setSetupStep(1); }
                                        } else {
                                            setSetupError('PINs do not match');
                                            setSetupStep(1);
                                            setSetupVal('');
                                        }
                                    }
                                }}
                            />
                        ) : (
                            <PatternPad 
                                hasError={!!setupError} 
                                resetError={() => setSetupError('')}
                                onComplete={async (val) => {
                                    if (settingLock.startsWith('verify')) {
                                        try {
                                            const res = await verifyLock({ pattern: val });
                                            if (res.success) {
                                                if (settingLock.includes('change')) {
                                                    setSettingLock(settingLock.split('-')[2]);
                                                    setSetupStep(1);
                                                    setSetupError('');
                                                } else {
                                                    await removeLock();
                                                    alert(settingLock === 'verify-reset' ? 'Lock reset successfully.' : 'Security lock disabled.');
                                                    setSettingLock(null);
                                                    setSetupError('');
                                                }
                                            } else {
                                                setSetupError(res.message || 'Incorrect Pattern');
                                            }
                                        } catch (err) { setSetupError('Error verifying lock'); }
                                    } else if (setupStep === 1) {
                                        setSetupVal(val);
                                        setSetupStep(2);
                                    } else if (setupStep === 2) {
                                        if (val === setupVal) {
                                            try {
                                                await configureLock('pattern', { pattern: val });
                                                setSettingLock(null);
                                                setSetupStep(1);
                                                setSetupVal('');
                                                alert('PATTERN saved successfully!');
                                            } catch (err) { setSetupError('Error saving PATTERN'); setSetupStep(1); }
                                        } else {
                                            setSetupError('Patterns do not match');
                                            setSetupStep(1);
                                            setSetupVal('');
                                        }
                                    }
                                }}
                            />
                        )}
                        
                        <button 
                            onClick={() => { setSettingLock(null); setSetupStep(1); setSetupVal(''); setSetupError(''); }} 
                            style={{ background: 'var(--glass)', color: 'var(--text-secondary)', padding: '10px 24px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '600' }}
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            {/* App Preferences */}
            <div className="glass-card mb-6" style={{ padding: '20px', borderRadius: '24px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px' }}>App Preferences</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="flex items-center justify-between" style={{ padding: '12px', background: 'var(--glass)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-3">
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '10px',
                                background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Clock size={18} color="#3b82f6" />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>Time Format</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Current: {timeFormat === '12h' ? '12-Hour (AM/PM)' : '24-Hour'}</p>
                            </div>
                        </div>
                        <button
                            onClick={toggleTimeFormat}
                            style={{
                                background: 'var(--primary)',
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                fontWeight: '600'
                            }}
                        >
                            Toggle {timeFormat === '12h' ? '24h' : '12h'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Actions / Navigation to Stats */}
            <div className="glass-card mb-6" style={{ padding: '20px', borderRadius: '24px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px' }}>Quick View</h3>
                <button
                    onClick={() => navigate('/stats')}
                    style={{
                        width: '100%',
                        padding: '16px',
                        borderRadius: '16px',
                        background: 'var(--glass)',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: '1px solid var(--border)'
                    }}
                >
                    <div className="flex items-center gap-3">
                        <TrendingUp size={20} color="var(--income)" />
                        <span style={{ fontWeight: '600' }}>View Financial Analytics</span>
                    </div>
                    <ArrowRight size={18} />
                </button>
            </div>

            {/* Data Migration Section */}
            <div className="glass-card mb-6" style={{ padding: '20px', borderRadius: '24px' }}>
                <div className="flex items-center gap-3 mb-4">
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Share2 size={20} color="#3b82f6" />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Data Migration</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Transfer offline data between links</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={exportData}
                        style={{
                            padding: '12px',
                            borderRadius: '12px',
                            background: 'var(--glass)',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            border: '1px solid var(--border)'
                        }}
                    >
                        <Share2 size={16} /> Export Code
                    </button>
                    <button
                        onClick={importData}
                        style={{
                            padding: '12px',
                            borderRadius: '12px',
                            background: 'var(--glass)',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            border: '1px solid var(--border)'
                        }}
                    >
                        <Download size={16} /> Import Code
                    </button>
                </div>
            </div>

            {/* Sign Out Button */}
            <div style={{ marginTop: '40px', padding: '0 4px' }}>
                <button
                    onClick={() => {
                        if (window.confirm('Are you sure you want to sign out?')) {
                            logout();
                            navigate('/');
                        }
                    }}
                    style={{
                        width: '100%',
                        padding: '16px',
                        borderRadius: '18px',
                        background: 'rgba(244, 63, 94, 0.1)',
                        color: 'var(--expense)',
                        border: '1px solid rgba(244, 63, 94, 0.2)',
                        fontWeight: '700',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                    }}
                >
                    <LogOut size={20} />
                    Sign Out from Device
                </button>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '12px' }}>
                    Version 2.0.0 • Firebase Auth
                </p>
            </div>

            {/* Danger Zone */}
            <div style={{ marginTop: '24px', padding: '0 4px' }}>
                <button
                    onClick={async () => {
                        if (window.confirm('WARNING: This will permanently delete your account and ALL your financial data. This cannot be undone. Are you sure?')) {
                            if (window.prompt('To confirm deletion, please type "DELETE" below:') === 'DELETE') {
                                try {
                                    await api.delete('/auth/delete');
                                    alert('Your account and all associated data have been permanently deleted.');
                                    logout();
                                    navigate('/');
                                } catch (err) {
                                    alert(err.response?.data?.message || 'Failed to delete account');
                                }
                            }
                        }
                    }}
                    style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '18px',
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border)',
                        fontWeight: '500',
                        fontSize: '0.85rem'
                    }}
                >
                    Permanently Delete Account
                </button>
            </div>
        </div>
    );
};

export default Account;
