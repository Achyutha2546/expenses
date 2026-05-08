import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { getPendingCount, getCached } from '../utils/api';
import SyncIndicator from '../components/SyncIndicator';
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
    // Instant hydration from cache — no network wait
    const [transactions, setTransactions] = useState(() => getCached('/transactions') || []);
    const [sources, setSources] = useState(() => getCached('/sources') || []);
    const [budget, setBudget] = useState(() => getCached('/get-budget') || { amount: 0 });
    const [insights, setInsights] = useState(() => getCached('/analytics/insights') || null);

    // Only show skeleton if we have ZERO cached data (first-ever load)
    const hasCachedData = getCached('/transactions') !== null;
    const [loading, setLoading] = useState(!hasCachedData);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [goals, setGoals] = useState(() => getCached('/goals') || []);

    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showBreakdown, setShowBreakdown] = useState(false);
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [peekData, setPeekData] = useState(null);
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [newBudgetVal, setNewBudgetVal] = useState('');
    const navigate = useNavigate();
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallBtn, setShowInstallBtn] = useState(false);

    const fetchData = async (isBackground = false) => {
        if (isBackground) setIsRefreshing(true);
        try {
            const [transRes, sourcesRes, budgetRes, insightsRes, goalsRes] = await Promise.all([
                api.get('/transactions'),
                api.get('/sources'),
                api.get('/get-budget'),
                api.get('/analytics/insights'),
                api.get('/goals')
            ]);
            setTransactions(transRes.data);
            setSources(sourcesRes.data);
            setBudget(budgetRes.data);
            setInsights(insightsRes.data);
            setGoals(goalsRes.data);
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
            if (isBackground) {
                // Brief delay so the refresh shimmer is perceptible
                setTimeout(() => setIsRefreshing(false), 300);
            }
        }
    };

    useEffect(() => {
        // If we have cached data, fetch in background (user sees cached instantly)
        // If no cache, fetch normally (user sees skeleton)
        fetchData(hasCachedData);
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallBtn(true);
        };
        // Auto-refresh when offline data finishes syncing
        const handleSyncComplete = () => {
            console.log('[Dashboard] Sync complete — refreshing data');
            fetchData(true);
        };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('sync-complete', handleSyncComplete);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('sync-complete', handleSyncComplete);
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
            const res = await api.post('/set-budget', { amount: parseFloat(newBudgetVal) });
            fetchData(true);
            setShowBudgetModal(false);
            setNewBudgetVal('');
        } catch (err) {
            console.error('Error updating budget', err);
        }
    };

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'Good morning';
        if (hour >= 12 && hour < 17) return 'Good afternoon';
        if (hour >= 17 && hour < 21) return 'Good evening';
        return 'Good night';
    };

    const getPersonalMessage = () => {
        if (!budget.amount || budget.amount === 0) return "Start your journey by setting a monthly budget.";
        if (budgetStatus < 50) return "You're spending wisely this week. Keep it up!";
        if (budgetStatus < 80) return "You're doing well, but keep an eye on those extra expenses.";
        if (budgetStatus < 100) return "You're approaching your budget limit. Spend carefully!";
        return "Budget exceeded. Time to review your spending habits.";
    };

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

    const budgetStatus = budget.amount > 0 ? (budget.totalSpent / budget.amount) * 100 : 0;
    const isOverBudget = budget.isOverBudget;

    const balance = budget.userBalance !== undefined ? budget.userBalance : (totals.income - totals.expense);

    if (loading) return (
        <div className="container animate-in">
            {/* Skeleton Header */}
            <header className="flex justify-between items-center mb-6" style={{ padding: '0 4px' }}>
                <div className="flex items-center gap-3">
                    <div className="skeleton" style={{ width: '44px', height: '44px', borderRadius: '14px' }} />
                    <div>
                        <div className="skeleton" style={{ width: '60px', height: '10px', borderRadius: '4px', marginBottom: '6px' }} />
                        <div className="skeleton" style={{ width: '120px', height: '16px', borderRadius: '6px' }} />
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '12px' }} />
                    <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '12px' }} />
                </div>
            </header>

            {/* Skeleton Balance Card */}
            <div className="mb-10">
                <div className="skeleton" style={{ height: '160px', borderRadius: '28px', marginBottom: '16px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="skeleton" style={{ height: '100px', borderRadius: '24px' }} />
                    <div className="skeleton" style={{ height: '100px', borderRadius: '24px' }} />
                </div>
            </div>

            {/* Skeleton Budget Card */}
            <div className="skeleton" style={{ height: '140px', borderRadius: '24px', marginBottom: '32px' }} />

            {/* Skeleton Insights */}
            <div className="skeleton" style={{ height: '90px', borderRadius: '24px', marginBottom: '32px' }} />

            {/* Skeleton Shortcuts */}
            <div style={{ marginBottom: '40px' }}>
                <div className="skeleton" style={{ width: '100px', height: '16px', borderRadius: '6px', marginBottom: '16px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div className="skeleton" style={{ aspectRatio: '1/1', borderRadius: '20px' }} />
                    <div className="skeleton" style={{ aspectRatio: '1/1', borderRadius: '20px' }} />
                    <div className="skeleton" style={{ aspectRatio: '1/1', borderRadius: '20px' }} />
                </div>
            </div>

            {/* Skeleton Transactions */}
            <div>
                <div className="skeleton" style={{ width: '140px', height: '16px', borderRadius: '6px', marginBottom: '16px' }} />
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3" style={{ borderBottom: '1px solid var(--border)' }}>
                        <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                            <div className="skeleton" style={{ width: '60%', height: '14px', borderRadius: '4px', marginBottom: '6px' }} />
                            <div className="skeleton" style={{ width: '40%', height: '10px', borderRadius: '4px' }} />
                        </div>
                        <div className="skeleton" style={{ width: '60px', height: '16px', borderRadius: '6px' }} />
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className={`container animate-in${isRefreshing ? ' dashboard-refreshing' : ''}`}>
            {/* Sync Indicator */}
            <SyncIndicator />

            {/* Offline Banner */}
            {!isOnline && (
                <div style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', animation: 'pulse 2s infinite' }}></div>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#f59e0b' }}>Offline — using cached data{getPendingCount() > 0 ? ` · ${getPendingCount()} pending` : ''}</span>
                </div>
            )}

            {/* Richie Jimenez Style Header */}
            <header className="flex justify-between items-center mb-8 px-1">
                <div className="flex items-center gap-4">
                    <div style={{ width: '48px', height: '48px', borderRadius: '16px', overflow: 'hidden' }}>
                        <img src={user?.photoURL || 'https://i.pravatar.cc/100'} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '500' }}>Welcome,</p>
                        <h1 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{user?.name || user?.email?.split('@')[0] || 'User Profile'}</h1>
                    </div>
                </div>
                <button onClick={() => fetchData(true)} style={{ color: 'var(--text-primary)', background: 'transparent' }}>
                    <History size={22} />
                </button>
            </header>
            <div className="flex gap-2 mb-6">
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

            {/* Personalized Engagement Card */}
            <div className="mb-8 animate-in" style={{ animationDelay: '0.1s' }}>
                <div className="glass-card" style={{ 
                    padding: '20px', 
                    borderRadius: '24px', 
                    background: 'var(--glass)', 
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: '16px', 
                        background: 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        flexShrink: 0
                    }}>
                        {budgetStatus < 50 ? '✨' : (budgetStatus < 100 ? '🛡️' : '⚠️')}
                    </div>
                    <div>
                        <p style={{ fontSize: '0.9rem', fontWeight: '700', lineHeight: '1.4' }}>{getPersonalMessage()}</p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: '500' }}>Based on your {new Date().toLocaleDateString(undefined, { month: 'long' })} activity</p>
                    </div>
                </div>
            </div>

            {/* Pill Style Balance Card */}
            <div className="mb-10">
                <div style={{
                    height: '240px',
                    background: '#00c389',
                    borderRadius: '44px',
                    padding: '32px',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    marginBottom: '20px'
                }}>
                    {/* Background Overlapping Pills */}
                    <div style={{ position: 'absolute', top: '-40px', left: '-20px', width: '160px', height: '160px', background: '#bbf7d0', borderRadius: '80px', opacity: 0.8 }}></div>
                    <div style={{ position: 'absolute', top: '10px', right: '-40px', width: '200px', height: '200px', background: '#bbf7d0', borderRadius: '100px', opacity: 0.8 }}></div>
                    <div style={{ position: 'absolute', bottom: '-60px', left: '100px', width: '180px', height: '180px', background: '#bbf7d0', borderRadius: '90px', opacity: 0.8 }}></div>

                    <div style={{ position: 'relative', zIndex: 10 }}>
                        <div className="flex justify-between items-start mb-1">
                            <p style={{ color: 'black', fontSize: '0.9rem', fontWeight: '500' }}>Balance</p>
                            <div style={{ background: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '0.6rem', fontWeight: '900' }}>VISA</div>
                        </div>
                        <h2 style={{ color: 'black', fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-1px' }}>
                            ₹{balance.toLocaleString()}
                        </h2>
                        <p style={{ color: 'black', fontSize: '0.75rem', fontWeight: '500', marginTop: '10px', opacity: 0.6 }}>•••• 5512</p>
                    </div>
                </div>

                {/* Richie Jimenez Style Action Row */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button style={{ width: '56px', height: '56px', borderRadius: '20px', background: 'white', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Download size={22} color="black" />
                    </button>
                    <button onClick={() => navigate('/add')} style={{ width: '56px', height: '56px', borderRadius: '20px', background: 'white', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingUp size={22} color="black" style={{ transform: 'rotate(45deg)' }} />
                    </button>
                    <button onClick={() => navigate('/add')} style={{ width: '56px', height: '56px', borderRadius: '20px', background: 'white', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Plus size={22} color="black" />
                    </button>
                    <button style={{ flex: 1, height: '56px', borderRadius: '20px', background: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px' }}>
                            {[1,2,3,4,5,6,7,8,9].map(i => <div key={i} style={{ width: '4px', height: '4px', background: 'white', borderRadius: '1px' }}></div>)}
                        </div>
                    </button>
                </div>
            </div>

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
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Spent: ₹{(budget.totalSpent || 0).toLocaleString()}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: budget.amount > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {budget.amount > 0 ? `₹${budget.amount.toLocaleString()}` : 'Set Budget'}
                        </span>
                    </div>
                    <div className="progress-bar">
  <div className="progress-fill" style={{ width: `${Math.min(budgetStatus, 100)}%`, background: isOverBudget ? 'var(--expense)' : 'var(--income)' }}></div>
</div>
                </div>

                <div className="flex justify-between items-center">
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {budget.amount > 0 ? (
                            isOverBudget 
                                ? `Exceeded by ₹${(budget.totalSpent - budget.amount).toLocaleString()}` 
                                : `₹${(budget.amount - (budget.totalSpent || 0)).toLocaleString()} remaining`
                        ) : 'Keep your spending in check'}
                    </p>
                    {budgetStatus >= 100 && (
  <div className="alert-danger">Budget Exceeded</div>
)}
{budgetStatus >= 80 && budgetStatus < 100 && (
  <div className="alert-warning">Approaching Limit ({budgetStatus.toFixed(0)}% used)</div>
)}
                </div>
            </div>

            {/* Savings Goals Preview */}
            <div className="mb-8 animate-in" style={{ animationDelay: '0.05s' }}>
                <div className="flex justify-between items-center mb-4">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>Savings Goals</h3>
                    <button 
                        onClick={() => navigate('/goals')}
                        style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '700' }}
                        className="flex items-center gap-1"
                    >
                        View All <ChevronRight size={14} />
                    </button>
                </div>

                {goals && goals.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {goals.slice(0, 3).map((goal) => (
                            <div 
                                key={goal._id} 
                                className="glass-card" 
                                onClick={() => navigate('/goals')}
                                style={{ 
                                    minWidth: '200px', 
                                    padding: '16px', 
                                    borderRadius: '24px', 
                                    position: 'relative',
                                    cursor: 'pointer'
                                }}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div 
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                                        style={{ background: `${goal.color}15`, color: goal.color }}
                                    >
                                        {goal.icon}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-xs font-bold truncate">{goal.name}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">{goal.progress.toFixed(0)}% Complete</p>
                                    </div>
                                </div>
                                <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
                                    <div 
                                        className="h-full rounded-full"
                                        style={{ width: `${goal.progress}%`, background: goal.color }}
                                    />
                                </div>
                                <p className="text-sm font-black">₹{goal.savedAmount.toLocaleString()}</p>
                            </div>
                        ))}
                        {goals.length > 3 && (
                            <div 
                                className="glass-card flex items-center justify-center" 
                                onClick={() => navigate('/goals')}
                                style={{ minWidth: '100px', borderRadius: '24px', cursor: 'pointer' }}
                            >
                                <Plus size={24} className="text-gray-400" />
                            </div>
                        )}
                    </div>
                ) : (
                    <div 
                        className="glass-card p-6 text-center rounded-[24px]"
                        onClick={() => navigate('/goals')}
                        style={{ cursor: 'pointer', borderStyle: 'dashed' }}
                    >
                        <p className="text-sm text-gray-500 font-medium">Set your first savings goal</p>
                    </div>
                )}
            </div>

            {/* Smart Insights Section */}
            {insights && (
                <div className="mb-8 animate-in" style={{ animationDelay: '0.1s' }}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>Smart Insights</h3>
                        <div style={{ background: 'var(--glass)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700', border: '1px solid var(--border)' }}>
                            {insights.cards?.length || 0} INSIGHTS
                        </div>
                    </div>

                    {insights.cards && insights.cards.length > 0 ? (
                        <div className="insight-cards-scroll">
                            {insights.cards.map((card, idx) => {
                                const colorMap = {
                                    danger:  { bg: 'rgba(239, 68, 68, 0.06)', border: 'rgba(239, 68, 68, 0.15)', accent: '#ef4444', valueBg: 'rgba(239, 68, 68, 0.12)' },
                                    warning: { bg: 'rgba(245, 158, 11, 0.06)', border: 'rgba(245, 158, 11, 0.15)', accent: '#f59e0b', valueBg: 'rgba(245, 158, 11, 0.12)' },
                                    success: { bg: 'rgba(16, 185, 129, 0.06)', border: 'rgba(16, 185, 129, 0.15)', accent: '#10b981', valueBg: 'rgba(16, 185, 129, 0.12)' },
                                    info:    { bg: 'rgba(99, 102, 241, 0.06)', border: 'rgba(99, 102, 241, 0.15)', accent: '#6366f1', valueBg: 'rgba(99, 102, 241, 0.12)' },
                                    neutral: { bg: 'var(--glass)', border: 'var(--border)', accent: 'var(--text-primary)', valueBg: 'rgba(148, 163, 184, 0.1)' }
                                };
                                const colors = colorMap[card.type] || colorMap.neutral;

                                return (
                                    <div
                                        key={card.id}
                                        className="insight-card"
                                        style={{
                                            background: colors.bg,
                                            border: `1px solid ${colors.border}`,
                                            borderRadius: '20px',
                                            padding: '18px',
                                            minWidth: '260px',
                                            maxWidth: '300px',
                                            flexShrink: 0,
                                            animationDelay: `${idx * 0.05}s`
                                        }}
                                    >
                                        <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                                            <div className="flex items-center gap-2">
                                                <span style={{ fontSize: '1.25rem' }}>{card.icon}</span>
                                                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: colors.accent }}>{card.title}</span>
                                            </div>
                                            <div style={{
                                                padding: '4px 10px',
                                                borderRadius: '10px',
                                                background: colors.valueBg,
                                                fontSize: '0.85rem',
                                                fontWeight: '800',
                                                color: colors.accent,
                                                letterSpacing: '-0.3px'
                                            }}>
                                                {card.value}
                                            </div>
                                        </div>

                                        {card.highlight && (
                                            <p style={{
                                                fontSize: '1.1rem',
                                                fontWeight: '800',
                                                color: 'var(--text-primary)',
                                                marginBottom: '6px',
                                                letterSpacing: '-0.5px'
                                            }}>
                                                {card.highlight}
                                            </p>
                                        )}

                                        <p style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--text-secondary)',
                                            lineHeight: '1.5',
                                            fontWeight: '500'
                                        }}>
                                            {card.description}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* Fallback: legacy single-card */
                        <div className="glass-card" style={{
                            padding: '16px',
                            borderRadius: '24px',
                            background: insights.trend === 'up' ? 'rgba(244, 63, 94, 0.05)' : (insights.trend === 'down' ? 'rgba(16, 185, 129, 0.05)' : 'var(--glass)'),
                            border: `1px solid ${insights.trend === 'up' ? 'rgba(244, 63, 94, 0.1)' : (insights.trend === 'down' ? 'rgba(16, 185, 129, 0.1)' : 'var(--border)')}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px'
                        }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '16px',
                                background: insights.trend === 'up' ? 'rgba(244, 63, 94, 0.15)' : (insights.trend === 'down' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(139, 92, 246, 0.15)'),
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                                {insights.trend === 'up' ? <AlertCircle size={24} color="var(--expense)" /> : (insights.trend === 'down' ? <ThumbsUp size={24} color="var(--income)" /> : <Zap size={24} color="var(--primary)" />)}
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '0.85rem', fontWeight: '800', marginBottom: '2px' }}>{insights.message}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Quick Actions Grid */}
            <div className="mb-10">
                <div className="flex justify-between items-center mb-4 px-1">
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.5px' }}>Shortcuts</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    {[
                        { to: '/sources', icon: Wallet, label: 'Wallet', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
                        { to: '/history', icon: History, label: 'Activity', color: 'var(--income)', bg: 'rgba(16, 185, 129, 0.12)' },
                        { to: '/sources', icon: Settings, label: 'Settings', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' }
                    ].map((btn, i) => (
                        <div key={i}>
                            <Link 
                                to={btn.to} 
                                style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}
                            >
                                <div style={{
                                    width: '100%',
                                    aspectRatio: '1/1',
                                    borderRadius: '20px',
                                    background: btn.bg,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'transform 0.2s ease',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }} className="action-btn">
                                    <btn.icon size={26} color={btn.color} />
                                </div>
                                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)' }}>{btn.label}</span>
                            </Link>
                        </div>
                    ))}
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
                        style={{ background: 'var(--bg-card)', color: 'var(--primary)', padding: '10px 20px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '700' }}
                    >
                        Install
                    </button>
                </div>
            )}

            {/* My Accounts Section */}
            <div className="mb-10">
                <div className="flex justify-between items-center mb-4 px-1">
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.5px' }}>My Accounts</h3>
                    <Link to="/sources" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: '700' }}>See All</Link>
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
            <div className="mb-20">
                <div className="flex justify-between items-center mb-4 px-1">
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.5px' }}>Recent Activity</h3>
                    <Link to="/history" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: '700' }}>View History</Link>
                </div>
                {transactions.length === 0 ? (
                    <div className="glass-card animate-scale" style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(79, 70, 229, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <TrendingUp size={40} color="var(--primary)" opacity={0.4} />
                        </div>
                        <h4 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '8px' }}>No activity yet</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '240px', margin: '0 auto 24px', lineHeight: '1.5' }}>
                            Start tracking your finances by adding your first income or expense!
                        </p>
                        <button 
                            onClick={() => navigate('/add')}
                            style={{ background: 'var(--primary)', color: 'white', padding: '10px 24px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '700' }}
                        >
                            Get Started
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {transactions
                            .filter(t => t.purpose !== 'Transfer In')
                            .slice(0, 5)
                            .map((t, idx) => {
                                const colors = ['trans-rose', 'trans-violet', 'trans-mint', 'trans-sky'];
                                const colorClass = colors[idx % colors.length];
                                
                                return (
                                    <div key={t._id} className={`transaction-card ${colorClass}`}>
                                        <div className="flex items-center gap-4">
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '16px',
                                                background: 'rgba(255, 255, 255, 0.4)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                {t.type === 'income' ? <TrendingUp size={22} /> : <TrendingDown size={22} />}
                                            </div>
                                            <div>
                                                <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '2px' }}>
                                                    {t.type === 'income' ? (t.source || 'Income') : t.type === 'expense' ? (t.purpose || 'Expense') : 'Transfer'}
                                                </h4>
                                                <p style={{ fontSize: '0.75rem', opacity: 0.6, fontWeight: '500' }}>
                                                    Today, {new Date(t.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                </p>
                                            </div>
                                        </div>
                                        <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>
                                            {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString()}
                                        </span>
                                    </div>
                                );
                            })}
                    </div>
                )}
            </div>

            {/* Floating Action Button */}
            <button
                onClick={() => navigate('/add')}
                className="fab"
                style={{
                    position: 'fixed',
                    bottom: 'calc(80px + env(safe-area-inset-bottom, 16px))',
                    right: '20px',
                    zIndex: 90,
                    width: '60px',
                    height: '60px',
                    boxShadow: '0 12px 24px -6px rgba(79, 70, 229, 0.5)'
                }}
            >
                <Plus size={32} />
            </button>

            {/* Space for Bottom Nav */}
            <div style={{ height: '40px' }}></div>

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
