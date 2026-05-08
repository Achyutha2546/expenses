import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BarChart2, List, Settings } from 'lucide-react';

const Footer = () => {
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path;
    };

    const navItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
        { path: '/stats', icon: BarChart2, label: 'Analytics' },
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
                            style={{
                                marginTop: '-40px',
                                textDecoration: 'none'
                            }}
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
                            style={{ color: active ? 'var(--primary)' : 'var(--text-muted)' }}
                        />
                        <span style={{
                            fontWeight: active ? '600' : '500',
                            color: active ? 'var(--primary)' : 'var(--text-muted)'
                        }}>
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
};

export default Footer;
