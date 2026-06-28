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
                <div className="offline-banner">
                    <div className="offline-banner-dot"></div>
                    <span className="offline-banner-text">Offline — using cached data{getPendingCount() > 0 ? ` · ${getPendingCount()} pending` : ''}</span>
                </div>
            )}

            {/* Richie Jimenez Style Header */}
            <header className="page-header">
                <div className="flex items-center gap-4">
                    <div className="dashboard-avatar">
                        <img src={user?.photoURL || 'https://i.pravatar.cc/100'} alt="profile" />
                    </div>
                    <div>
                        <p className="text-meta">Welcome,</p>
                        <h1 className="text-primary font-bold text-lg">{user?.name || user?.email?.split('@')[0] || 'User Profile'}</h1>
                    </div>
                </div>
                <button onClick={() => fetchData(true)} className="btn-icon">
                    <History size={20} />
                </button>
            </header>
            <div className="flex gap-2 mb-6">
                {showInstallBtn && (
                    <button
                        onClick={handleInstallClick}
                        className="btn-icon btn-icon-lg btn-primary"
                    >
                        <Download size={20} />
                    </button>
                )}
                <button
                    onClick={toggleTheme}
                    className="btn-icon btn-icon-lg"
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
                    className="btn-icon btn-icon-lg btn-danger"
                >
                    <LogOut size={20} />
                </button>
                <Link to="/account" className="btn-icon btn-icon-lg">
                    <Settings size={20} />
                </Link>
            </div>

            {/* Personalized Engagement Card */}
            <div className="mb-8 animate-in stagger-1">
                <div className="insight-card-banner">
                    <div className="insight-card-emoji">
                        {budgetStatus < 50 ? '✨' : (budgetStatus < 100 ? '🛡️' : '⚠️')}
                    </div>
                    <div>
                        <p className="font-semibold text-base text-primary leading-snug">{getPersonalMessage()}</p>
                        <p className="text-xs text-muted mt-1">Based on your {new Date().toLocaleDateString(undefined, { month: 'long' })} activity</p>
                    </div>
                </div>
            </div>

            {/* Pill Style Balance Card */}
            <div className="balance-card-wrap">
                <div className="balance-card">
                    {/* Background Overlapping Orbs */}
                    <div className="balance-card-orb balance-card-orb-1"></div>
                    <div className="balance-card-orb balance-card-orb-2"></div>
                    <div className="balance-card-orb balance-card-orb-3"></div>

                    <div className="balance-card-content">
                        <div className="flex justify-between items-start mb-1">
                            <p className="balance-label">Balance</p>
                            <div className="balance-card-badge">VISA</div>
                        </div>
                        <h2 className="balance-amount">
                            ₹{balance.toLocaleString()}
                        </h2>
                    </div>
                    
                    <div className="balance-card-footer">
                        <p className="balance-card-dots">•••• 5512</p>
                    </div>
                </div>

                {/* Richie Jimenez Style Action Row */}
                <div className="balance-action-row">
                    <button className="balance-action-btn">
                        <Download size={22} />
                    </button>
                    <button onClick={() => navigate('/add')} className="balance-action-btn">
                        <TrendingUp size={22} style={{ transform: 'rotate(45deg)' }} />
                    </button>
                    <button onClick={() => navigate('/add')} className="balance-action-btn">
                        <Plus size={22} />
                    </button>
                    <button className="balance-action-primary">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px' }}>
                            {[1,2,3,4,5,6,7,8,9].map(i => <div key={i} style={{ width: '4px', height: '4px', background: 'white', borderRadius: '1px' }}></div>)}
                        </div>
                    </button>
                </div>
            </div>

            {/* Monthly Budget Card */}
            <div className="budget-card mb-8">
                <div className="budget-header">
                    <div className="flex items-center gap-3">
                        <div className="budget-icon-wrap">
                            <Target size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-base">Monthly Budget</h3>
                            <p className="text-xs text-muted mt-1">
                                {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            setNewBudgetVal(budget.amount || '');
                            setShowBudgetModal(true);
                        }}
                        className="btn btn-sm btn-secondary"
                    >
                        <Edit2 size={12} /> Edit
                    </button>
                </div>

                <div className="mb-4">
                    <div className="flex justify-between mb-2">
                        <span className="text-sm text-secondary">Spent: ₹{(budget.totalSpent || 0).toLocaleString()}</span>
                        <span className={`text-sm font-bold ${budget.amount > 0 ? 'text-primary' : 'text-muted'}`}>
                            {budget.amount > 0 ? `₹${budget.amount.toLocaleString()}` : 'Set Budget'}
                        </span>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${Math.min(budgetStatus, 100)}%` }}></div>
                    </div>
                </div>

                <div className="flex justify-between items-center">
                    <p className="text-xs text-muted">
                        {budget.amount > 0 ? (
                            isOverBudget 
                                ? `Exceeded by ₹${(budget.totalSpent - budget.amount).toLocaleString()}` 
                                : `₹${(budget.amount - (budget.totalSpent || 0)).toLocaleString()} remaining`
                        ) : 'Keep your spending in check'}
                    </p>
                    {budgetStatus >= 100 && (
                        <div className="alert alert-danger">Budget Exceeded</div>
                    )}
                    {budgetStatus >= 80 && budgetStatus < 100 && (
                        <div className="alert alert-warning">Approaching Limit ({budgetStatus.toFixed(0)}%)</div>
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
                                className="glass-card goal-card flex items-center justify-center" 
                                onClick={() => navigate('/goals')}
                            >
                                <Plus size={24} className="text-gray-400" />
                            </div>
                        )}
                    </div>
                ) : (
                    <div 
                        className="glass-card p-6 text-center rounded-[24px] border-dashed"
                        onClick={() => navigate('/goals')}
                    >
                        <p className="text-sm text-gray-500 font-medium">Set your first savings goal</p>
                    </div>
                )}
            </div>

            {/* Smart Insights Section */}
            {insights && (
                <div className="mb-8 animate-in stagger-3">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="section-title">Smart Insights</h3>
                        <div className="badge badge-primary">
                            {insights.cards?.length || 0} INSIGHTS
                        </div>
                    </div>

                    {insights.cards && insights.cards.length > 0 ? (
                        <div className="insight-cards-scroll">
                            {insights.cards.map((card, idx) => {
                                return (
                                    <div
                                        key={card.id}
                                        className={`insight-card glass-card tag-${card.type || 'neutral'}`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{card.icon}</span>
                                                <span className="text-xs font-bold uppercase tracking-wider">{card.title}</span>
                                            </div>
                                            <div className="badge badge-primary">
                                                {card.value}
                                            </div>
                                        </div>

                                        {card.highlight && (
                                            <p className="text-base font-bold text-primary mb-2">
                                                {card.highlight}
                                            </p>
                                        )}

                                        <p className="text-xs text-secondary leading-normal">
                                            {card.description}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* Fallback: legacy single-card */
                        <div className="insight-card-banner">
                            <div className="insight-card-emoji">
                                {insights.trend === 'up' ? <AlertCircle size={24} color="var(--expense)" /> : (insights.trend === 'down' ? <ThumbsUp size={24} color="var(--income)" /> : <Zap size={24} color="var(--primary)" />)}
                            </div>
                            <div style={{ flex: 1 }}>
                                <p className="font-semibold text-sm text-primary">{insights.message}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Quick Actions Grid */}
            <div className="mb-10">
                <div className="flex justify-between items-center mb-4 px-1">
                    <h3 className="section-title">Shortcuts</h3>
                </div>
                <div className="shortcuts-grid">
                    {[
                        { to: '/sources', icon: Wallet, label: 'Wallet', iconColor: 'var(--primary)' },
                        { to: '/history', icon: History, label: 'Activity', iconColor: 'var(--income)' },
                        { to: '/account', icon: Settings, label: 'Settings', iconColor: 'var(--expense)' }
                    ].map((btn, i) => (
                        <div key={i}>
                            <Link 
                                to={btn.to} 
                                className="shortcut-btn-wrap"
                            >
                                <div className="shortcut-btn">
                                    <btn.icon size={26} color={btn.iconColor} />
                                </div>
                                <span className="shortcut-label">{btn.label}</span>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>

            {/* Install Prompt Banner (Only when standalone isn't active) */}
            {showInstallBtn && isOnline && (
                <div className="install-banner">
                    <div className="flex items-center gap-3">
                        <div className="install-banner-icon">
                            <Rocket size={24} color="white" />
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-sm">Install App</h4>
                            <p className="text-white/80 text-xs">Add to home screen for quick access</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleInstallClick}
                        className="btn btn-sm btn-secondary"
                    >
                        Install
                    </button>
                </div>
            )}

            {/* My Accounts Section */}
            <div className="mb-10">
                <div className="flex justify-between items-center mb-4 px-1">
                    <h3 className="section-title">My Accounts</h3>
                    <Link to="/sources" className="section-link">See All</Link>
                </div>
                <div className="flex flex-col gap-3">
                    {sources.slice(0, 3).map((s) => (
                        <div key={s._id} className="account-list-item" onClick={() => setPeekData({ title: s.name, amount: totals.sources[s._id.toString()] || 0, type: 'account', isIncome: true })}>
                            <div className="flex items-center gap-4">
                                <div className="account-list-icon">
                                    <CreditCard size={20} />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-base">{s.name}</h4>
                                    <p className="text-xs text-muted">Primary Account</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <p className="font-semibold text-base">****</p>
                                <ChevronRight size={16} className="text-muted" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Transactions Peek */}
            <div className="mb-20">
                <div className="flex justify-between items-center mb-4 px-1">
                    <h3 className="section-title">Recent Activity</h3>
                    <Link to="/history" className="section-link">View History</Link>
                </div>
                {transactions.length === 0 ? (
                    <div className="empty-state glass-card">
                        <div className="empty-state-icon">
                            <TrendingUp size={40} />
                        </div>
                        <h4>No activity yet</h4>
                        <p>
                            Start tracking your finances by adding your first income or expense!
                        </p>
                        <button 
                            onClick={() => navigate('/add')}
                            className="btn btn-primary"
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
                    className="modal-overlay"
                >
                    <div className="modal-content text-center p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-secondary font-semibold text-base">{peekData.title}</h3>
                            <button onClick={() => setPeekData(null)} className="btn-icon">
                                <X size={16} />
                            </button>
                        </div>
                        <div style={{
                            width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 20px',
                            background: peekData.type === 'expense' ? 'var(--expense-light)' : 'var(--income-light)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {peekData.type === 'expense' ? <TrendingDown size={32} color="var(--expense)" /> : <TrendingUp size={32} color="var(--income)" />}
                        </div>
                        <h2 className="text-3xl font-black text-primary">
                            {peekData.type === 'expense' && '-'}{peekData.type === 'income' && '+'}₹{peekData.amount.toLocaleString()}
                        </h2>
                    </div>
                </div>
            )}
            {/* Budget Modal */}
            {showBudgetModal && (
                <div className="modal-overlay">
                    <div className="modal-content p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg">Set Monthly Budget</h3>
                            <button onClick={() => setShowBudgetModal(false)} className="btn-icon">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="form-group mb-6">
                            <label className="form-label">Budget Amount (₹)</label>
                            <input 
                                type="number" 
                                value={newBudgetVal}
                                onChange={(e) => setNewBudgetVal(e.target.value)}
                                placeholder="Enter amount..."
                                className="amount-input"
                            />
                        </div>
                        <button 
                            onClick={handleUpdateBudget}
                            className="submit-btn"
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

