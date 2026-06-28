import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Target, 
    Plus, 
    Calendar, 
    Trash2, 
    X,
    ArrowLeft,
    Clock,
    PlusCircle,
    CheckCircle,
    Info,
    AlertCircle
} from 'lucide-react';

const Goals = () => {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showContributeModal, setShowContributeModal] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [toast, setToast] = useState(null);
    const navigate = useNavigate();

    // Form states
    const [newGoal, setNewGoal] = useState({
        name: '',
        targetAmount: '',
        deadline: '',
        icon: '🎯',
        color: '#8b5cf6'
    });
    const [contribution, setContribution] = useState({ amount: '', note: '' });

    const fetchGoals = async () => {
        try {
            const { data } = await api.get('/goals');
            setGoals(data);
        } catch (err) {
            console.error('Error fetching goals', err);
            showToast('Failed to load goals', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGoals();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleAddGoal = async (e) => {
        e.preventDefault();
        try {
            await api.post('/goals', newGoal);
            showToast('Goal created successfully!', 'success');
            setShowAddModal(false);
            setNewGoal({ name: '', targetAmount: '', deadline: '', icon: '🎯', color: '#8b5cf6' });
            fetchGoals();
        } catch (err) {
            showToast(err.response?.data?.message || 'Error creating goal', 'error');
        }
    };

    const handleContribute = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/goals/${selectedGoal._id}/contribute`, contribution);
            showToast('Contribution added!', 'success');
            setShowContributeModal(false);
            setContribution({ amount: '', note: '' });
            fetchGoals();
        } catch (err) {
            showToast(err.response?.data?.message || 'Error adding contribution', 'error');
        }
    };

    const handleDeleteGoal = async (id) => {
        if (!window.confirm('Delete this goal permanently?')) return;
        try {
            await api.delete(`/goals/${id}`);
            showToast('Goal deleted', 'success');
            fetchGoals();
        } catch (err) {
            showToast('Error deleting goal', 'error');
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
            {/* Custom toast warnings */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-premium border text-xs font-semibold ${
                            toast.type === 'success' 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450' 
                                : 'bg-rose-500/10 border-rose-500/20 text-rose-450'
                        }`}
                    >
                        {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        <span>{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="flex items-center justify-between mb-8 px-1">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 flex items-center justify-center transition-colors"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Savings Goals</h1>
                </div>
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="w-10 h-10 rounded-xl bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center shadow-glow hover:scale-105 active:scale-95 transition-all"
                    title="Add new goal"
                >
                    <Plus size={20} />
                </button>
            </header>

            {/* Goals list */}
            {goals.length === 0 ? (
                <div className="p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-premium max-w-md mx-auto">
                    <div className="w-16 h-16 bg-brand-500/10 text-brand-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-500/20 shadow-glow">
                        <Target size={30} />
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 mb-2">No goals set</h3>
                    <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                        Track progress toward what matters most. Create targets for vacations, purchases, or reserves.
                    </p>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs shadow-glow transition-all"
                    >
                        Create Your First Goal
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {goals.map((goal) => (
                        <div key={goal._id} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 relative overflow-hidden shadow-premium flex flex-col justify-between group">
                            {/* Accent bottom progress line */}
                            <div 
                                className="absolute bottom-0 left-0 h-1 transition-all duration-1000"
                                style={{ width: `${goal.progress}%`, background: goal.color }}
                            />

                            <div>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3.5">
                                        <div 
                                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                                            style={{ background: `${goal.color}15`, color: goal.color, border: `1px solid ${goal.color}25` }}
                                        >
                                            {goal.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200">{goal.name}</h3>
                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-550 text-slate-500 font-bold mt-0.5">
                                                <Calendar size={12} />
                                                <span>Deadline: {new Date(goal.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteGoal(goal._id)}
                                        className="p-2 rounded-lg text-slate-450 hover:bg-rose-500/10 hover:text-rose-450 transition-colors"
                                        title="Delete goal"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="flex justify-between items-end mb-2 pt-2">
                                    <div>
                                        <span className="text-xl font-black text-slate-800 dark:text-slate-200">₹{goal.savedAmount.toLocaleString()}</span>
                                        <span className="text-slate-500 text-xs font-bold"> / ₹{goal.targetAmount.toLocaleString()}</span>
                                    </div>
                                    <span className="text-sm font-black" style={{ color: goal.color }}>
                                        {goal.progress.toFixed(0)}%
                                    </span>
                                </div>

                                {/* Custom Themed Progress Bar */}
                                <div className="w-full h-2.5 bg-slate-50 dark:bg-slate-950 rounded-full overflow-hidden mb-6 p-[2px] border border-slate-200 dark:border-slate-850">
                                    <div 
                                        className="h-full rounded-full transition-all duration-1000"
                                        style={{ width: `${goal.progress}%`, background: goal.color }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                                    <Clock size={13} />
                                    <span>{goal.isCompleted ? 'Goal Completed! 🎉' : `${goal.daysRemaining} days left`}</span>
                                </div>
                                {!goal.isCompleted && (
                                    <button 
                                        onClick={() => {
                                            setSelectedGoal(goal);
                                            setShowContributeModal(true);
                                        }}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-extrabold text-xs shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all"
                                    >
                                        <PlusCircle size={14} />
                                        <span>Add Funds</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Goal Modal */}
            <AnimatePresence>
                {showAddModal && (
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
                            className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-premium relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-500 to-indigo-500" />
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Create Saving Goal</h2>
                                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-555 text-slate-500 hover:text-slate-350"><X size={18} /></button>
                            </div>
                            <form onSubmit={handleAddGoal} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">Goal Name</label>
                                    <input 
                                        type="text" 
                                        value={newGoal.name}
                                        onChange={(e) => setNewGoal({...newGoal, name: e.target.value})}
                                        placeholder="New Laptop, Car Downpayment..."
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-slate-955 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-slate-800 dark:text-slate-200 text-sm font-semibold transition-colors"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">Target (₹)</label>
                                        <input 
                                            type="number" 
                                            value={newGoal.targetAmount}
                                            onChange={(e) => setNewGoal({...newGoal, targetAmount: e.target.value})}
                                            placeholder="50000"
                                            required
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-slate-800 dark:text-slate-200 text-sm font-bold transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">Deadline</label>
                                        <input 
                                            type="date" 
                                            value={newGoal.deadline}
                                            onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                                            required
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-slate-800 dark:text-slate-200 text-sm font-semibold transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-2">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">Icon Category</label>
                                        <select 
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-855 border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200 text-sm outline-none focus:border-brand-500"
                                            value={newGoal.icon}
                                            onChange={(e) => setNewGoal({...newGoal, icon: e.target.value})}
                                        >
                                            <option value="🎯">🎯 Goal</option>
                                            <option value="🚗">🚗 Car</option>
                                            <option value="🏠">🏠 Home</option>
                                            <option value="✈️">✈️ Travel</option>
                                            <option value="🎓">🎓 School</option>
                                            <option value="💻">💻 Tech</option>
                                            <option value="💍">💍 Ring</option>
                                            <option value="🎁">🎁 Gift</option>
                                        </select>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">Card Theme</label>
                                        <input 
                                            type="color" 
                                            className="w-full h-11 p-1 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 cursor-pointer outline-none"
                                            value={newGoal.color}
                                            onChange={(e) => setNewGoal({...newGoal, color: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-4.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-sm shadow-glow hover:scale-[1.01] active:scale-[0.99] transition-all duration-200">
                                    Create Target Goal
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Contribute Funds Modal */}
            <AnimatePresence>
                {showContributeModal && (
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
                            className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-premium relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-500 to-indigo-500" />
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Deposit to {selectedGoal?.name}</h2>
                                <button onClick={() => setShowContributeModal(false)} className="w-8 h-8 rounded-lg bg-slate-955 bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-500 hover:text-slate-350"><X size={18} /></button>
                            </div>
                            <form onSubmit={handleContribute} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">Savings Amount (₹)</label>
                                    <input 
                                        type="number" 
                                        value={contribution.amount}
                                        onChange={(e) => setContribution({...contribution, amount: e.target.value})}
                                        placeholder="1000"
                                        autoFocus
                                        required
                                        className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-brand-500 outline-none text-slate-800 dark:text-slate-200 text-xl font-black placeholder-slate-700 transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">Contribution Memo</label>
                                    <input 
                                        type="text" 
                                        value={contribution.note}
                                        onChange={(e) => setContribution({...contribution, note: e.target.value})}
                                        placeholder="Saving from bonus, salary allocation..."
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-brand-500 outline-none text-slate-800 dark:text-slate-200 text-sm font-semibold placeholder-slate-700 transition-colors"
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    className="w-full py-4 rounded-xl text-slate-900 dark:text-white font-extrabold text-sm shadow-glow hover:scale-[1.01] active:scale-[0.99] transition-all"
                                    style={{ background: selectedGoal?.color }}
                                >
                                    Confirm Deposit
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Goals;
