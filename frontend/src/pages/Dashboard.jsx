import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
    Plus,
    TrendingUp,
    TrendingDown,
    Wallet,
    CreditCard,
    LogOut,
    X,
    ChevronRight,
    Bell,
    Settings,
    User,
    History,
    Sun,
    Moon,
    Download,
    Eye,
    EyeOff,
    Target,
    Edit2,
    Zap,
    ThumbsUp,
    AlertCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useSecurity } from '../context/SecurityContext';

const Dashboard = () => {
    const [transactions, setTransactions] = useState([]);
    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showBreakdown, setShowBreakdown] = useState(false);
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [peekData, setPeekData] = useState(null);
    const [budget, setBudget] = useState({ amount: 0 });
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [newBudgetVal, setNewBudgetVal] = useState('');
    const navigate = useNavigate();
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallBtn, setShowInstallBtn] = useState(false);
    const [insights, setInsights] = useState(null);

    const fetchData = async () => {
        try {
            const [transRes, sourcesRes, budgetRes, insightsRes] = await Promise.all([
                api.get('/transactions'),
                api.get('/sources'),
                api.get('/budget'),
                api.get('/analytics/insights')
            ]);
            setTransactions(transRes.data);
            setSources(sourcesRes.data);
            setBudget(budgetRes.data);
            setInsights(insightsRes.data);
            if (sourcesRes.data.length === 0 && !sourcesRes.offline) {
                navigate('/onboarding');
            }
        } catch (err) {
            console.error('Error fetching data', err);
            if (err.response?.status === 401) {
                logout();
                navigate('/auth');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallBtn(true);
        };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setShowInstallBtn(false);
        }
    };

    const handleUpdateBudget = async () => {
        if (!newBudgetVal || isNaN(newBudgetVal)) return;
        try {
            const res = await api.post('/budget', { amount: parseFloat(newBudgetVal) });
            setBudget(res.data);
            setShowBudgetModal(false);
            setNewBudgetVal('');
        } catch (err) {
            console.error('Error updating budget', err);
        }
    };

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const totals = transactions.reduce((acc, curr) => {
        const tDate = new Date(curr.date);
        const isCurrentMonth = tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;

        if (curr.type === 'income') {
            acc.income += curr.amount;
            if (isCurrentMonth) acc.monthlyIncome += curr.amount;
        } else if (curr.type === 'expense') {
            acc.expense += curr.amount;
            if (isCurrentMonth) acc.monthlyExpense += curr.amount;
        }
        // Source tracking (simplified for brevity)
        const sourceKey = curr.sourceId?.toString();
        if (sourceKey) {
            if (!acc.sources[sourceKey]) acc.sources[sourceKey] = 0;
            if (curr.type === 'income') acc.sources[sourceKey] += curr.amount;
            else if (curr.type === 'expense') acc.sources[sourceKey] -= curr.amount;
            else if (curr.type === 'transfer') {
                if (curr.purpose === 'Transfer In') acc.sources[sourceKey] += curr.amount;
                else acc.sources[sourceKey] -= curr.amount;
            }
        }
        return acc;
    }, { income: 0, expense: 0, monthlyIncome: 0, monthlyExpense: 0, sources: {} });

    const budgetStatus = budget.amount > 0 ? (totals.monthlyExpense / budget.amount) * 100 : 0;
    const isOverBudget = totals.monthlyExpense > budget.amount;

    const balance = totals.income - totals.expense;

    if (loading) return (
        <div className="container animate-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="loader"></div>
        </div>
    );

    return (
        <div className="container animate-in">
            {/* Offline Banner */}
            {!isOnline && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid var(--expense)',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    animation: 'pulse 2s infinite'
                }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--expense)' }}></div>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--expense)' }}>You are currently offline. Using cached data.</span>
                </div>
            )}

            {/* Header */}
            <header className="flex justify-between items-center mb-6" style={{ padding: '0 4px' }}>
                <div className="flex items-center gap-3">
                    <Link to="/account" style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'var(--primary-gradient)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 16px -4px rgba(139, 92, 246, 0.5), inset 0 2px 4px rgba(255,255,255,0.2)'
                    }}>
                        <User size={22} color="white" />
                    </Link>
                    <div style={{ overflow: 'hidden' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '-2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Welcome back,</p>
                        <h1 style={{ fontSize: '1.1rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email?.split('@')[0] || 'User'}</h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    {showInstallBtn && (
                        <button
                            onClick={handleInstallClick}
                            style={{ background: 'var(--primary)', color: 'white', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 2s infinite' }}
                        >
                            <Download size={20} />
                        </button>
                    )}
                    <button
                        onClick={toggleTheme}
                        style={{ background: 'var(--glass)', color: 'var(--text-primary)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <button
                        onClick={() => {
                            if (window.confirm('Sign out of your account?')) {
                                logout();
                                navigate('/');
                            }
                        }}
                        style={{ background: 'rgba(244, 63, 94, 0.12)', color: 'var(--expense)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <LogOut size={20} />
                    </button>
                    <Link to="/account" style={{ background: 'var(--glass)', color: 'var(--text-primary)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Settings size={20} />
                    </Link>
                </div>
            </header>

            {/* Monthly Budget Card */}
            <div className="glass-card mb-8" style={{
                padding: '20px',
                borderRadius: '24px',
                background: 'var(--glass)',
                border: '1px solid var(--border)'
            }}>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '12px',
                            background: 'rgba(139, 92, 246, 0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Target size={20} color="var(--primary)" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Monthly Budget</h3>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            setNewBudgetVal(budget.amount || '');
                            setShowBudgetModal(true);
                        }}
                        style={{ background: 'var(--glass)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '600' }}
                    >
                        <Edit2 size={14} style={{ marginRight: '4px' }} /> Edit
                    </button>
                </div>

                <div className="mb-4">
                    <div className="flex justify-between mb-2">
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Spent: ₹{totals.monthlyExpense.toLocaleString()}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: budget.amount > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {budget.amount > 0 ? `₹${budget.amount.toLocaleString()}` : 'Set Budget'}
                        </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ 
                            width: `${Math.min(budgetStatus, 100)}%`, 
                            height: '100%', 
                            background: budgetStatus > 90 ? 'var(--expense)' : budgetStatus > 70 ? '#f59e0b' : 'var(--income)',
                            transition: 'width 0.5s ease-out'
                        }}></div>
                    </div>
                </div>

                <div className="flex justify-between items-center">
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {budget.amount > 0 ? (
                            isOverBudget 
                                ? `Exceeded by ₹${(totals.monthlyExpense - budget.amount).toLocaleString()}` 
                                : `₹${(budget.amount - totals.monthlyExpense).toLocaleString()} remaining`
                        ) : 'Keep your spending in check'}
                    </p>
                    {isOverBudget && (
                        <div style={{ padding: '4px 8px', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '6px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--expense)' }}>ALERT</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Smart Insights Section */}
            {insights && (
                <div className="mb-8 animate-in" style={{ animationDelay: '0.1s' }}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>Smart Insights</h3>
                        <div style={{ background: 'var(--glass)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700', border: '1px solid var(--border)' }}>AI LOGIC</div>
                    </div>
                    <div className="glass-card" style={{
                        padding: '16px',
                        borderRadius: '24px',
                        background: insights.trend === 'up' ? 'rgba(244, 63, 94, 0.05)' : (insights.trend === 'down' ? 'rgba(16, 185, 129, 0.05)' : 'var(--glass)'),
                        border: `1px solid ${insights.trend === 'up' ? 'rgba(244, 63, 94, 0.1)' : (insights.trend === 'down' ? 'rgba(16, 185, 129, 0.1)' : 'var(--border)')}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        boxShadow: 'none'
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '16px',
                            background: insights.trend === 'up' ? 'rgba(244, 63, 94, 0.15)' : (insights.trend === 'down' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(139, 92, 246, 0.15)'),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            {insights.trend === 'up' ? <AlertCircle size={24} color="var(--expense)" /> : (insights.trend === 'down' ? <ThumbsUp size={24} color="var(--income)" /> : <Zap size={24} color="var(--primary)" />)}
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: '800', marginBottom: '2px', color: insights.trend === 'up' ? 'var(--expense)' : (insights.trend === 'down' ? 'var(--income)' : 'var(--text-primary)') }}>
                                {insights.trend === 'up' ? 'Spending Alert' : (insights.trend === 'down' ? 'High Savings' : 'Good Progress')}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4', fontWeight: '500' }}>
                                {insights.message}
                            </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ 
                                fontSize: '1.2rem', 
                                fontWeight: '900', 
                                color: insights.trend === 'up' ? 'var(--expense)' : (insights.trend === 'down' ? 'var(--income)' : 'var(--text-primary)') 
                            }}>
                                {insights.trend === 'up' ? '+' : ''}{insights.changePercent.toFixed(0)}%
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions Grid */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Quick Actions</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                    {[
                        { to: '/add', icon: Plus, label: 'Add', color: 'var(--primary)', bg: 'rgba(139, 92, 246, 0.12)', protected: true },
                        { to: '/sources', icon: Wallet, label: 'Wallet', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
                        { to: '/history', icon: History, label: 'History', color: 'var(--income)', bg: 'rgba(16, 185, 129, 0.12)' },
                        { to: '/sources', icon: Settings, label: 'Settings', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' }
                    ].map((btn, i) => {
                        const isDisabled = btn.protected && !isOnline;
                        return (
                            <div key={i} style={{ opacity: isDisabled ? 0.4 : 1, transition: 'opacity 0.3s' }}>
                                <Link 
                                    to={isDisabled ? '#' : btn.to} 
                                    onClick={(e) => isDisabled && e.preventDefault()}
                                    style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: isDisabled ? 'not-allowed' : 'pointer' }}
                                >
                                    <div style={{
                                        width: '100%',
                                        aspectRatio: '1/1',
                                        borderRadius: '16px',
                                        background: btn.bg,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'transform 0.2s ease'
                                    }} className="action-btn">
                                        <btn.icon size={24} color={btn.color} />
                                    </div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-secondary)' }}>{btn.label}</span>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Install Prompt Banner (Only when standalone isn't active) */}
            {showInstallBtn && isOnline && (
                <div className="glass-card mb-8 animate-in" style={{
                    padding: '20px',
                    borderRadius: '24px',
                    background: 'var(--primary-gradient)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    boxShadow: '0 12px 24px -8px rgba(139, 92, 246, 0.5)'
                }}>
                    <div className="flex items-center gap-3">
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Rocket size={24} color="white" />
                        </div>
                        <div>
                            <h4 style={{ color: 'white', fontSize: '0.95rem', fontWeight: '800' }}>Install App</h4>
                            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem' }}>Add to home screen for quick access</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleInstallClick}
                        style={{ background: 'white', color: 'var(--primary)', padding: '10px 20px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '700' }}
                    >
                        Install
                    </button>
                </div>
            )}

            {/* My Accounts Section */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>My Accounts</h3>
                    <Link to="/sources" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>See All</Link>
                </div>
                <div className="flex flex-col gap-3">
                    {sources.slice(0, 3).map((s) => (
                        <div key={s._id} className="glass-card" onClick={() => setPeekData({ title: s.name, amount: totals.sources[s._id.toString()] || 0, type: 'account', isIncome: true })} style={{ padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                            <div className="flex items-center gap-4">
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--glass)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CreditCard size={20} color="var(--primary)" />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: '600' }}>{s.name}</h4>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Primary Account</p>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontWeight: '700', fontSize: '1rem' }}>****</p>
                                <ChevronRight size={16} color="var(--text-muted)" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Transactions Peek */}
            <div className="mb-10">
                <div className="flex justify-between items-center mb-4">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Recent Transactions</h3>
                    <Link to="/history" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>View All</Link>
                </div>
                {transactions.length === 0 ? (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                        <Plus size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                        <p>No transactions yet</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1">
                        {transactions
                            .filter(t => t.purpose !== 'Transfer In')
                            .slice(0, 5)
                            .map((t) => (
                            <div key={t._id} className="flex items-center justify-between p-3" style={{ borderBottom: '1px solid var(--border)' }}>
                                <div className="flex items-center gap-3">
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: t.type === 'income' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {t.type === 'income' ? <TrendingUp size={18} color="var(--income)" /> : <TrendingDown size={18} color="var(--expense)" />}
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                                            {t.type === 'income' ? (t.source || 'Income') : t.type === 'expense' ? (t.purpose || 'Expense') : 'Transfer'}
                                        </h4>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                            {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {t.category || 'General'}
                                        </p>
                                    </div>
                                </div>
                                <span style={{
                                    fontWeight: '700',
                                    fontSize: '0.95rem',
                                    color: t.type === 'income' ? 'var(--income)' : 'var(--text-primary)'
                                }}>
                                    {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Space for Bottom Nav */}
            <div style={{ height: '20px' }}></div>

            {/* Peek Overlay (Centered) */}
            {peekData && (
                <div
                    onClick={() => setPeekData(null)}
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(16px)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                        animation: 'slideUp 0.2s ease-out'
                    }}
                >
                    <div className="glass-card" style={{
                        padding: '40px 24px',
                        textAlign: 'center',
                        width: '100%',
                        maxWidth: '600px',
                        margin: '0 auto',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                        borderRadius: '24px'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-secondary)' }}>{peekData.title}</h3>
                            <button onClick={() => setPeekData(null)} style={{ background: 'var(--glass)', color: 'var(--text-muted)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <X size={16} />
                            </button>
                        </div>
                        <div style={{
                            width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 20px',
                            background: peekData.type === 'expense' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {peekData.type === 'expense' ? <TrendingDown size={32} color="var(--expense)" /> : <TrendingUp size={32} color="var(--income)" />}
                        </div>
                        <h2 style={{
                            fontSize: '3rem', fontWeight: '800', letterSpacing: '-1px',
                            color: peekData.type === 'balance' ? 'var(--text-primary)' : (peekData.isIncome ? 'var(--income)' : 'var(--expense)')
                        }}>
                            {peekData.type === 'expense' && '-'}{peekData.type === 'income' && '+'}₹{peekData.amount.toLocaleString()}
                        </h2>
                    </div>
                </div>
            )}
            {/* Budget Modal */}
            {showBudgetModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(12px)',
                        zIndex: 1100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }}
                >
                    <div className="glass-card" style={{
                        padding: '30px',
                        width: '100%',
                        maxWidth: '400px',
                        borderRadius: '24px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                        background: 'var(--bg-card)'
                    }}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Set Monthly Budget</h3>
                            <button onClick={() => setShowBudgetModal(false)} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="mb-6">
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Budget Amount (₹)</label>
                            <input 
                                type="number" 
                                value={newBudgetVal}
                                onChange={(e) => setNewBudgetVal(e.target.value)}
                                placeholder="Enter amount..."
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    borderRadius: '14px',
                                    background: 'var(--glass)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border)',
                                    fontSize: '1.1rem',
                                    fontWeight: '600'
                                }}
                            />
                        </div>
                        <button 
                            onClick={handleUpdateBudget}
                            style={{
                                width: '100%',
                                padding: '16px',
                                borderRadius: '14px',
                                background: 'var(--primary-gradient)',
                                color: 'white',
                                fontWeight: '700',
                                border: 'none',
                                boxShadow: '0 8px 16px -4px rgba(139, 92, 246, 0.4)'
                            }}
                        >
                            Save Budget
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
