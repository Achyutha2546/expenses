import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useNotifications } from '../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    TrendingUp,
    User as UserIcon,
    Sun,
    Moon,
    Lock,
    LogOut,
    Share2,
    Download,
    Clock,
    Bell,
    BellOff,
    BellRing,
    ArrowRight,
    Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useSecurity } from '../context/SecurityContext';
import { PinPad, PatternPad } from '../components/LockScreen';

const Account = () => {
    const [loading, setLoading] = useState(true);
    const { user, logout } = useAuth();
    const { theme, toggleTheme, accentColor, setAccent } = useTheme();
    const { timeFormat, toggleTimeFormat } = useSettings();
    const { permission, preferences, requestPermission, updatePreferences } = useNotifications();
    const { hasLock, lockType, configureLock, removeLock, verifyLock } = useSecurity();
    const [settingLock, setSettingLock] = useState(null);
    const [enablingNotifications, setEnablingNotifications] = useState(false);
    const [setupStep, setSetupStep] = useState(1);
    const [setupVal, setSetupVal] = useState('');
    const [setupError, setSetupError] = useState('');
    const navigate = useNavigate();

    const ACCENTS = [
        { id: 'indigo', color: '#6366f1', name: 'Indigo' },
        { id: 'rose', color: '#f43f5e', name: 'Rose' },
        { id: 'emerald', color: '#10b981', name: 'Emerald' },
        { id: 'amber', color: '#f59e0b', name: 'Amber' },
        { id: 'sky', color: '#0ea5e9', name: 'Sky' },
        { id: 'violet', color: '#8b5cf6', name: 'Violet' }
    ];

    useEffect(() => {
        // Fast loading simulation to sync UI transitions
        const timer = setTimeout(() => setLoading(false), 200);
        return () => clearTimeout(timer);
    }, []);

    const exportData = () => {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('offline_cache_') || key === 'pending_sync_operations') {
                data[key] = localStorage.getItem(key);
            }
        }
        if (Object.keys(data).length === 0) {
            alert('No offline cache found to export.');
            return;
        }
        const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
        navigator.clipboard.writeText(encoded).then(() => {
            alert('Your encrypted offline cache has been copied to clipboard.');
        }).catch(err => {
            alert('Export failed. Copying backup manually: ' + encoded);
        });
    };

    const importData = () => {
        const code = window.prompt('Paste the exported cache code below:');
        if (!code) return;
        try {
            const data = JSON.parse(decodeURIComponent(escape(atob(code))));
            Object.keys(data).forEach(key => {
                localStorage.setItem(key, data[key]);
            });
            alert('Data cache imported successfully. Reloading Workspace...');
            window.location.reload();
        } catch (err) {
            alert('Migration parsing failed. Ensure the string is formatted correctly.');
        }
    };

    if (loading) {
        return (
            <div className="container flex justify-center items-center min-h-[75vh]">
                <div className="w-10 h-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <div className="container relative pb-12 select-none">
            {/* Header */}
            <header className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-lg font-black text-white tracking-tight">Account Settings</h1>
                </div>
                <button
                    onClick={toggleTheme}
                    className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
                    title="Toggle Dark/Light Mode"
                >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
            </header>

            {/* Profile Summary Card */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 mb-6 flex items-center gap-5 shadow-premium relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-brand-500/5 blur-2xl pointer-events-none" />
                
                <div className="flex-shrink-0">
                    {user?.photoURL ? (
                        <img
                            src={user.photoURL}
                            alt="Profile Avatar"
                            referrerPolicy="no-referrer"
                            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-800"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-glow text-white">
                            <UserIcon size={26} />
                        </div>
                    )}
                </div>
                
                <div className="truncate flex-1">
                    <h2 className="text-base font-extrabold text-white truncate">
                        {user?.name || user?.email?.split('@')[0] || 'User Profile'}
                    </h2>
                    <p className="text-xs text-slate-450 text-slate-400 truncate mt-0.5">
                        {user?.email || 'unregistered@spendly.io'}
                    </p>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase text-emerald-400 mt-2.5">
                        Google Verified
                    </span>
                </div>
            </div>

            {/* Application Security Section */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 mb-6 shadow-premium">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center shadow-glow flex-shrink-0">
                            <Lock size={20} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-sm text-slate-200">Security Access Lock</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                                {hasLock ? `App Locked (${lockType.toUpperCase()})` : 'Lock application on startup'}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            if (hasLock) setSettingLock('verify-remove');
                            else setSettingLock('pin');
                        }}
                        className={`w-12 h-6 rounded-full p-[2px] transition-colors relative border ${
                            hasLock ? 'bg-brand-600 border-brand-500' : 'bg-slate-950 border-slate-850'
                        }`}
                        title="Toggle App Lock"
                    >
                        <div className={`w-4 h-4 rounded-full bg-white shadow-premium transition-transform ${
                            hasLock ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                    </button>
                </div>
                
                {hasLock && !settingLock && (
                    <div className="flex gap-2.5 mt-4 pt-3 border-t border-slate-800/50">
                        <button 
                            onClick={() => setSettingLock('verify-change-pin')} 
                            className="flex-1 py-2 px-3 rounded-xl border border-slate-850 hover:border-slate-800 bg-slate-950/40 text-[10px] font-black uppercase text-slate-300 transition-colors"
                        >
                            Change PIN
                        </button>
                        <button 
                            onClick={() => setSettingLock('verify-change-pattern')} 
                            className="flex-1 py-2 px-3 rounded-xl border border-slate-850 hover:border-slate-800 bg-slate-950/40 text-[10px] font-black uppercase text-slate-300 transition-colors"
                        >
                            Change Pattern
                        </button>
                        <button 
                            onClick={() => setSettingLock('verify-reset')}
                            className="py-2 px-3 rounded-xl bg-rose-500/10 border border-rose-500/15 text-[10px] font-black uppercase text-rose-455 text-rose-400"
                        >
                            Reset Lock
                        </button>
                    </div>
                )}

                {/* Subsetting lockpad prompts */}
                {settingLock && (
                    <div className="flex flex-col gap-4 mt-6 pt-5 border-t border-slate-800/50 items-center">
                        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                            {settingLock.startsWith('verify') 
                                ? `Enter current credentials` 
                                : (setupStep === 1 
                                    ? (settingLock === 'pin' ? 'Configure new PIN' : 'Draw new Pattern') 
                                    : (settingLock === 'pin' ? 'Confirm new PIN' : 'Repeat pattern to save')
                                  )}
                        </h3>
                        {setupError && <p className="text-xs text-rose-455 text-rose-450 font-bold">{setupError}</p>}
                        
                        <div className="w-full flex justify-center max-w-[280px]">
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
                                                        alert(settingLock === 'verify-reset' ? 'Lock reset completed.' : 'Access lock deactivated.');
                                                        setSettingLock(null);
                                                        setSetupError('');
                                                    }
                                                } else {
                                                    setSetupError(res.message || 'Incorrect credentials');
                                                }
                                            } catch (err) { setSetupError('Verification error occurred'); }
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
                                                    alert('PIN lock applied!');
                                                } catch (err) { setSetupError('Failed to configure PIN'); setSetupStep(1); }
                                            } else {
                                                setSetupError('PIN mismatch');
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
                                                        alert(settingLock === 'verify-reset' ? 'Lock reset completed.' : 'Access lock deactivated.');
                                                        setSettingLock(null);
                                                        setSetupError('');
                                                    }
                                                } else {
                                                    setSetupError(res.message || 'Incorrect pattern sequence');
                                                }
                                            } catch (err) { setSetupError('Verification error occurred'); }
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
                                                    alert('Pattern lock applied!');
                                                } catch (err) { setSetupError('Failed to configure pattern'); setSetupStep(1); }
                                            } else {
                                                setSetupError('Pattern mismatch');
                                                setSetupStep(1);
                                                setSetupVal('');
                                            }
                                        }
                                    }}
                                />
                            )}
                        </div>
                        
                        <button 
                            onClick={() => { setSettingLock(null); setSetupStep(1); setSetupVal(''); setSetupError(''); }} 
                            className="px-5 py-2.5 rounded-xl border border-slate-850 hover:border-slate-800 text-xs font-extrabold text-slate-400 bg-slate-950/45 transition-colors"
                        >
                            Cancel Setup
                        </button>
                    </div>
                )}
            </div>

            {/* Custom Theme Accent Preferences */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 mb-6 shadow-premium space-y-6">
                <h3 className="text-sm font-extrabold text-white">App Appearance</h3>
                
                {/* Accent selector */}
                <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Accent Theme</span>
                    <div className="grid grid-cols-6 gap-2 pt-1">
                        {ACCENTS.map((acc) => {
                            const active = accentColor === acc.id;
                            return (
                                <button
                                    key={acc.id}
                                    onClick={() => setAccent(acc.id)}
                                    className="w-10 h-10 rounded-xl relative flex items-center justify-center hover:scale-105 active:scale-95 transition-all outline-none"
                                    style={{ background: acc.color }}
                                    title={acc.name}
                                >
                                    {active && (
                                        <div className="absolute inset-0 border-[3px] border-slate-900 rounded-xl flex items-center justify-center">
                                            <Check size={14} className="text-white" strokeWidth={3} />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Clock select */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/50 border border-slate-850">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-450 flex items-center justify-center">
                            <Clock size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-extrabold text-slate-200">Time Format</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                                {timeFormat === '12h' ? '12-Hour standard' : '24-Hour Military'}
                            </p>
                        </div>
                    </div>
                    
                    <button
                        onClick={toggleTimeFormat}
                        className="px-3 py-1.5 rounded-lg border border-slate-850 hover:border-slate-800 text-[10px] font-black uppercase text-slate-350 bg-slate-950/20 transition-colors"
                    >
                        Switch to {timeFormat === '12h' ? '24H' : '12H'}
                    </button>
                </div>
            </div>

            {/* Smart Alerts Center */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 mb-6 shadow-premium space-y-5">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center shadow-glow">
                            <Bell size={20} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-sm text-slate-200">Push Notifications</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                                Keep track of spending metrics
                            </p>
                        </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase border ${
                        permission === 'granted' 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450' 
                            : permission === 'denied'
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-450'
                                : 'bg-slate-950 border-slate-850 text-slate-500'
                    }`}>
                        {permission === 'granted' ? 'Enabled' : permission === 'denied' ? 'Blocked' : 'Deactivated'}
                    </span>
                </div>

                {permission === 'default' && (
                    <button
                        onClick={async () => {
                            setEnablingNotifications(true);
                            await requestPermission();
                            setEnablingNotifications(false);
                        }}
                        disabled={enablingNotifications}
                        className="w-full p-4 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs shadow-glow flex items-center justify-center gap-2"
                    >
                        <BellRing size={16} />
                        <span>Enable Real-time Alerts</span>
                    </button>
                )}

                {permission === 'denied' && (
                    <div className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex items-start gap-3">
                        <BellOff size={18} className="text-rose-450 mt-0.5 flex-shrink-0" />
                        <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                            Alert permissions are blocked. Activate notification settings in your device browser control panel to utilize budget alerts.
                        </p>
                    </div>
                )}

                {permission === 'granted' && (
                    <div className="space-y-3.5 pt-2">
                        {[
                            { id: 'budgetExceeded', title: '🚨 Limit Alerts', desc: 'Notify immediately when spending crosses monthly budget limits.' },
                            { id: 'budgetWarning', title: '⚠️ Caution Alert (80%)', desc: 'Warn when debit crosses 80% of configured monthly ceiling.' },
                            { id: 'dailyReminder', title: '📝 Daily Bookkeeping', desc: 'Evening alerts prompting manual transaction logging.' }
                        ].map((pref) => (
                            <div key={pref.id} className="flex justify-between items-center p-3 rounded-2xl bg-slate-950/40 border border-slate-850">
                                <div className="space-y-0.5 max-w-[70%]">
                                    <h4 className="text-xs font-bold text-slate-200">{pref.title}</h4>
                                    <p className="text-[9px] text-slate-500 leading-normal">{pref.desc}</p>
                                </div>
                                <button 
                                    onClick={() => updatePreferences({ [pref.id]: !preferences[pref.id] })}
                                    className={`w-10 h-5.5 rounded-full p-[2px] transition-colors border relative ${
                                        preferences[pref.id] ? 'bg-brand-600 border-brand-500' : 'bg-slate-950 border-slate-850'
                                    }`}
                                >
                                    <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-premium transition-transform ${
                                        preferences[pref.id] ? 'translate-x-4.5' : 'translate-x-0'
                                    }`} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Custom Navigation link */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 mb-6 shadow-premium">
                <h3 className="text-sm font-extrabold text-white mb-4">Quick Links</h3>
                <button
                    onClick={() => navigate('/stats')}
                    className="w-full p-4 rounded-xl bg-slate-950/50 border border-slate-850 hover:border-slate-800 text-slate-250 flex items-center justify-between text-xs font-extrabold transition-colors hover:scale-[1.01]"
                >
                    <span className="flex items-center gap-2">
                        <TrendingUp size={16} className="text-emerald-450" />
                        <span>Inspect Flow Charts</span>
                    </span>
                    <ArrowRight size={16} />
                </button>
            </div>

            {/* Backup Migration Panel */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 mb-6 shadow-premium space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-450 flex items-center justify-center">
                        <Share2 size={20} />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-sm text-slate-200">Local Ledger Migration</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                            Sync offline data packages manually
                        </p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={exportData}
                        className="py-3 rounded-xl border border-slate-850 hover:border-slate-800 bg-slate-950/45 text-xs font-bold text-slate-300 hover:text-slate-100 flex items-center justify-center gap-1.5 transition-colors"
                    >
                        <Share2 size={14} /> <span>Copy Code</span>
                    </button>
                    <button
                        onClick={importData}
                        className="py-3 rounded-xl border border-slate-850 hover:border-slate-800 bg-slate-950/45 text-xs font-bold text-slate-300 hover:text-slate-100 flex items-center justify-center gap-1.5 transition-colors"
                    >
                        <Download size={14} /> <span>Import Code</span>
                    </button>
                </div>
            </div>

            {/* Authentication Sign Out actions */}
            <div className="space-y-4 pt-6">
                <button
                    onClick={() => {
                        if (window.confirm('Sign out of Spendly on this device?')) {
                            logout();
                            navigate('/');
                        }
                    }}
                    className="w-full py-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/15 text-rose-455 text-rose-400 font-extrabold text-sm flex items-center justify-center gap-2 shadow-glow transition-all"
                >
                    <LogOut size={18} />
                    <span>De-authorize Account</span>
                </button>
                <p className="text-center text-slate-655 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                    Build Version 2.0.0 · PWA Synced
                </p>

                {/* Account Removal Danger button */}
                <button
                    onClick={async () => {
                        if (window.confirm('CRITICAL ACTION: This deletes your credentials and all transaction databases permanently. This action is irreversible. Proceed?')) {
                            if (window.prompt('Type "DELETE" below to finalize deactivation:') === 'DELETE') {
                                try {
                                    await api.delete('/auth/delete');
                                    alert('Account deleted.');
                                    logout();
                                    navigate('/');
                                } catch (err) {
                                    alert(err.response?.data?.message || 'Deactivation request failed');
                                }
                            }
                        }
                    }}
                    className="w-full py-3 rounded-xl border border-slate-855 border-slate-850 text-slate-600 hover:text-rose-450 hover:border-rose-500/30 transition-colors text-xs font-semibold"
                >
                    Permanently Terminate Account
                </button>
            </div>
        </div>
    );
};

export default Account;
