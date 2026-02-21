import React from 'react';
import { Book, FileText, StickyNote } from 'lucide-react';

const ArchiveStats = ({ stats }) => {
    return (
        <div style={{ width: '250px', padding: '20px', borderLeft: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '30px', color: 'var(--color-text)' }}>Knowledge Snapshot</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <StatCard
                    icon={<Book size={20} color="var(--color-accent)" />}
                    label="Total Books"
                    value={stats.totalBooks || 0}
                />
                <StatCard
                    icon={<FileText size={20} color="#3B82F6" />}
                    label="Pages Read"
                    value={stats.totalPagesRead ? stats.totalPagesRead.toLocaleString() : 0}
                />
                <StatCard
                    icon={<StickyNote size={20} color="#F59E0B" />}
                    label="Notes Captured"
                    value={stats.totalNotes ? stats.totalNotes.toLocaleString() : 0}
                />
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value }) => (
    <div style={{
        backgroundColor: 'var(--color-card-bg)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.03)' }}>
                {icon}
            </div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-light)', fontWeight: '600' }}>{label}</span>
        </div>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-text)' }}>
            {value}
        </div>
    </div>
);

export default ArchiveStats;
