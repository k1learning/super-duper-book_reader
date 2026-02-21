import React, { useState } from 'react';
import { Home, Grid, BookOpen, Bookmark, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';

const SIDEBAR_WIDTH = 88;
const SIDEBAR_WIDTH_COLLAPSED = 56;

const Sidebar = ({ onNavigate, activeView }) => {
    const [collapsed, setCollapsed] = useState(false);
    const width = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH;

    return (
        <div
            className="sidebar"
            style={{
                position: 'relative',
                width: `${width}px`,
                minWidth: `${width}px`,
                height: '100%',
                backgroundColor: 'var(--color-card-bg)',
                borderRight: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: 'var(--space-4) 0',
                boxSizing: 'border-box',
                zIndex: 10,
                transition: 'width 0.2s ease',
                boxShadow: 'var(--shadow-sm)',
            }}
        >
            <div style={{ marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div
                    style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: 'var(--color-accent)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(255, 127, 80, 0.35)',
                        transition: 'transform 0.2s ease',
                    }}
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                </div>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', flex: 1 }}>
                <NavItem icon={<Home size={22} />} label="Home" active={activeView === 'home'} onClick={() => onNavigate('home')} collapsed={collapsed} />
                <NavItem icon={<Grid size={22} />} label="Category" active={activeView === 'categories' || activeView === 'category'} onClick={() => onNavigate('categories')} collapsed={collapsed} />
                <NavItem icon={<BookOpen size={22} />} label="Library" active={activeView === 'archive'} onClick={() => onNavigate('archive')} collapsed={collapsed} />
                <NavItem icon={<Bookmark size={22} />} label="Saved" active={activeView === 'saved'} onClick={() => onNavigate('saved')} collapsed={collapsed} />
            </nav>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginBottom: 'var(--space-4)' }}>
                <NavItem icon={<Settings size={22} />} label="Settings" collapsed={collapsed} />
                <NavItem icon={<LogOut size={22} />} label="Logout" collapsed={collapsed} />
            </div>

            <button
                onClick={() => setCollapsed(!collapsed)}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                style={{
                    position: 'absolute',
                    left: width - 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-card-bg)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-text-light)',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'transform 0.2s ease, color 0.2s ease',
                    zIndex: 11,
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--color-accent)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--color-text-light)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                }}
            >
                {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
        </div>
    );
};

const NavItem = ({ icon, label, active, onClick, collapsed }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const isClickable = !!onClick;

    return (
        <div
            style={{ position: 'relative' }}
            onMouseEnter={() => collapsed && setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <div
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onClick={isClickable ? onClick : undefined}
                onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
                className={`nav-item ${active ? 'active' : ''}`}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: isClickable ? 'pointer' : 'default',
                    color: active ? 'var(--color-accent)' : 'var(--color-text-light)',
                    gap: '6px',
                    padding: 'var(--space-2) var(--space-2)',
                    borderRadius: 'var(--radius-sm)',
                    transition: 'color 0.2s ease, background 0.2s ease',
                    minWidth: collapsed ? 40 : 72,
                    backgroundColor: active ? 'rgba(255, 127, 80, 0.1)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                    if (isClickable) e.currentTarget.style.color = 'var(--color-accent)';
                    if (isClickable && !active) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)';
                }}
                onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.color = 'var(--color-text-light)';
                    e.currentTarget.style.backgroundColor = active ? 'rgba(255, 127, 80, 0.1)' : 'transparent';
                }}
            >
                {icon}
                {!collapsed && <span style={{ fontSize: '11px', fontWeight: '600' }}>{label}</span>}
            </div>
            {active && !collapsed && (
                <div
                    style={{
                        position: 'absolute',
                        right: '-20px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '4px',
                        height: '24px',
                        backgroundColor: 'var(--color-accent)',
                        borderRadius: '2px 0 0 2px',
                    }}
                />
            )}
            {collapsed && showTooltip && (
                <div
                    style={{
                        position: 'fixed',
                        left: 60,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'var(--color-text)',
                        color: '#fff',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px',
                        fontWeight: '500',
                        whiteSpace: 'nowrap',
                        zIndex: 1000,
                        boxShadow: 'var(--shadow-md)',
                        pointerEvents: 'none',
                    }}
                >
                    {label}
                </div>
            )}
        </div>
    );
};

export default Sidebar;
