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
    Moon
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const Dashboard = () => {
    const [transactions, setTransactions] = useState([]);
    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showBreakdown, setShowBreakdown] = useState(false);
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            const [transRes, sourcesRes] = await Promise.all([
                api.get('/transactions'),
                api.get('/sources')
            ]);
            setTransactions(transRes.data);
            setSources(sourcesRes.data);
            if (sourcesRes.data.length === 0 && !sourcesRes.offline) {
                navigate('/onboarding');
            }
        } catch (err) {
            console.error('Error fetching data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const totals = transactions.reduce((acc, curr) => {
        if (curr.type === 'income') acc.income += curr.amount;
        else acc.expense += curr.amount;
        const sourceKey = curr.sourceId?.toString();
        if (sourceKey) {
            if (!acc.sources[sourceKey]) acc.sources[sourceKey] = 0;
            acc.sources[sourceKey] += (curr.type === 'income' ? curr.amount : -curr.amount);
        }
        return acc;
    }, { income: 0, expense: 0, sources: {} });

    const balance = totals.income - totals.expense;

    if (loading) return (
        <div className="container animate-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="loader"></div>
        </div>
    );

    return (
        <div className="container animate-in">
            {/* Header */}
            <header className="flex justify-between items-center mb-6" style={{ padding: '0 4px' }}>
                <div className="flex items-center gap-3">
                    <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary), #818cf8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                    }}>
                        <User size={22} color="white" />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Good morning,</p>
                        <h1 style={{ fontSize: '1.2rem', fontWeight: '700' }}>{user?.email?.split('@')[0] || 'User'}</h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={toggleTheme}
                        style={{ background: 'var(--glass)', color: 'var(--text-primary)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <button style={{ background: 'var(--glass)', color: 'var(--text-primary)', width: '40px', height: '40px', borderRadius: '12px' }}>
                        <Bell size={20} />
                    </button>
                    <button onClick={logout} style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--expense)', width: '40px', height: '40px', borderRadius: '12px' }}>
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Premium Wallet Card */}
            <div className="glass-card mb-8" style={{
                background: 'var(--card-gradient)',
                border: '1px solid var(--border)',
                position: 'relative',
                overflow: 'hidden',
                padding: '28px'
            }}>
                <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '150px', height: '150px', background: 'var(--primary)', filter: 'blur(80px)', opacity: '0.15' }}></div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px', opacity: 0.8 }}>Total Balance</p>
                <div className="flex items-end gap-2 mb-6">
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-0.5px' }}>₹{balance.toLocaleString()}</h2>
                </div>

                <div className="flex gap-4 mt-6">
                    <div style={{ flex: 1 }}>
                        <div className="flex items-center gap-2 mb-1">
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <TrendingUp size={14} color="var(--income)" />
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Income</span>
                        </div>
                        <p style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--income)' }}>+₹{totals.income.toLocaleString()}</p>
                    </div>
                    <div style={{ width: '1px', background: 'var(--border)', height: '40px' }}></div>
                    <div style={{ flex: 1 }}>
                        <div className="flex items-center gap-2 mb-1">
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <TrendingDown size={14} color="var(--expense)" />
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Expenses</span>
                        </div>
                        <p style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--expense)' }}>-₹{totals.expense.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Quick Actions</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                    {[
                        { to: '/add', icon: Plus, label: 'Add', color: 'var(--primary)', bg: 'rgba(99, 102, 241, 0.1)' },
                        { to: '/sources', icon: Wallet, label: 'Wallet', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
                        { to: '/history', icon: History, label: 'History', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
                        { to: '/sources', icon: Settings, label: 'Settings', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' }
                    ].map((btn, i) => (
                        <Link key={i} to={btn.to} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
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
                    ))}
                </div>
            </div>

            {/* My Accounts Section */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>My Accounts</h3>
                    <Link to="/sources" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>See All</Link>
                </div>
                <div className="flex flex-col gap-3">
                    {sources.slice(0, 3).map((s) => (
                        <div key={s._id} className="glass-card" style={{ padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                                <p style={{ fontWeight: '700', fontSize: '1rem' }}>₹{(totals.sources[s._id.toString()] || 0).toLocaleString()}</p>
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
                        {transactions.slice(0, 5).map((t) => (
                            <div key={t._id} className="flex items-center justify-between p-3" style={{ borderBottom: '1px solid var(--border)' }}>
                                <div className="flex items-center gap-3">
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: t.type === 'income' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {t.type === 'income' ? <TrendingUp size={18} color="var(--income)" /> : <TrendingDown size={18} color="var(--expense)" />}
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: '500' }}>{t.description || 'Transaction'}</h4>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                            {new Date(t.date).toLocaleDateString()} • {t.category || 'General'}
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
        </div>
    );
};

export default Dashboard;
