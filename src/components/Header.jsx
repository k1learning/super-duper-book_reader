import React, { useState } from 'react';
import { Search, Bell, ChevronDown, Plus } from 'lucide-react';
import SettingsModal from './SettingsModal';

const Header = ({ onAddBook, searchValue = '', onSearchChange }) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    return (
        <header
            style={{
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 var(--space-10)',
                backgroundColor: 'var(--color-card-bg)',
                borderBottom: '1px solid var(--color-border)',
                zIndex: 10,
                flexShrink: 0,
            }}
        >
            <div
                className="search-bar"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'var(--color-bg)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-2) var(--space-4)',
                    width: 'min(420px, 100%)',
                    border: '1px solid var(--color-border)',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                }}
            >
                <Search size={18} color="var(--color-text-light)" style={{ marginRight: 'var(--space-2)', flexShrink: 0 }} />
                <input
                    type="text"
                    placeholder="Title, author, notes, or category..."
                    value={searchValue}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    style={{
                        border: 'none',
                        outline: 'none',
                        fontSize: 'var(--text-body)',
                        width: '100%',
                        color: 'var(--color-text)',
                        background: 'transparent',
                        fontFamily: 'inherit',
                    }}
                />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
                <button
                    onClick={onAddBook}
                    className="btn-primary"
                >
                    <Plus size={18} /> New Upload
                </button>

                <div style={{ width: 1, height: 24, backgroundColor: 'var(--color-border)' }} />

                <div
                    className="user-profile"
                    onClick={() => setIsSettingsOpen(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        cursor: 'pointer',
                        padding: 'var(--space-1) var(--space-2)',
                        borderRadius: 'var(--radius-sm)',
                        transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                    <div style={{ position: 'relative' }}>
                        <img
                            src="https://i.pravatar.cc/150?img=11"
                            alt="Profile"
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '2px solid var(--color-border)',
                            }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                width: 8,
                                height: 8,
                                backgroundColor: '#2ecc71',
                                borderRadius: '50%',
                                border: '2px solid var(--color-card-bg)',
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, fontSize: 'var(--text-meta)', color: 'var(--color-text)' }}>
                            Bruce Wayne
                        </span>
                        <span style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-light)' }}>
                            Premium Member
                        </span>
                    </div>
                    <ChevronDown size={14} color="var(--color-text-light)" />
                </div>

                <button
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        position: 'relative',
                        padding: 'var(--space-2)',
                        borderRadius: 'var(--radius-sm)',
                        transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                    <Bell size={20} color="var(--color-text)" />
                    <span
                        style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            width: 6,
                            height: 6,
                            backgroundColor: 'var(--color-accent)',
                            borderRadius: '50%',
                        }}
                    />
                </button>
            </div>

            {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
        </header>
    );
};

export default Header;
