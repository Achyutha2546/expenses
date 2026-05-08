import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
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
    Plus
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
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

    // Graph Data Processing
    const getGraphData = () => {
        if (filter === 'monthly') {
            // Group by day for the current month
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
            // Group by month for the current year
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
            // Daily - show hours or just a single bar? Let's just show a simple bar for now or comparison
            return [
                { name: 'Today', income: totalIncome, expense: totalExpense }
            ];
        }
    };

    const graphData = getGraphData();

    if (loading) return (
        <div className="container animate-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="loader"></div>
        </div>
    );

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ 
                    background: 'black', 
                    color: 'white', 
                    padding: '8px 12px', 
                    borderRadius: '12px', 
                    fontSize: '0.75rem', 
                    fontWeight: '700',
                    textAlign: 'center',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                }}>
                    <p style={{ opacity: 0.7, marginBottom: '2px' }}>
                        {filter === 'monthly' ? `${label} ${currentDate.toLocaleDateString(undefined, { month: 'short' })}` : label}
                    </p>
                    <p>₹{payload[0].value.toLocaleString()}</p>
                </div>
            );
        }
        return null;
    };

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
                    <h1 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Analytics</h1>
                </div>
                <Link to="/account" style={{
                    background: 'var(--glass)',
                    color: 'var(--text-primary)',
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Settings size={20} />
                </Link>
            </header>

            {/* Filter Bar */}
            <div style={{
                background: 'var(--bg-card)',
                padding: '6px',
                borderRadius: '16px',
                display: 'flex',
                marginBottom: '16px',
                border: '1px solid var(--border)'
            }}>
                {['daily', 'monthly', 'yearly'].map((type) => (
                    <button
                        key={type}
                        onClick={() => {
                            setFilter(type);
                            setCurrentDate(new Date());
                        }}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
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

            {/* Date Navigation */}
            <div className="flex items-center justify-between mb-6" style={{
                background: 'var(--glass)',
                padding: '12px 20px',
                borderRadius: '16px',
                border: '1px solid var(--border)'
            }}>
                <button onClick={() => navigateDate(-1)} style={{ background: 'transparent', color: 'var(--text-primary)' }}>
                    <ChevronLeft size={24} />
                </button>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '1rem', fontWeight: '700' }}>{getDateDisplay()}</p>
                </div>
                <button onClick={() => navigateDate(1)} style={{ background: 'transparent', color: 'var(--text-primary)' }}>
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* Summary Card */}
            <div className="glass-card mb-8" style={{
                padding: '24px',
                borderRadius: '24px',
                background: 'var(--card-gradient)',
                border: '1px solid var(--border)'
            }}>
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>Net Flow</p>
                        <h2 style={{ fontSize: '2rem', fontWeight: '800', color: (totalIncome - totalExpense) >= 0 ? 'var(--income)' : 'var(--expense)' }}>
                            {(totalIncome - totalExpense) >= 0 ? '+' : '-'}₹{Math.abs(totalIncome - totalExpense).toLocaleString()}
                        </h2>
                    </div>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
                        background: 'rgba(139, 92, 246, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <BarChart3 size={24} color="var(--primary)" />
                    </div>
                </div>

                <div style={{ height: '1px', background: 'var(--border)', margin: '20px 0' }}></div>

                <div className="flex justify-between">
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '2px' }}>Total Income</p>
                        <p style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--income)' }}>+₹{totalIncome.toLocaleString()}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '2px' }}>Total Expenses</p>
                        <p style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--expense)' }}>-₹{totalExpense.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Richie Style Chart Section */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Analytics</h3>
                    <Calendar size={22} />
                </div>

                <div className="flex gap-6 mb-6">
                    <button 
                        onClick={() => setDisplayType('expense')}
                        style={{ 
                            fontSize: '1.1rem', 
                            fontWeight: '800', 
                            color: displayType === 'expense' || displayType === 'all' ? 'black' : '#94a3b8', 
                            borderBottom: displayType === 'expense' || displayType === 'all' ? '2px solid black' : 'none', 
                            paddingBottom: '4px',
                            background: 'transparent'
                        }}
                    >
                        Expenses
                    </button>
                    <button 
                        onClick={() => setDisplayType('income')}
                        style={{ 
                            fontSize: '1.1rem', 
                            fontWeight: '800', 
                            color: displayType === 'income' ? 'black' : '#94a3b8', 
                            borderBottom: displayType === 'income' ? '2px solid black' : 'none', 
                            paddingBottom: '4px',
                            background: 'transparent'
                        }}
                    >
                        Income
                    </button>
                </div>

                <div style={{ height: '240px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={graphData}>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                            <Bar 
                                dataKey={displayType === 'income' ? 'income' : 'expense'} 
                                radius={[10, 10, 10, 10]} 
                                barSize={24}
                            >
                                {graphData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={displayType === 'income' ? 'var(--income)' : (index === graphData.length - 1 ? 'black' : '#e2e8f0')} 
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Savings Goals Section */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>Savings Goals</h3>
                    <button onClick={() => navigate('/goals')} style={{ background: 'black', color: 'white', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Plus size={18} />
                    </button>
                </div>
                <div className="flex flex-col gap-4">
                    {[
                        { name: 'Emergency', progress: 98, color: '#ddd6fe', icon: '✨' },
                        { name: 'Home renovation', progress: 78, color: '#fecaca', icon: '🏠' },
                        { name: 'Travel', progress: 62, color: '#bae6fd', icon: '☁️' }
                    ].map((goal, i) => (
                        <div key={i} style={{ 
                            background: goal.color, 
                            borderRadius: '28px', 
                            padding: '20px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between' 
                        }}>
                            <div className="flex items-center gap-4">
                                <div style={{ 
                                    width: '48px', 
                                    height: '48px', 
                                    borderRadius: '16px', 
                                    background: 'rgba(255, 255, 255, 0.4)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    fontSize: '1.2rem'
                                }}>
                                    {goal.icon}
                                </div>
                                <h4 style={{ fontWeight: '700', color: 'black' }}>{goal.name}</h4>
                            </div>
                            <span style={{ fontWeight: '800', color: 'black', opacity: 0.6 }}>{goal.progress}%</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Type Selector for Breakdown */}
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

            {/* Transactions Section */}
            <div className="mb-10">
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px', textTransform: 'capitalize' }}>
                    {displayType === 'all' ? 'Transaction' : displayType} Breakdown
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
        </div>
    );
};

export default Stats;
