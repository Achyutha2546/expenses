import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { getPendingCount, getCached } from '../utils/api';
import SyncIndicator from '../components/SyncIndicator';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    TrendingUp,
    TrendingDown,
    Wallet,
    CreditCard,
    LogOut,
    X,
    ChevronRight,
    Settings,
    Sun,
    Moon,
    Download,
    Target,
    Edit2,
    Zap,
    ThumbsUp,
    AlertCircle,
    Bell,
    RefreshCw
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

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
                setTimeout(() => setIsRefreshing(false), 300);
            }
        }
    };

    useEffect(() => {
        fetchData(hasCachedData);
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallBtn(true);
        };
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

    if (loading) {
        return (
            <div className="container select-none">
                {/* Header Skeleton */}
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                        <div className="space-y-2">
                            <div className="w-16 h-3.5 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                            <div className="w-28 h-5 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                </div>

                {/* Balance Card Skeleton */}
                <div className="w-full h-44 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 mb-8 animate-pulse" />

                {/* Grid Skeletons */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="h-28 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 animate-pulse" />
                    <div className="h-28 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 animate-pulse" />
                </div>

                {/* Budget card skeleton */}
                <div className="w-full h-36 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 mb-8 animate-pulse" />
            </div>
        );
    }

    return (
        <div className="container relative min-h-screen">
            {/* Sync Indicator */}
            <SyncIndicator />

            {/* Offline Notification Banner */}
            {!isOnline && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2 text-xs font-semibold text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span>Offline Mode — Cached data active {getPendingCount() > 0 ? `(${getPendingCount()} updates pending sync)` : ''}</span>
                </div>
            )}

            {/* Header Greeting Section */}
            <header className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 ring-2 ring-slate-700/50 overflow-hidden shadow-premium">
                        <img src={user?.photoURL || 'https://i.pravatar.cc/100'} alt="profile" className="object-cover w-full h-full" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium">{getGreeting()},</p>
                        <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                            {user?.name || user?.email?.split('@')[0] || 'Member'}
                        </h1>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {showInstallBtn && (
                        <button 
                            onClick={handleInstallClick} 
                            className="w-10 h-10 rounded-xl bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center shadow-glow transition-all active:scale-95"
                            title="Install Application"
                        >
                            <Download size={18} />
                        </button>
                    )}
                    <button 
                        onClick={() => fetchData(true)} 
                        disabled={isRefreshing}
                        className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
                        title="Force Synchronize Data"
                    >
                        <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
                    </button>
                    <Link 
                        to="/account"
                        className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 flex items-center justify-center transition-all active:scale-95"
                        title="Settings"
                    >
                        <Settings size={18} />
                    </Link>
                </div>
            </header>

            {/* Smart Engagement Banner */}
            <div className="mb-6">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-brand-500/5 blur-xl pointer-events-none" />
                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-lg flex-shrink-0">
                        {budgetStatus < 50 ? '✨' : (budgetStatus < 100 ? '🛡️' : '⚠️')}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">{getPersonalMessage()}</p>
                        <p className="text-[10px] text-slate-500 font-bold mt-0.5 uppercase tracking-wide">
                            Active budget status checklist
                        </p>
                    </div>
                </div>
            </div>

            {/* Premium Credit Card Balance Module */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Visual Credit Card */}
                <div className="lg:col-span-2 relative rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 p-6 md:p-8 text-left overflow-hidden shadow-premium group">
                    {/* Decorative glowing backdrops */}
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute left-1/3 bottom-[-40px] w-36 h-36 bg-black/15 rounded-full blur-xl" />

                    <div className="relative z-10 flex flex-col justify-between h-full min-h-[140px]">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-[11px] font-bold text-brand-200 uppercase tracking-widest">Active Balance</span>
                                <h2 className="text-3xl md:text-4xl font-extrabold mt-1 text-slate-900 dark:text-white tracking-tight">
                                    ₹{balance.toLocaleString('en-IN')}
                                </h2>
                            </div>
                            <span className="px-3 py-1 rounded-lg bg-white/10 text-slate-900 dark:text-white font-black text-xs tracking-wider backdrop-blur-sm border border-white/10">
                                VISA
                            </span>
                        </div>
                        
                        <div className="flex justify-between items-end mt-8">
                            <span className="text-sm font-semibold text-brand-200 tracking-wider">•••• 5512</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-300">Premium Account</span>
                        </div>
                    </div>
                </div>

                {/* Instant Actions Column */}
                <div className="flex flex-col justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-premium">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Quick Actions</span>
                    
                    <div className="grid grid-cols-3 gap-3 my-2">
                        <button 
                            onClick={() => navigate('/add', { state: { defaultType: 'expense' } })}
                            className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/15 text-rose-450 hover:bg-rose-500/15 flex flex-col items-center gap-1.5 transition-all hover:scale-105 active:scale-95 font-semibold text-xs"
                        >
                            <TrendingDown size={20} />
                            <span>Expense</span>
                        </button>
                        <button 
                            onClick={() => navigate('/add', { state: { defaultType: 'income' } })}
                            className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/15 text-emerald-450 hover:bg-emerald-500/15 flex flex-col items-center gap-1.5 transition-all hover:scale-105 active:scale-95 font-semibold text-xs"
                        >
                            <TrendingUp size={20} />
                            <span>Income</span>
                        </button>
                        <button 
                            onClick={() => navigate('/add', { state: { defaultType: 'transfer' } })}
                            className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/15 text-blue-450 hover:bg-blue-500/15 flex flex-col items-center gap-1.5 transition-all hover:scale-105 active:scale-95 font-semibold text-xs"
                        >
                            <Plus size={20} />
                            <span>Transfer</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Monthly Budget Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 mb-8 shadow-premium relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center shadow-glow">
                            <Target size={20} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Monthly Budget</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            setNewBudgetVal(budget.amount || '');
                            setShowBudgetModal(true);
                        }}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-850 hover:border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 hover:bg-white dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
                    >
                        <Edit2 size={12} /> Edit
                    </button>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-end text-xs font-bold">
                        <span className="text-slate-600 dark:text-slate-400">Spent: <span className="text-slate-800 dark:text-slate-200 font-black">₹{(budget.totalSpent || 0).toLocaleString()}</span></span>
                        <span className={budget.amount > 0 ? "text-brand-400 font-black text-sm" : "text-slate-650"}>
                            {budget.amount > 0 ? `Limit: ₹${budget.amount.toLocaleString()}` : 'Set Spending Limit'}
                        </span>
                    </div>

                    {/* Progress Fill */}
                    <div className="w-full h-3 bg-slate-50 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-850/80 p-[2px]">
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                                isOverBudget 
                                    ? 'bg-gradient-to-r from-rose-500 to-red-600' 
                                    : budgetStatus >= 85 
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                                        : 'bg-gradient-to-r from-brand-500 to-indigo-500'
                            }`}
                            style={{ width: `${Math.min(budgetStatus, 100)}%` }}
                        />
                    </div>

                    <div className="flex justify-between items-center pt-1.5">
                        <p className="text-xs text-slate-500 font-medium">
                            {budget.amount > 0 ? (
                                isOverBudget 
                                    ? `Exceeded by ₹${(budget.totalSpent - budget.amount).toLocaleString()}` 
                                    : `₹${(budget.amount - (budget.totalSpent || 0)).toLocaleString()} remaining`
                            ) : 'Set a limit to start monitoring progress'}
                        </p>
                        {budgetStatus >= 100 && (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] font-extrabold uppercase text-rose-400">
                                Overspent
                            </span>
                        )}
                        {budgetStatus >= 80 && budgetStatus < 100 && (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-extrabold uppercase text-amber-400">
                                Warning ({budgetStatus.toFixed(0)}%)
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Savings Goals Preview Component */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Active Goals</h3>
                    <button 
                        onClick={() => navigate('/goals')}
                        className="text-xs font-bold text-brand-400 hover:text-brand-350 flex items-center gap-1"
                    >
                        See All <ChevronRight size={14} />
                    </button>
                </div>

                {goals && goals.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-3 snap-x scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                        {goals.slice(0, 3).map((goal) => (
                            <div 
                                key={goal._id} 
                                onClick={() => navigate('/goals')}
                                className="min-w-[210px] p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-premium snap-start cursor-pointer hover:border-slate-300 dark:border-slate-700 transition-all hover:scale-[1.01]"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div 
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                                        style={{ background: `${goal.color}15`, color: goal.color }}
                                    >
                                        {goal.icon}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate">{goal.name}</p>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">{goal.progress.toFixed(0)}% Saved</p>
                                    </div>
                                </div>
                                
                                <div className="w-full h-1.5 bg-slate-50 dark:bg-slate-950 rounded-full overflow-hidden mb-3">
                                    <div 
                                        className="h-full rounded-full"
                                        style={{ width: `${goal.progress}%`, background: goal.color }}
                                    />
                                </div>
                                <p className="text-sm font-black text-slate-800 dark:text-slate-200">₹{goal.savedAmount.toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div 
                        onClick={() => navigate('/goals')}
                        className="p-6 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 cursor-pointer hover:bg-white dark:bg-slate-900/50 transition-colors"
                    >
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Set a target savings goal</p>
                    </div>
                )}
            </div>

            {/* Smart Financial Insights Module */}
            {insights && insights.cards && insights.cards.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">Insights & Alerts</h3>
                    <div className="flex gap-4 overflow-x-auto pb-3 snap-x scrollbar-thin">
                        {insights.cards.map((card) => (
                            <div
                                key={card.id}
                                className={`min-w-[280px] p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-premium snap-start flex flex-col justify-between`}
                            >
                                <div className="flex justify-between items-start gap-4 mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{card.icon}</span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">{card.title}</span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-400 text-[9px] font-black uppercase">
                                        {card.value}
                                    </span>
                                </div>
                                {card.highlight && (
                                    <p className="text-sm font-extrabold text-slate-100 mb-1.5">{card.highlight}</p>
                                )}
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{card.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Accounts ledger section */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">My Accounts</h3>
                    <Link to="/sources" className="text-xs font-bold text-brand-400 hover:text-brand-350">Manage Accounts</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {sources.slice(0, 3).map((s) => {
                        const sBal = totals.sources[s._id.toString()] || 0;
                        return (
                            <div 
                                key={s._id} 
                                onClick={() => setPeekData({ title: s.name, amount: sBal, type: sBal >= 0 ? 'income' : 'expense' })}
                                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-premium hover:border-slate-300 dark:border-slate-700 transition-colors flex items-center justify-between cursor-pointer group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-950/65 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:text-brand-400 group-hover:bg-brand-600/10 transition-colors">
                                        <CreditCard size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{s.name}</h4>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Deposit account</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-xs font-black text-slate-700 dark:text-slate-300">₹{sBal.toLocaleString()}</span>
                                    <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-450 transition-colors" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recent Ledger Activity */}
            <div className="mb-20">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Recent Activities</h3>
                    <Link to="/history" className="text-xs font-bold text-brand-400 hover:text-brand-350">View Ledger</Link>
                </div>
                
                {transactions.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/35">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">No recent transactions recorded</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transactions
                            .filter(t => t.purpose !== 'Transfer In')
                            .slice(0, 5)
                            .map((t) => (
                                <div 
                                    key={t._id} 
                                    onClick={() => setPeekData({ title: t.purpose || t.source || 'Transaction details', amount: t.amount, type: t.type, date: t.date, details: t })}
                                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-premium flex justify-between items-center hover:border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                            t.type === 'income' 
                                                ? 'bg-emerald-500/10 text-emerald-450' 
                                                : t.type === 'expense'
                                                    ? 'bg-rose-500/10 text-rose-450'
                                                    : 'bg-blue-500/10 text-blue-450'
                                        }`}>
                                            {t.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                                {t.type === 'income' ? (t.source || 'Income Source') : t.type === 'expense' ? (t.purpose || 'Expense Purposed') : 'Internal Ledger Transfer'}
                                            </h4>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                                                {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {new Date(t.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-sm font-black ${
                                        t.type === 'income' ? 'text-emerald-450' : 'text-slate-800 dark:text-slate-200'
                                    }`}>
                                        {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                    </div>
                )}
            </div>

            {/* Mobile quick transaction FAB triggers navigation to transaction creation */}
            <button
                onClick={() => navigate('/add')}
                className="md:hidden fixed bottom-20 right-6 w-14 h-14 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-glow hover:scale-105 active:scale-95 transition-all flex items-center justify-center z-45"
                title="Add Transaction Entry"
            >
                <Plus size={26} strokeWidth={2.5} />
            </button>

            {/* Quick Peek Detail Overlay Modal */}
            <AnimatePresence>
                {peekData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setPeekData(null)}
                        className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 15 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 15 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-premium relative overflow-hidden text-center"
                        >
                            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-500 to-indigo-500" />
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">{peekData.title}</h3>
                                <button onClick={() => setPeekData(null)} className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-500 hover:text-slate-350 transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                            
                            <div className={`w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center text-lg ${
                                peekData.type === 'expense' 
                                    ? 'bg-rose-500/10 text-rose-400' 
                                    : 'bg-emerald-500/10 text-emerald-450'
                            }`}>
                                {peekData.type === 'expense' ? <TrendingDown size={28} /> : <TrendingUp size={28} />}
                            </div>
                            
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                                {peekData.type === 'expense' && '-'}{peekData.type === 'income' && '+'}₹{peekData.amount.toLocaleString()}
                            </h2>
                            
                            {peekData.date && (
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mt-3">
                                    {new Date(peekData.date).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Budget Configuration Dialog Modal */}
            <AnimatePresence>
                {showBudgetModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 15 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 15 }}
                            className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-premium relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-500 to-indigo-500" />
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Configure Budget</h3>
                                <button onClick={() => setShowBudgetModal(false)} className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-500 hover:text-slate-350 transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="space-y-2 mb-6">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">Monthly Budget Limit (₹)</label>
                                <input 
                                    type="number" 
                                    value={newBudgetVal}
                                    onChange={(e) => setNewBudgetVal(e.target.value)}
                                    placeholder="Enter budget cap..."
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-slate-800 dark:text-slate-200 text-sm font-bold placeholder-slate-700 transition-colors"
                                />
                            </div>
                            <button 
                                onClick={handleUpdateBudget}
                                className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-extrabold shadow-glow hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                            >
                                Apply Budget
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;
