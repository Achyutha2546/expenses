import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
    TrendingUp,
    TrendingDown,
    Trash2,
    Plus,
    Edit2,
    Search,
    Filter,
    ArrowLeft,
    Calendar,
    Wallet
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const History = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sources, setSources] = useState([]);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [transRes, sourcesRes] = await Promise.all([
                    api.get('/transactions'),
                    api.get('/sources')
                ]);
                setTransactions(transRes.data);
                setSources(sourcesRes.data);
            } catch (err) {
                console.error('Error fetching history data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Delete this transaction?')) {
            try {
                await api.delete(`/transactions/${id}`);
                setTransactions(transactions.filter(t => t._id !== id));
            } catch (err) {
                if (err.offline) {
                    alert(err.message);
                } else {
                    alert('Failed to delete transaction');
                }
            }
        }
    };

    if (loading) return (
        <div className="container animate-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="loader"></div>
        </div>
    );

    const displayTransactions = transactions.filter(t => t.purpose !== 'Initial Balance Setup');

    return (
        <div className="container animate-in">
            {/* Header Area */}
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
                    <h1 style={{ fontSize: '1.25rem', fontWeight: '700' }}>History</h1>
                </div>
                <div className="flex gap-2">
                    <button style={{ background: 'var(--glass)', color: 'var(--text-primary)', width: '40px', height: '40px', borderRadius: '12px' }}>
                        <Search size={18} />
                    </button>
                    <button style={{ background: 'var(--glass)', color: 'var(--text-primary)', width: '40px', height: '40px', borderRadius: '12px' }}>
                        <Filter size={18} />
                    </button>
                </div>
            </header>

            {/* Quick Summary Banner */}
            <div className="glass-card mb-8" style={{ padding: '20px', borderRadius: '24px', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '4px' }}>Transactions</p>
                    <p style={{ fontWeight: '700', fontSize: '1.25rem' }}>{displayTransactions.length}</p>
                </div>
                <div style={{ width: '1px', background: 'var(--border)', height: '24px' }}></div>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '4px' }}>Monthly Avg</p>
                    <p style={{ fontWeight: '700', fontSize: '1.25rem' }}>₹{(displayTransactions.reduce((a, b) => a + b.amount, 0) / Math.max(1, displayTransactions.length)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
            </div>

            {/* Transaction List */}
            <div className="flex flex-col gap-2">
                {displayTransactions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                        <Calendar size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                        <p>No records found in history.</p>
                        <Link to="/add" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600', marginTop: '12px', display: 'block' }}>Start adding entries</Link>
                    </div>
                ) : (
                    displayTransactions.map((t, index) => {
                        const sourceName = sources.find(s => s._id.toString() === t.sourceId?.toString())?.name || 'Unknown';
                        return (
                            <div key={t._id} className="glass-card" style={{
                                padding: '16px',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'rgba(21, 26, 45, 0.4)',
                                marginBottom: '4px',
                                borderRadius: '16px'
                            }}>
                                <div className="flex items-center gap-4">
                                    <div style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '14px',
                                        background: t.type === 'income' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {t.type === 'income' ? <TrendingUp size={20} color="var(--income)" /> : <TrendingDown size={20} color="var(--expense)" />}
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '2px' }}>
                                            {t.type === 'income' ? (t.source || 'Income') : (t.purpose || 'Expense')}
                                        </h4>
                                        <div className="flex items-center gap-2" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            <Wallet size={12} />
                                            <span>{sourceName}</span>
                                            <span>•</span>
                                            <span>{new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{
                                            fontWeight: '700',
                                            fontSize: '1rem',
                                            color: t.type === 'income' ? 'var(--income)' : 'var(--text-primary)'
                                        }}>
                                            {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString()}
                                        </p>
                                        <div className="flex gap-3 justify-end mt-1">
                                            <Link to="/add" state={{ transaction: t }} style={{ color: 'var(--text-muted)' }}>
                                                <Edit2 size={14} />
                                            </Link>
                                            <button onClick={() => handleDelete(t._id)} style={{ color: 'var(--text-muted)', background: 'transparent', padding: 0 }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div style={{ paddingBottom: '60px' }}></div>
        </div>
    );
};

export default History;
