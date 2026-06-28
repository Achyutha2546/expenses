import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BarChart2, Plus, List, Settings } from 'lucide-react';

const Footer = () => {
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path;
    };

    const navItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
        { path: '/stats', icon: BarChart2, label: 'Analytics' },
        { path: '/add', icon: Plus, label: 'Add', isFab: true },
        { path: '/history', icon: List, label: 'Transactions' },
        { path: '/account', icon: Settings, label: 'Settings' }
    ];

    return (
        <nav className="bottom-nav">
            {navItems.map((item) => {
                if (item.isFab) {
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                        >
                            <div className="fab">
                                <item.icon size={28} />
                            </div>
                        </Link>
                    );
                }

                const ActiveIcon = item.icon;
                const active = isActive(item.path);

                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`nav-item ${active ? 'active' : ''}`}
                    >
                        <ActiveIcon
                            size={24}
                            strokeWidth={active ? 2.5 : 2}
                        />
                        <span>
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
};

export default Footer;
