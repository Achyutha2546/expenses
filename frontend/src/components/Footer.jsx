import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, 
    BarChart3, 
    Plus, 
    History as HistoryIcon, 
    Settings, 
    ChevronLeft, 
    ChevronRight, 
    Wallet, 
    Target, 
    LogOut,
    Bell,
    PieChart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Footer = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    
    // Manage sidebar collapse state (persisted in local storage)
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        return saved ? JSON.parse(saved) : false;
    });

    const isActive = (path) => {
        return location.pathname === path;
    };

    // Keep HTML classes in sync with sidebar state for page-shifting margins
    useEffect(() => {
        document.documentElement.classList.add('has-sidebar');
        if (isCollapsed) {
            document.documentElement.classList.add('sidebar-collapsed');
        } else {
            document.documentElement.classList.remove('sidebar-collapsed');
        }
        return () => {
            document.documentElement.classList.remove('has-sidebar');
            document.documentElement.classList.remove('sidebar-collapsed');
        };
    }, [isCollapsed]);

    const toggleCollapse = () => {
        const newVal = !isCollapsed;
        setIsCollapsed(newVal);
        localStorage.setItem('sidebar-collapsed', JSON.stringify(newVal));
    };

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to sign out?')) {
            logout();
            navigate('/');
        }
    };

    const mainNavItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/stats', icon: BarChart3, label: 'Stats' },
        { path: '/analytics', icon: PieChart, label: 'Analytics' },
        { path: '/history', icon: HistoryIcon, label: 'Transactions' },
        { path: '/goals', icon: Target, label: 'Savings Goals' },
        { path: '/sources', icon: Wallet, label: 'Accounts' },
        { path: '/account', icon: Settings, label: 'Settings' }
    ];

    // Mobile nav uses a subset of links + a FAB in the middle
    const mobileNavItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
        { path: '/stats', icon: BarChart3, label: 'Stats' },
        { path: '/add', icon: Plus, label: 'Add', isFab: true },
        { path: '/analytics', icon: PieChart, label: 'Analytics' },
        { path: '/account', icon: Settings, label: 'Settings' }
    ];

    return (
        <>
            {/* Desktop Collapsible Sidebar */}
            <aside 
                className={`fixed top-0 left-0 h-screen bg-slate-900 border-r border-slate-800/80 z-30 transition-all duration-300 md:flex flex-col justify-between hidden ${
                    isCollapsed ? 'w-20' : 'w-64'
                }`}
            >
                {/* Header Logo */}
                <div>
                    <div className="flex items-center gap-3 p-6 border-b border-slate-800/60 overflow-hidden">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-glow">
                            <Wallet className="text-white" size={22} />
                        </div>
                        {!isCollapsed && (
                            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                                Spendly
                            </span>
                        )}
                    </div>

                    {/* Nav Links */}
                    <nav className="p-4 space-y-1.5 flex-1">
                        {mainNavItems.map((item) => {
                            const active = isActive(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group relative ${
                                        active 
                                            ? 'bg-brand-600/15 text-brand-400 font-semibold' 
                                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                    }`}
                                >
                                    <item.icon 
                                        size={20} 
                                        className={`transition-colors duration-200 ${
                                            active ? 'text-brand-400' : 'text-slate-400 group-hover:text-slate-200'
                                        }`} 
                                    />
                                    {!isCollapsed && (
                                        <span className="text-sm truncate">{item.label}</span>
                                    )}
                                    
                                    {/* Tooltip for collapsed sidebar */}
                                    {isCollapsed && (
                                        <div className="absolute left-24 px-3 py-1.5 bg-slate-950 text-slate-200 text-xs rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-premium border border-slate-800 z-50 white-space-nowrap">
                                            {item.label}
                                        </div>
                                    )}

                                    {/* Active Left Indicator */}
                                    {active && (
                                        <div className="absolute left-0 top-3 bottom-3 w-1 bg-brand-500 rounded-r-md" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer Section (Profile + Sign Out + Collapse Toggle) */}
                <div className="p-4 border-t border-slate-800/60 space-y-3">
                    {!isCollapsed && user && (
                        <div className="flex items-center gap-3 px-2 py-1.5 overflow-hidden">
                            <img 
                                src={user.photoURL || 'https://i.pravatar.cc/80'} 
                                alt="Profile" 
                                className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-800"
                            />
                            <div className="truncate flex-1">
                                <p className="text-xs text-slate-400 font-medium">Account</p>
                                <p className="text-sm font-semibold text-slate-200 truncate">
                                    {user.name || user.email?.split('@')[0]}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-1">
                        <button
                            onClick={handleLogout}
                            className={`flex items-center gap-4 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors w-full group relative ${
                                isCollapsed ? 'justify-center' : ''
                            }`}
                        >
                            <LogOut size={20} />
                            {!isCollapsed && <span className="text-sm font-medium">Sign Out</span>}
                            
                            {isCollapsed && (
                                <div className="absolute left-24 px-3 py-1.5 bg-slate-950 text-rose-400 text-xs rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-premium border border-slate-800 z-50 white-space-nowrap">
                                    Sign Out
                                </div>
                            )}
                        </button>

                        <button
                            onClick={toggleCollapse}
                            className={`flex items-center gap-4 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors w-full ${
                                isCollapsed ? 'justify-center' : ''
                            }`}
                            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        >
                            {isCollapsed ? <ChevronRight size={20} /> : (
                                <>
                                    <ChevronLeft size={20} />
                                    <span className="text-sm">Collapse</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile / Tablet Bottom Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 h-16 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800/80 z-30 flex items-center justify-around px-4 md:hidden pb-safe">
                {mobileNavItems.map((item, idx) => {
                    const active = isActive(item.path);

                    if (item.isFab) {
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className="relative -top-5 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-glow hover:scale-105 active:scale-95 transition-all duration-200"
                                aria-label="Add transaction"
                            >
                                <Plus size={30} strokeWidth={2.5} />
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-150 ${
                                active ? 'text-brand-400' : 'text-slate-400'
                            }`}
                        >
                            <item.icon 
                                size={20} 
                                strokeWidth={active ? 2.5 : 2} 
                                className="mb-0.5"
                            />
                            <span className="text-[10px] font-medium tracking-wide">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
};

export default Footer;

