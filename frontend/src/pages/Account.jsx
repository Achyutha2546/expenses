import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
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
    LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useSecurity } from '../context/SecurityContext';

const Account = () => {
    const [filter, setFilter] = useState('monthly'); // 'daily', 'monthly', 'yearly'
    const [currentDate, setCurrentDate] = useState(new Date());
    const [displayType, setDisplayType] = useState('all'); // 'all', 'income', 'expense'
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { pin, savePin, removePin } = useSecurity();
    const [pinAction, setPinAction] = useState(null); // 'set', 'change', 'remove'
    const [pinStep, setPinStep] = useState(1); // 1: verify old, 2: enter new
    const [tempPin, setTempPin] = useState('');
    const [pinError, setPinError] = useState('');
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
                    <h1 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Account Details</h1>
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
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '4px' }}>
                        {user?.email?.split('@')[0] || 'User Profile'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {user?.email || 'user@example.com'}
                    </p>
                    <div style={{
                        marginTop: '8px',
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        background: 'rgba(139, 92, 246, 0.15)',
                        color: 'var(--primary)',
                        fontSize: '0.7rem',
                        fontWeight: '600'
                    }}>
                        Premium Account
                    </div>
                </div>
            </div>

            {/* Security Settings Area */}
            <div className="glass-card mb-6" style={{ padding: '20px', borderRadius: '24px' }}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '12px',
                            background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Lock size={20} color="var(--primary)" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>App Lock PIN</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {pin ? 'PIN is currently set' : 'Lock your app with a 4-digit PIN'}
                            </p>
                        </div>
                    </div>
                    <div>
                        {pinAction ? (
                            <div className="flex flex-col gap-2 items-end">
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength="6"
                                    placeholder={pinStep === 1 ? "Enter current PIN" : "New PIN (4-6 digits)"}
                                    value={tempPin}
                                    onInput={(e) => {
                                        e.target.value = e.target.value.replace(/[^0-9]/g, '');
                                    }}
                                    onChange={(e) => {
                                        setTempPin(e.target.value);
                                        setPinError('');
                                    }}
                                    style={{ width: '160px', padding: '8px 12px', fontSize: '0.85rem' }}
                                />
                                {pinError && <p style={{ color: 'var(--expense)', fontSize: '0.75rem', marginTop: '-4px' }}>{pinError}</p>}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            if (pinStep === 1) {
                                                if (tempPin === pin) {
                                                    if (pinAction === 'remove') {
                                                        removePin();
                                                        setPinAction(null);
                                                    } else {
                                                        setPinStep(2);
                                                        setTempPin('');
                                                    }
                                                } else {
                                                    setPinError('Incorrect PIN');
                                                }
                                            } else {
                                                if (tempPin.length >= 4 && tempPin.length <= 6) {
                                                    savePin(tempPin);
                                                    setPinAction(null);
                                                } else {
                                                    setPinError('Must be 4 to 6 digits');
                                                }
                                            }
                                        }}
                                        style={{ background: 'var(--primary)', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem' }}
                                    >
                                        {pinStep === 1 && pinAction === 'remove' ? 'Remove' : (pinStep === 1 ? 'Next' : 'Save')}
                                    </button>
                                    <button
                                        onClick={() => { setPinAction(null); setTempPin(''); setPinError(''); }}
                                        style={{ background: 'var(--glass)', color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem' }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : pin ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setPinAction('change'); setPinStep(1); setTempPin(''); setPinError(''); }}
                                    style={{ background: 'var(--glass)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem' }}
                                >
                                    Change PIN
                                </button>
                                <button
                                    onClick={() => { setPinAction('remove'); setPinStep(1); setTempPin(''); setPinError(''); }}
                                    style={{ background: 'rgba(244, 63, 94, 0.15)', color: 'var(--expense)', padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem' }}
                                >
                                    Remove PIN
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => { setPinAction('set'); setPinStep(2); setTempPin(''); setPinError(''); }}
                                style={{ background: 'var(--primary)', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem' }}
                            >
                                Set PIN
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Premium Sliding Filter Bar */}
            <div style={{
                background: 'var(--bg-card)',
                padding: '6px',
                borderRadius: '16px',
                display: 'flex',
                marginBottom: '16px',
                position: 'relative',
                border: '1px solid var(--border)'
            }}>
                {['daily', 'monthly', 'yearly'].map((type) => (
                    <button
                        key={type}
                        onClick={() => {
                            setFilter(type);
                            setCurrentDate(new Date()); // Reset to today when changing filter
                        }}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            zIndex: 2,
                            background: filter === type ? 'var(--primary)' : 'transparent',
                            color: filter === type ? 'white' : 'var(--text-secondary)',
                            transition: 'all 0.3s ease',
                            textTransform: 'capitalize'
                        }}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Date Navigation Section */}
            <div className="flex items-center justify-between mb-6" style={{
                background: 'var(--glass)',
                padding: '12px 20px',
                borderRadius: '16px',
                border: '1px solid var(--border)'
            }}>
                <button
                    onClick={() => navigateDate(-1)}
                    style={{ background: 'transparent', color: 'var(--text-primary)' }}
                >
                    <ChevronLeft size={24} />
                </button>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>{getDateDisplay()}</p>
                </div>
                <button
                    onClick={() => navigateDate(1)}
                    style={{ background: 'transparent', color: 'var(--text-primary)' }}
                >
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* Type Selector (All/Income/Expense) */}
            <div className="flex gap-2 mb-8">
                {['all', 'income', 'expense'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setDisplayType(type)}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            background: displayType === type ? 'var(--primary)' : 'var(--glass)',
                            color: displayType === type ? 'white' : 'var(--text-secondary)',
                            border: '1px solid var(--border)',
                            textTransform: 'capitalize'
                        }}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Expenditure Summary Card */}
            <div className="glass-card mb-8" style={{
                padding: '24px',
                borderRadius: '24px',
                background: 'var(--card-gradient)',
                border: '1px solid var(--border)'
            }}>
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>Total Expenditure</p>
                        <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--expense)' }}>₹{totalExpense.toLocaleString()}</h2>
                    </div>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
                        background: 'rgba(244, 63, 94, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <TrendingDown size={24} color="var(--expense)" />
                    </div>
                </div>

                <div style={{ height: '1px', background: 'var(--border)', margin: '20px 0' }}></div>

                <div className="flex justify-between">
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '2px' }}>Total Income</p>
                        <p style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--income)' }}>+₹{totalIncome.toLocaleString()}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '2px' }}>Net Flow</p>
                        <p style={{ fontWeight: '700', fontSize: '1.1rem', color: (totalIncome - totalExpense) >= 0 ? 'var(--income)' : 'var(--expense)' }}>
                            {(totalIncome - totalExpense) >= 0 ? '+' : '-'}₹{Math.abs(totalIncome - totalExpense).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Transactions Section */}
            <div className="mb-10">
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px', textTransform: 'capitalize' }}>
                    {displayType === 'all' ? 'Transactions' : displayType} Breakdown
                </h3>
                <div className="flex flex-col gap-3">
                    {currentTransactions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                            <Calendar size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                            <p>No transactions for this period.</p>
                        </div>
                    ) : (
                        currentTransactions.map((t) => (
                            <div key={t._id} className="glass-card" style={{
                                padding: '16px',
                                borderRadius: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'var(--glass)'
                            }}>
                                <div className="flex items-center gap-4">
                                    <div style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '12px',
                                        background: t.type === 'income' ? 'rgba(16, 185, 129, 0.12)' : t.type === 'expense' ? 'rgba(244, 63, 94, 0.12)' : 'rgba(139, 92, 246, 0.12)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {t.type === 'income' ?
                                            <TrendingUp size={20} color="var(--income)" /> :
                                            t.type === 'expense' ? <TrendingDown size={20} color="var(--expense)" /> :
                                            <ArrowRight size={20} color="var(--primary)" />
                                        }
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '0.95rem', fontWeight: '600' }}>
                                            {t.type === 'income' ? (t.source || 'Income') : t.type === 'expense' ? (t.purpose || 'Expense') : 'Transfer'}
                                        </h4>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{
                                        fontWeight: '700',
                                        fontSize: '1rem',
                                        color: t.type === 'income' ? 'var(--income)' : t.type === 'expense' ? 'var(--text-primary)' : 'var(--primary)'
                                    }}>
                                        {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}₹{t.amount.toLocaleString()}
                                    </p>
                                    <ArrowUpRight size={14} color="var(--text-muted)" />
                                </div>
                            </div>
                        ))
                    )}
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
                    Version 1.2.0 • Build 2026.03.25
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
