import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingDown,
    Calendar,
    ArrowUpRight,
    ArrowLeft,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
    ArrowRight,
    BarChart3,
    PieChart,
    Settings,
    Plus,
    Target
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import {
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';

const Stats = () => {
    const [filter, setFilter] = useState('monthly'); // 'daily', 'monthly', 'yearly'
    const [currentDate, setCurrentDate] = useState(new Date());
    const [displayType, setDisplayType] = useState('all'); // 'all', 'income', 'expense'
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const { logout } = useAuth();
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
            if (t.purpose === 'Transfer In' || t.purpose === 'Initial Balance Setup') return false;

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
            return true;
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

    const getGraphData = () => {
        if (filter === 'monthly') {
            const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
            const data = [];
            for (let i = 1; i <= daysInMonth; i++) {
                const dayStr = i.toString();
                const dayIncome = currentTransactions
                    .filter(t => t.type === 'income' && new Date(t.date).getDate() === i)
                    .reduce((sum, t) => sum + t.amount, 0);
                const dayExpense = currentTransactions
                    .filter(t => t.type === 'expense' && new Date(t.date).getDate() === i)
                    .reduce((sum, t) => sum + t.amount, 0);
                data.push({ name: dayStr, income: dayIncome, expense: dayExpense });
            }
            return data;
        } else if (filter === 'yearly') {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return months.map((month, idx) => {
                const monthIncome = currentTransactions
                    .filter(t => t.type === 'income' && new Date(t.date).getMonth() === idx)
                    .reduce((sum, t) => sum + t.amount, 0);
                const monthExpense = currentTransactions
                    .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === idx)
                    .reduce((sum, t) => sum + t.amount, 0);
                return { name: month, income: monthIncome, expense: monthExpense };
            });
        } else {
            return [
                { name: 'Today', income: totalIncome, expense: totalExpense }
            ];
        }
    };

    const graphData = getGraphData();

    if (loading) {
        return (
            <div className="container flex justify-center items-center min-h-[75vh]">
                <div className="w-10 h-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl text-xs font-bold shadow-premium text-center">
                    <p className="opacity-70 mb-0.5">
                        {filter === 'monthly' ? `${label} ${currentDate.toLocaleDateString(undefined, { month: 'short' })}` : label}
                    </p>
                    <p className="text-slate-900 dark:text-white">₹{payload[0].value.toLocaleString()}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="container relative pb-12 select-none">
            {/* Header */}
            <header className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 flex items-center justify-center transition-colors"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Period Analytics</h1>
                </div>
                
                <Link 
                    to="/account" 
                    className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 flex items-center justify-center transition-colors"
                    title="Account Settings"
                >
                    <Settings size={18} />
                </Link>
            </header>

            {/* Filter Bar */}
            <div className="p-1 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 flex mb-4">
                {['daily', 'monthly', 'yearly'].map((type) => (
                    <button
                        key={type}
                        onClick={() => {
                            setFilter(type);
                            setCurrentDate(new Date());
                        }}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold capitalize transition-all duration-200 ${
                            filter === type 
                                ? 'bg-brand-600 text-white shadow-glow' 
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
                        }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Date Navigation */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 mb-6">
                <button onClick={() => navigateDate(-1)} className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 transition-colors p-1">
                    <ChevronLeft size={20} />
                </button>
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{getDateDisplay()}</span>
                <button onClick={() => navigateDate(1)} className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 transition-colors p-1">
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Summary Flow Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-tr from-slate-900 to-brand-950/40 border border-slate-200 dark:border-slate-800/80 mb-8 shadow-premium">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <span className="text-[10px] font-bold text-slate-550 text-slate-500 uppercase tracking-widest block mb-0.5">Net Flow</span>
                        <h2 className={`text-2xl font-black ${
                            (totalIncome - totalExpense) >= 0 ? 'text-emerald-450' : 'text-rose-450'
                        }`}>
                            {(totalIncome - totalExpense) >= 0 ? '+' : '-'}₹{Math.abs(totalIncome - totalExpense).toLocaleString()}
                        </h2>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center shadow-glow flex-shrink-0">
                        <BarChart3 size={20} />
                    </div>
                </div>

                <div className="h-[1px] bg-slate-200 dark:bg-slate-800/60 my-4" />

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Total Income</span>
                        <span className="text-sm font-black text-emerald-450">+₹{totalIncome.toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Total Expenses</span>
                        <span className="text-sm font-black text-rose-450">-₹{totalExpense.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 mb-8 shadow-premium">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Flow Activity</h3>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setDisplayType('expense')}
                            className={`text-xs font-bold pb-1 transition-all ${
                                displayType === 'expense' || displayType === 'all' 
                                    ? 'border-b-2 border-brand-500 text-brand-400' 
                                    : 'text-slate-500 hover:text-slate-350'
                            }`}
                        >
                            Expenses
                        </button>
                        <button 
                            onClick={() => setDisplayType('income')}
                            className={`text-xs font-bold pb-1 transition-all ${
                                displayType === 'income' 
                                    ? 'border-b-2 border-brand-500 text-brand-400' 
                                    : 'text-slate-500 hover:text-slate-350'
                            }`}
                        >
                            Income
                        </button>
                    </div>
                </div>

                <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={graphData}>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                            <Bar 
                                dataKey={displayType === 'income' ? 'income' : 'expense'} 
                                radius={[6, 6, 0, 0]} 
                                barSize={16}
                            >
                                {graphData.map((entry, index) => {
                                    const isIncome = displayType === 'income';
                                    const fillCol = isIncome 
                                        ? '#10b981' 
                                        : (index === graphData.length - 1 ? '#8b5cf6' : '#1e293b');
                                    return <Cell key={`cell-${index}`} fill={fillCol} />;
                                })}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Savings Goals */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Active Savings</h3>
                    <button 
                        onClick={() => navigate('/goals')}
                        className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 flex items-center justify-center transition-colors"
                        title="Add goal"
                    >
                        <Plus size={16} />
                    </button>
                </div>
                
                <div className="space-y-3">
                    {[
                        { name: 'Emergency Reserve', progress: 98, color: '#8b5cf6', icon: '✨' },
                        { name: 'Home Renovations', progress: 78, color: '#f43f5e', icon: '🏠' },
                        { name: 'Travel fund', progress: 62, color: '#3b82f6', icon: '✈️' }
                    ].map((goal, i) => (
                        <div 
                            key={i} 
                            onClick={() => navigate('/goals')}
                            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-premium flex items-center justify-between hover:border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-lg">
                                    {goal.icon}
                                </div>
                                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">{goal.name}</h4>
                            </div>
                            <span className="text-xs font-black text-brand-400">{goal.progress}%</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Switch tabs for Breakdown category type */}
            <div className="flex gap-2 mb-6">
                {['all', 'income', 'expense'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setDisplayType(type)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize border transition-all ${
                            displayType === type 
                                ? 'bg-brand-600 border-brand-500 text-white shadow-glow' 
                                : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
                        }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Breakdown ledger list */}
            <div className="mb-12">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight mb-4 capitalize">
                    {displayType === 'all' ? 'Ledger' : displayType} Breakdown
                </h3>
                
                <div className="space-y-2.5">
                    {currentTransactions.length === 0 ? (
                        <div className="p-8 text-center rounded-2xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/35">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">No transaction logs recorded</p>
                        </div>
                    ) : (
                        currentTransactions.map((t) => (
                            <div 
                                key={t._id} 
                                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between shadow-premium hover:border-slate-300 dark:border-slate-700 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                        t.type === 'income' 
                                            ? 'bg-emerald-500/10 text-emerald-450' 
                                            : 'bg-rose-500/10 text-rose-450'
                                    }`}>
                                        {t.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-250 text-slate-800 dark:text-slate-200">
                                            {t.type === 'income' ? (t.source || 'Income') : t.type === 'expense' ? (t.purpose || 'Expense') : 'Transfer'}
                                        </h4>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                                            {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="text-right">
                                    <span className={`text-sm font-black ${
                                        t.type === 'income' ? 'text-emerald-450' : 'text-slate-800 dark:text-slate-200'
                                    }`}>
                                        {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Stats;
