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
    Wallet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Account = () => {
    const [filter, setFilter] = useState('monthly'); // 'daily', 'monthly', 'yearly'
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const res = await api.get('/transactions');
                setTransactions(res.data);
            } catch (err) {
                console.error('Error fetching transactions', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTransactions();
    }, []);

    const filterTransactions = () => {
        const now = new Date();
        return transactions.filter(t => {
            const tDate = new Date(t.date);
            if (filter === 'daily') {
                return tDate.toDateString() === now.toDateString();
            } else if (filter === 'monthly') {
                return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
            } else if (filter === 'yearly') {
                return tDate.getFullYear() === now.getFullYear();
            }
            return true;
        });
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
                        onClick={() => navigate('/')}
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
            </header>

            {/* Premium Sliding Filter Bar */}
            <div style={{
                background: 'var(--bg-card)',
                padding: '6px',
                borderRadius: '16px',
                display: 'flex',
                marginBottom: '24px',
                position: 'relative',
                border: '1px solid var(--border)'
            }}>
                {['daily', 'monthly', 'yearly'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
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

            {/* Expenditure Summary Card */}
            <div className="glass-card mb-8" style={{
                padding: '24px',
                borderRadius: '24px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(129, 140, 248, 0.05))',
                border: '1px solid rgba(99, 102, 241, 0.2)'
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
                        background: 'rgba(239, 68, 68, 0.1)',
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

            {/* Breakdown Section */}
            <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px' }}>Expenditure Breakdown</h3>
                <div className="flex flex-col gap-3">
                    {currentTransactions.filter(t => t.type === 'expense').length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                            <Calendar size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                            <p>No expenses for this period.</p>
                        </div>
                    ) : (
                        currentTransactions
                            .filter(t => t.type === 'expense')
                            .map((t) => (
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
                                            background: 'rgba(239, 68, 68, 0.05)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <TrendingDown size={20} color="var(--expense)" />
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '0.95rem', fontWeight: '600' }}>{t.purpose || 'Expense'}</h4>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontWeight: '700', fontSize: '1rem' }}>₹{t.amount.toLocaleString()}</p>
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

export default Account;
