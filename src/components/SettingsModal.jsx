import React from 'react';
import { X, ChevronRight } from 'lucide-react';

const SettingsModal = ({ onClose }) => {
    const menuItems = [
        "App Language",
        "Notification",
        "Gift Headway",
        "Explore Headway for Business",
        "Privacy Policy",
        "Terms of Use",
        "Subscription Terms",
        "Manage Subscription",
        "Logout"
    ];

    return (
        <div style={{
            position: 'fixed',
            top: 0, right: 0, bottom: 0,
            width: '100%', maxWidth: '400px',
            backgroundColor: 'var(--color-bg)',
            boxShadow: '-5px 0 20px rgba(0,0,0,0.1)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideInRight 0.3s ease-out',
            borderLeft: '1px solid var(--color-border)'
        }}>
            {/* Header */}
            <div style={{
                padding: '20px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h2 style={{ margin: 0, fontFamily: 'monospace', fontSize: '20px' }}>Settings</h2>
                <button
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}
                >
                    <X size={24} />
                </button>
            </div>

            {/* Menu Items */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {menuItems.map((item, index) => (
                    <div
                        key={item}
                        style={{
                            padding: '20px',
                            borderBottom: '1px solid var(--color-border)',
                            fontSize: '16px',
                            fontWeight: '500',
                            fontFamily: 'monospace',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            color: 'var(--color-text)'
                        }}
                        className="settings-item"
                    >
                        {item}
                        {/* No arrow in screenshot, but acts like link. Keeping clean as per image. */}
                    </div>
                ))}
            </div>

            {/* Footer Actions */}
            <div style={{ padding: '30px 20px', textAlign: 'center' }}>
                <button style={{
                    width: '100%',
                    padding: '15px',
                    backgroundColor: 'var(--color-accent)', // Orange
                    color: '#fff',
                    border: '1px solid #000', // Slight border as seen in some brutalist designs or just matching theme
                    border: 'none',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    marginBottom: '20px',
                    borderRadius: '0' // Boxy look from screenshot? actually screenshot has square buttons
                }}>
                    Contact Support
                </button>

                <div style={{ fontSize: '14px', fontFamily: 'monospace', color: 'var(--color-text-light)' }}>
                    Version 264.2.0.5566
                </div>
            </div>

            <style>
                {`
                    @keyframes slideInRight {
                        from { transform: translateX(100%); }
                        to { transform: translateX(0); }
                    }
                    .settings-item:hover {
                        background-color: rgba(0,0,0,0.02);
                    }
                `}
            </style>
        </div>
    );
};

export default SettingsModal;
