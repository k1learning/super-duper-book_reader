import React, { useState } from 'react';
import { Bookmark, Clock, FileText, StickyNote, Star, Trash2, Edit3 } from 'lucide-react';

const BookCard = ({ book, onClick, onSaveToggle, onDelete }) => {
    const [showActions, setShowActions] = useState(false);
    const { title, author, coverUrl, currentPage, totalPages, status, notes = [], rating = 0, saved } = book;
    const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;
    const pagesLeft = totalPages > 0 ? Math.max(0, totalPages - currentPage) : null;
    const notesCount = notes.length;

    const handleAction = (e, fn) => {
        e.stopPropagation();
        fn?.(book);
    };

    return (
        <div
            className="card-hover"
            onClick={() => onClick(book.id)}
            style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                backgroundColor: 'var(--color-card-bg)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer',
                border: '1px solid var(--color-border)',
            }}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            {/* Cover + overlay actions */}
            <div style={{ position: 'relative', paddingTop: '140%', backgroundColor: 'var(--color-bg-secondary)', overflow: 'hidden' }}>
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: coverUrl ? `url(${coverUrl})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
                {!coverUrl && (
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-text-light)',
                        }}
                    >
                        <FileText size={40} />
                    </div>
                )}
                {/* Top badges */}
                <div style={{ position: 'absolute', top: 'var(--space-2)', left: 'var(--space-2)', right: 'var(--space-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span
                        style={{
                            fontSize: 'var(--text-caption)',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            color: '#fff',
                        }}
                    >
                        {status === 'In Progress' ? 'Reading' : status}
                    </span>
                    {notesCount > 0 && (
                        <span
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 'var(--text-caption)',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'var(--color-accent)',
                                color: '#fff',
                            }}
                        >
                            <StickyNote size={12} /> {notesCount}
                        </span>
                    )}
                </div>
                {/* Hover quick actions */}
                {showActions && (
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 'var(--space-2)',
                            padding: 'var(--space-2)',
                            transition: 'opacity 0.2s ease',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ActionBtn title="Open" onClick={(e) => handleAction(e, () => onClick(book.id))} icon={<Edit3 size={18} />} />
                        {onSaveToggle && (
                            <ActionBtn
                                title={saved ? 'Unsave' : 'Save'}
                                onClick={(e) => handleAction(e, onSaveToggle)}
                                icon={<Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />}
                            />
                        )}
                        {onDelete && (
                            <ActionBtn title="Delete" onClick={(e) => handleAction(e, onDelete)} icon={<Trash2 size={18} />} danger />
                        )}
                    </div>
                )}
            </div>

            {/* Info */}
            <div style={{ padding: 'var(--space-3)', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <h3
                    style={{
                        margin: '0 0 var(--space-1) 0',
                        fontSize: 'var(--text-body)',
                        fontWeight: 600,
                        color: 'var(--color-text)',
                        lineHeight: 1.3,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                    }}
                >
                    {title}
                </h3>
                <p style={{ margin: 0, fontSize: 'var(--text-meta)', color: 'var(--color-text-light)' }}>
                    {author || 'Unknown Author'}
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
                    {(book.genres || (book.genre ? [book.genre] : [])).slice(0, 2).map((g) => (
                        <span
                            key={g}
                            style={{
                                fontSize: 'var(--text-caption)',
                                backgroundColor: 'var(--color-bg-secondary)',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--color-text)',
                                fontWeight: 500,
                            }}
                        >
                            {g}
                        </span>
                    ))}
                </div>
                <div style={{ marginTop: 'auto', paddingTop: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-caption)', color: 'var(--color-text-light)', marginBottom: 'var(--space-1)' }}>
                        <span>{totalPages > 0 ? `${totalPages} pp` : '—'}</span>
                        {pagesLeft != null && <span>{pagesLeft} left</span>}
                    </div>
                    <div style={{ width: '100%', height: 4, backgroundColor: 'var(--color-border)', borderRadius: 2, overflow: 'hidden' }}>
                        <div
                            style={{
                                width: `${progress}%`,
                                height: '100%',
                                backgroundColor: 'var(--color-accent)',
                                borderRadius: 2,
                                transition: 'width 0.4s ease',
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Primary CTA */}
            <div style={{ padding: 'var(--space-2) var(--space-3)', borderTop: '1px solid var(--color-border)' }}>
                <button
                    className="btn-primary"
                    style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-meta)' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onClick(book.id);
                    }}
                >
                    {status === 'In Progress' ? 'Continue' : 'Read'}
                </button>
            </div>
        </div>
    );
};

function ActionBtn({ icon, title, onClick, danger }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: danger ? 'rgba(239,68,68,0.9)' : 'rgba(255,255,255,0.95)',
                color: danger ? '#fff' : 'var(--color-text)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
            {icon}
        </button>
    );
}

export default BookCard;
