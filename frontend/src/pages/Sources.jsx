import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ArrowLeft, Wallet, Edit2, Save, X, CreditCard, Settings, Landmark, Check } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const Sources = () => {
    const [sources, setSources] = useState([]);
    const [newName, setNewName] = useState('');
    const [initialBalance, setInitialBalance] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const navigate = useNavigate();

    const handleEditClick = (source) => {
        setEditingId(source._id);
        setEditName(source.name);
    };

    const handleUpdate = async (id) => {
        if (!editName.trim()) return;
        try {
            const { data } = await api.put(`/sources/${id}`, { name: editName });
            setSources(sources.map(s => s._id === id ? data : s));
            setEditingId(null);
            setEditName('');
        } catch (err) {
            if (err.offline) {
                alert(err.message);
                setEditingId(null);
            } else {
                setError(err.response?.data?.message || 'Error updating source');
            }
        }
    };

    const fetchSources = async () => {
        try {
            const { data } = await api.get('/sources');
            setSources(data);
        } catch (err) {
            console.error('Error fetching sources', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSources();
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newName.trim()) return;
        setError('');
        try {
            const { data } = await api.post('/sources', {
                name: newName,
                initialBalance: Number(initialBalance) || 0
            });
            setSources([...sources, data]);
            setNewName('');
            setInitialBalance('');
        } catch (err) {
            if (err.offline) {
                alert(err.message);
                setNewName('');
                setInitialBalance('');
            } else {
                setError(err.response?.data?.message || 'Error adding source');
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this account source? Warning: This will delete all transactions associated with this account source.')) {
            try {
                await api.delete(`/sources/${id}`);
                setSources(sources.filter(s => s._id !== id));
            } catch (err) {
                if (err.offline) {
                    alert(err.message);
                } else {
                    alert(err.response?.data?.message || 'Failed to delete source');
                }
            }
        }
    };

    if (loading) {
        return (
            <div className="container flex justify-center items-center min-h-[75vh]">
                <div className="w-10 h-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <div className="container relative pb-12 select-none">
            {/* Header toolbar */}
            <header className="flex items-center justify-between mb-8 px-1">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 flex items-center justify-center transition-colors"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Sources & Wallets</h1>
                </div>
                <Link 
                    to="/account" 
                    className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 flex items-center justify-center transition-colors"
                    title="Account Settings"
                >
                    <Settings size={18} />
                </Link>
            </header>

            {/* Account Addition panel */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 mb-8 shadow-premium relative overflow-hidden">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center shadow-glow">
                        <Plus size={18} />
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Add Account</h3>
                </div>

                <form onSubmit={handleAdd} className="space-y-4">
                    <div className="space-y-2">
                        <input
                            type="text"
                            placeholder="Account Name (e.g. Chase Bank, Cash Wallet)"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-slate-800 dark:text-slate-200 text-sm font-semibold transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-extrabold text-sm">₹</span>
                            <input
                                type="number"
                                placeholder="Starting Balance"
                                value={initialBalance}
                                onChange={(e) => setInitialBalance(e.target.value)}
                                className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-slate-800 dark:text-slate-200 text-sm font-bold placeholder-slate-700 transition-colors"
                            />
                        </div>
                    </div>
                    
                    <button 
                        type="submit" 
                        className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-extrabold shadow-glow hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                    >
                        Register Account Source
                    </button>
                </form>
                {error && <p className="text-xs font-semibold text-rose-450 text-center mt-3">{error}</p>}
            </div>

            {/* Established Sources List */}
            <h3 className="text-sm font-extrabold text-slate-450 text-slate-450 uppercase tracking-widest mb-4 ml-1">My Accounts</h3>
            
            <div className="space-y-3">
                {sources.length === 0 ? (
                    <div className="p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/35">
                        <Wallet size={32} className="text-slate-655 text-slate-600 mx-auto mb-3" />
                        <p className="text-xs font-bold text-slate-500">No accounts configured yet</p>
                    </div>
                ) : (
                    sources.map((s, index) => (
                        <div 
                            key={s._id} 
                            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-premium"
                        >
                            {editingId === s._id ? (
                                <div className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        autoFocus
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 outline-none text-slate-800 dark:text-slate-200 text-sm font-semibold focus:border-brand-500 transition-colors"
                                    />
                                    <button 
                                        onClick={() => handleUpdate(s._id)} 
                                        className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-450 hover:bg-emerald-500/15 flex items-center justify-center transition-colors"
                                        title="Save Changes"
                                    >
                                        <Check size={18} />
                                    </button>
                                    <button 
                                        onClick={() => setEditingId(null)} 
                                        className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-500 hover:text-slate-350 flex items-center justify-center transition-colors"
                                        title="Cancel Edit"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center shadow-glow">
                                            <CreditCard size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{s.name}</h4>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Active Ledger Account</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => handleEditClick(s)} 
                                            className="p-2 rounded-lg text-slate-450 hover:bg-slate-50 dark:bg-slate-950/65 hover:text-slate-700 dark:text-slate-300 transition-colors"
                                            title="Edit account name"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(s._id)} 
                                            className="p-2 rounded-lg text-slate-450 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                                            title="Delete account source"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Sources;
