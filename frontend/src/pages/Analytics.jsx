import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';
import { Pie, Doughnut } from 'react-chartjs-2';
import api from '../utils/api';
import { ArrowLeft, PieChart, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

const Analytics = () => {
    const [categoryData, setCategoryData] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const [catRes, monthRes, insightRes] = await Promise.all([
                    api.get('/category-summary'),
                    api.get('/monthly-summary'),
                    api.get('/analytics/insights')
                ]);
                setCategoryData(catRes.data);
                setMonthlyData(monthRes.data);
                setInsights(insightRes.data);
            } catch (err) {
                console.error('Error fetching analytics:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);



    const PALETTE = [
        '#8b5cf6', '#3b82f6', '#10b981', '#f43f5e',
        '#f59e0b', '#06b6d4', '#6366f1', '#ec4899'
    ];

    // Total spending for % calculation
    const totalSpend = categoryData.reduce((s, c) => s + c.totalAmount, 0);

    // Pie / Doughnut shared data
    const pieData = {
        labels: categoryData.map(c => c.category.charAt(0).toUpperCase() + c.category.slice(1)),
        datasets: [{
            data: categoryData.map(c => c.totalAmount),
            backgroundColor: PALETTE,
            borderColor: 'rgba(7, 10, 19, 0.8)',
            borderWidth: 2,
            hoverOffset: 14
        }]
    };

    // Doughnut (spending %) config — no built-in legend, we draw our own
    const doughnutData = {
        labels: categoryData.map(c => c.category.charAt(0).toUpperCase() + c.category.slice(1)),
        datasets: [{
            data: categoryData.map(c => c.totalAmount),
            backgroundColor: PALETTE,
            borderColor: '#070a13',
            borderWidth: 3,
            hoverOffset: 14
        }]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#0f172a',
                padding: 12,
                bodyFont: { size: 12, family: 'Inter' },
                titleFont: { size: 12, weight: 'bold', family: 'Inter' },
                displayColors: true,
                borderColor: '#1e293b',
                borderWidth: 1,
                cornerRadius: 8,
                callbacks: {
                    label: (ctx) => {
                        const pct = totalSpend > 0 ? ((ctx.parsed / totalSpend) * 100).toFixed(1) : 0;
                        return ` ₹${ctx.parsed.toLocaleString()}  (${pct}%)`;
                    }
                }
            }
        },
        maintainAspectRatio: false
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
            {/* Header */}
            <header className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-black text-white tracking-tight">Structured Insights</h1>
            </header>

            {/* Smart Spending Insights Card */}
            {insights && (
                <section className="mb-8">
                    <div className={`p-5 rounded-3xl bg-slate-900 border shadow-premium ${
                        insights.trend === 'up' 
                            ? 'border-rose-500/20 bg-gradient-to-tr from-slate-900 to-rose-950/15' 
                            : insights.trend === 'down'
                                ? 'border-emerald-500/20 bg-gradient-to-tr from-slate-900 to-emerald-950/15'
                                : 'border-slate-800/80 bg-slate-900/60'
                    }`}>
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    {insights.trend === 'up' ? (
                                        <TrendingUp size={16} className="text-rose-400" />
                                    ) : insights.trend === 'down' ? (
                                        <TrendingDown size={16} className="text-emerald-450" />
                                    ) : (
                                        <TrendingUp size={16} className="text-brand-400" />
                                    )}
                                    <span className={`text-[10px] font-extrabold uppercase tracking-widest ${
                                        insights.trend === 'up' ? 'text-rose-400' : insights.trend === 'down' ? 'text-emerald-450' : 'text-slate-400'
                                    }`}>
                                        Spending Velocity
                                    </span>
                                </div>
                                <p className="text-sm font-bold text-slate-200 leading-relaxed">
                                    {insights.message}
                                </p>
                                
                                {insights.topCategory && insights.topCategory !== 'General' && (
                                    <div className="pt-2">
                                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-950 border border-slate-850 text-xs font-semibold text-slate-400">
                                            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                                            <span>Primary Channel: <span className="text-slate-200 font-extrabold">{insights.topCategory}</span></span>
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-850 text-center min-w-[80px]">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Delta</span>
                                <span className={`text-base font-black ${
                                    insights.changePercent > 0 ? 'text-rose-450' : 'text-emerald-450'
                                }`}>
                                    {insights.changePercent > 0 ? '+' : ''}{insights.changePercent.toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Category Breakdown Chart */}
            <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center shadow-glow">
                        <PieChart size={20} />
                    </div>
                    <div>
                        <h2 className="text-sm font-extrabold text-white">Share by Category</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Debit Allocations</p>
                    </div>
                </div>

                <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 shadow-premium min-h-[350px]">
                    {categoryData.length > 0 ? (
                        <div className="h-[280px]">
                            <Pie data={pieData} options={chartOptions} />
                        </div>
                    ) : (
                        <div className="h-[280px] flex flex-col items-center justify-center text-slate-500">
                            <PieChart size={40} className="opacity-20 mb-3" />
                            <p className="text-xs font-bold uppercase tracking-wider">No debit data recorded</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Spending % Doughnut Chart */}
            <section className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shadow-glow">
                        <PieChart size={20} />
                    </div>
                    <div>
                        <h2 className="text-sm font-extrabold text-white">Spending by Section</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Category share as % of total</p>
                    </div>
                </div>

                <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 shadow-premium">
                    {categoryData.length > 0 ? (
                        <>
                            {/* Doughnut */}
                            <div className="h-[240px] mb-6">
                                <Doughnut data={doughnutData} options={{
                                    ...chartOptions,
                                    cutout: '68%',
                                    plugins: {
                                        ...chartOptions.plugins,
                                        tooltip: {
                                            ...chartOptions.plugins.tooltip,
                                            callbacks: {
                                                label: (ctx) => {
                                                    const pct = totalSpend > 0
                                                        ? ((ctx.parsed / totalSpend) * 100).toFixed(1)
                                                        : 0;
                                                    return ` ₹${ctx.parsed.toLocaleString()}  (${pct}%)`;
                                                }
                                            }
                                        }
                                    }
                                }} />
                            </div>

                            {/* Custom % legend list */}
                            <div className="space-y-3">
                                {categoryData.map((cat, i) => {
                                    const pct = totalSpend > 0
                                        ? ((cat.totalAmount / totalSpend) * 100)
                                        : 0;
                                    const color = PALETTE[i % PALETTE.length];
                                    const label = cat.category.charAt(0).toUpperCase() + cat.category.slice(1);
                                    return (
                                        <div key={cat.category} className="flex items-center gap-3">
                                            {/* Color dot */}
                                            <div
                                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                style={{ background: color }}
                                            />
                                            {/* Label */}
                                            <span className="text-xs font-semibold text-slate-300 flex-1 truncate">{label}</span>
                                            {/* Progress bar */}
                                            <div className="flex-1 max-w-[120px] h-1.5 rounded-full bg-slate-950 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-700"
                                                    style={{ width: `${pct}%`, background: color }}
                                                />
                                            </div>
                                            {/* % badge */}
                                            <span
                                                className="text-[11px] font-black w-10 text-right"
                                                style={{ color }}
                                            >
                                                {pct.toFixed(1)}%
                                            </span>
                                            {/* Amount */}
                                            <span className="text-[10px] font-bold text-slate-500 w-20 text-right">
                                                ₹{cat.totalAmount.toLocaleString()}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="h-[240px] flex flex-col items-center justify-center text-slate-500">
                            <PieChart size={40} className="opacity-20 mb-3" />
                            <p className="text-xs font-bold uppercase tracking-wider">No spending data yet</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-premium">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingDown size={16} className="text-rose-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Top Spend</span>
                    </div>
                    <span className="text-base font-extrabold text-slate-200">
                        {categoryData.length > 0
                            ? categoryData[0].category.charAt(0).toUpperCase() + categoryData[0].category.slice(1)
                            : 'N/A'}
                    </span>
                    {categoryData.length > 0 && totalSpend > 0 && (
                        <span className="text-[10px] font-bold text-rose-400 block mt-0.5">
                            {((categoryData[0].totalAmount / totalSpend) * 100).toFixed(1)}% of total
                        </span>
                    )}
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-premium">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={16} className="text-emerald-450" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Spent</span>
                    </div>
                    <span className="text-base font-extrabold text-slate-200">
                        ₹{totalSpend.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 block mt-0.5">
                        {categoryData.length} categories
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
