import React from 'react';
import { Check } from 'lucide-react';

const ArchiveGrid = ({ books, selectionMode, selectedIds, onSelect, onOpenBook }) => {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '20px',
            padding: '20px',
            overflowY: 'auto',
            flex: 1
        }}>
            {books.map(book => {
                const isSelected = selectedIds.includes(book.id);
                return (
                    <div
                        key={book.id}
                        onClick={() => {
                            if (selectionMode) {
                                onSelect(book.id);
                            } else {
                                onOpenBook(book.id);
                            }
                        }}
                        style={{
                            position: 'relative',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            boxShadow: isSelected ? '0 0 0 2px var(--color-accent), var(--shadow-md)' : 'var(--shadow-sm)',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            backgroundColor: 'var(--color-card-bg)',
                            opacity: (selectionMode && !isSelected) ? 0.7 : 1,
                            transform: isSelected ? 'scale(0.95)' : 'scale(1)'
                        }}
                        onMouseEnter={(e) => {
                            if (!selectionMode) e.currentTarget.style.transform = 'translateY(-4px)';
                        }}
                        onMouseLeave={(e) => {
                            if (!selectionMode) e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        {/* Cover */}
                        <div style={{ height: '240px', overflow: 'hidden', backgroundColor: '#eee' }}>
                            <img
                                src={book.coverUrl}
                                alt={book.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>

                        {/* Status Badge */}
                        <div style={{
                            position: 'absolute', top: '10px', right: '10px',
                            backgroundColor: getStatusColor(book.status),
                            color: 'white',
                            fontSize: '10px', fontWeight: 'bold',
                            padding: '4px 8px', borderRadius: '12px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}>
                            {book.status}
                        </div>

                        {/* Selection Overlay */}
                        {selectionMode && (
                            <div style={{
                                position: 'absolute', top: '10px', left: '10px',
                                width: '24px', height: '24px', borderRadius: '50%',
                                backgroundColor: isSelected ? 'var(--color-accent)' : 'rgba(255,255,255,0.8)',
                                border: '1px solid var(--color-border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {isSelected && <Check size={14} color="white" />}
                            </div>
                        )}

                        {/* Info Footer */}
                        <div style={{ padding: '12px' }}>
                            <h3 style={{
                                margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                color: 'var(--color-text)'
                            }}>
                                {book.title}
                            </h3>
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-light)' }}>
                                {book.author || 'Unknown'}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const getStatusColor = (status) => {
    switch (status) {
        case 'Read': return '#10B981';
        case 'In Progress': return '#3B82F6';
        case 'Abandoned': return '#EF4444';
        default: return '#9CA3AF'; // To Read
    }
};

export default ArchiveGrid;
