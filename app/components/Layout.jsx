'use client'

import React, { useState, useEffect } from 'react';
import { getLibraryStats, startSyncListener, getPendingMutationCount } from '../lib/db';
import { useAudio } from '../context/AudioContext';
import Sidebar from './Sidebar';
import Header from './Header';
import AddBookModal from './AddBookModal';
import AudioPlayerBar from './Audio/AudioPlayerBar';

const Layout = ({ children, onNavigate, activeView, globalSearchQuery, onGlobalSearchChange }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [stats, setStats] = useState({ totalBooks: 0, totalPagesRead: 0, totalNotes: 0 });
    const [online, setOnline] = useState(true);
    const [pending, setPending] = useState(0);
    const { visible: audioVisible, minimized: audioMinimized } = useAudio();

    useEffect(() => {
        const load = async () => {
            const s = await getLibraryStats();
            setStats(s);
            const queued = await getPendingMutationCount();
            setPending(queued);
        };
        load();
    }, [activeView, children]);

    useEffect(() => {
        setOnline(typeof navigator === 'undefined' ? true : navigator.onLine);
        const goOnline = () => setOnline(true);
        const goOffline = () => setOnline(false);
        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);
        startSyncListener(async () => {
            const queued = await getPendingMutationCount();
            setPending(queued);
        });
        return () => {
            window.removeEventListener('online', goOnline);
            window.removeEventListener('offline', goOffline);
        };
    }, []);

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
            <Sidebar onNavigate={onNavigate} activeView={activeView} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
                <Header
                    onAddBook={() => setIsModalOpen(true)}
                    searchValue={globalSearchQuery}
                    onSearchChange={onGlobalSearchChange}
                />
                <DashboardBar stats={stats} online={online} pending={pending} />
                <main
                    className={audioVisible ? (audioMinimized ? 'body-padding-audio audio-minimized' : 'body-padding-audio') : ''}
                    style={{ flex: 1, overflowY: 'auto', padding: 0, position: 'relative' }}
                >
                    {children}
                </main>
            </div>
            <AudioPlayerBar />
            {isModalOpen && <AddBookModal onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

function DashboardBar({ stats, online, pending }) {
    return (
        <div
            style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-6)',
                padding: 'var(--space-2) var(--space-10)',
                backgroundColor: 'var(--color-card-bg)',
                borderBottom: '1px solid var(--color-border)',
                minHeight: 44,
            }}
        >
            <MetricPill label="Books" value={stats.totalBooks ?? 0} />
            <MetricPill label="Pages read" value={stats.totalPagesRead ?? 0} />
            <MetricPill label="Notes" value={stats.totalNotes ?? 0} />
            <MetricPill label="Streak" value="—" placeholder />
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                {pending > 0 && (
                    <span
                        title="Changes queued for sync"
                        style={{
                            fontSize: 'var(--text-meta)',
                            color: '#9a3412',
                            background: '#fff7ed',
                            padding: '2px 8px',
                            borderRadius: 999,
                            border: '1px solid #fed7aa',
                        }}
                    >
                        {pending} pending sync
                    </span>
                )}
                <span
                    title={online ? 'Online' : 'Offline — changes will sync when you reconnect'}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 'var(--text-meta)',
                        color: online ? '#15803d' : '#b91c1c',
                    }}
                >
                    <span
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: online ? '#22c55e' : '#ef4444',
                        }}
                    />
                    {online ? 'Online' : 'Offline'}
                </span>
            </div>
        </div>
    );
}

function MetricPill({ label, value, placeholder }) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 'var(--space-1)',
                fontSize: 'var(--text-meta)',
                color: 'var(--color-text-light)',
            }}
        >
            <span className="label-meta">{label}</span>
            <span style={{ fontWeight: 700, color: placeholder ? 'var(--color-text-light)' : 'var(--color-text)', fontSize: 'var(--text-body)' }}>
                {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
        </div>
    );
}

export default Layout;

