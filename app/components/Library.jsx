'use client'

import React, { useEffect, useState } from 'react';
import { getBooks, updateBookDetails, deleteBooks } from '../lib/db';
import BookCard from './BookCard';

const STATUS_OPTIONS = ['All', 'In Progress', 'Read', 'To Read', 'Abandoned'];

const Library = ({ onOpenBook, globalSearchQuery = '' }) => {
    const [books, setBooks] = useState([]);
    const [filter, setFilter] = useState('All');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBooks();
        window.onBookAdded = loadBooks;
        return () => { window.onBookAdded = null; };
    }, []);

    const loadBooks = async () => {
        try {
            setLoading(true);
            const allBooks = await getBooks();
            setBooks(allBooks);
            setError(null);
        } catch (err) {
            console.error('Failed to load books:', err);
            setError(err.message || 'Failed to load books');
        } finally {
            setLoading(false);
        }
    };

    const filteredBooks = books.filter((book) => {
        const statusMatch = filter === 'All' || book.status === filter;
        const searchMatch =
            !globalSearchQuery.trim() ||
            book.title.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
            (book.author || '').toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
            (book.genres || []).some((g) => g.toLowerCase().includes(globalSearchQuery.toLowerCase())) ||
            (book.notes || []).some((n) => n.content.toLowerCase().includes(globalSearchQuery.toLowerCase()));
        return statusMatch && searchMatch;
    });

    const continueReading = books.filter((b) => b.status === 'In Progress').sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))[0];

    const handleSaveToggle = async (book) => {
        await updateBookDetails(book.id, { saved: !book.saved });
        loadBooks();
    };

    const handleDelete = async (book) => {
        if (!window.confirm(`Delete "${book.title}"?`)) return;
        await deleteBooks([book.id]);
        loadBooks();
    };

    if (error) {
        return (
            <div style={{ padding: 40, color: 'var(--color-text)', textAlign: 'center' }}>
                <h2 style={{ marginBottom: 16 }}>Error loading library</h2>
                <pre style={{ color: '#ef4444', marginBottom: 16, whiteSpace: 'pre-wrap', background: 'rgba(255,0,0,0.1)', padding: 16, borderRadius: 8, display: 'inline-block' }}>
                    {error}
                </pre>
                <div style={{ marginTop: 16 }}>
                    <button
                        onClick={loadBooks}
                        style={{
                            padding: '8px 16px',
                            background: 'var(--color-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer'
                        }}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (loading && books.length === 0) {
        return <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-light)' }}>Loading library...</div>;
    }

    return (
        <div style={{ padding: 'var(--space-6) var(--space-10) var(--space-10)', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <div>
                    <h1 className="page-title" style={{ marginBottom: 'var(--space-1)' }}>Home</h1>
                    <p className="label-meta">Your reading and notes at a glance.</p>
                </div>
                <span className="label-meta" style={{ fontWeight: 600 }}>
                    {filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'}
                </span>
            </div>

            {continueReading && (
                <ContinueReadingCard book={continueReading} onOpen={() => onOpenBook(continueReading.id)} />
            )}

            <div className="filter-row">
                {STATUS_OPTIONS.map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`filter-chip ${filter === status ? 'active' : ''}`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            <div className="book-grid">
                {filteredBooks.map((book) => (
                    <BookCard
                        key={book.id}
                        book={book}
                        onClick={() => onOpenBook(book.id)}
                        onSaveToggle={() => handleSaveToggle(book)}
                        onDelete={() => handleDelete(book)}
                    />
                ))}
                {filteredBooks.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-light)' }}>
                        No books found.
                    </div>
                )}
            </div>
        </div>
    );
};

function ContinueReadingCard({ book, onOpen }) {
    const progress = book.totalPages > 0 ? (book.currentPage / book.totalPages) * 100 : 0;
    const notesCount = (book.notes || []).length;
    return (
        <div className="continue-card card-hover" onClick={onOpen} role="button" tabIndex={0}>
            <div className="continue-card-cover">
                {book.coverUrl ? (
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${book.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-light)' }}>
                        <span style={{ fontSize: 32 }}>📖</span>
                    </div>
                )}
                <span className="continue-card-badge">Reading</span>
                {notesCount > 0 && (
                    <span className="continue-card-notes">{notesCount} note{notesCount === 1 ? '' : 's'}</span>
                )}
            </div>
            <div className="continue-card-body">
                <span className="label-meta" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Continue reading</span>
                <h2 className="section-title" style={{ margin: 'var(--space-1) 0 var(--space-2) 0' }}>{book.title}</h2>
                <p style={{ margin: 0, fontSize: 'var(--text-meta)', color: 'var(--color-text-light)' }}>
                    {book.author || 'Unknown'}
                </p>
                <div className="continue-card-progress">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-caption)', color: 'var(--color-text-light)', marginBottom: 4 }}>
                        <span>Page {book.currentPage}{book.totalPages > 0 ? ` of ${book.totalPages}` : ''}</span>
                        <span>{progress.toFixed(0)}%</span>
                    </div>
                    <div className="continue-card-bar"><div style={{ width: `${progress}%` }} /></div>
                </div>
                <button
                    type="button"
                    className="btn-primary"
                    onClick={(e) => { e.stopPropagation(); onOpen(); }}
                    style={{ alignSelf: 'flex-start' }}
                >
                    Continue
                </button>
            </div>
        </div>
    );
}

export default Library;
