import React, { useEffect, useState } from 'react';
import { getBooks, updateBookDetails, deleteBooks } from '../db';
import BookCard from './BookCard';

const STATUS_OPTIONS = ['All', 'In Progress', 'Read', 'To Read', 'Abandoned'];

const Library = ({ onOpenBook, globalSearchQuery = '' }) => {
    const [books, setBooks] = useState([]);
    const [filter, setFilter] = useState('All');
    const [genreFilter, setGenreFilter] = useState('All');

    useEffect(() => {
        loadBooks();
        window.onBookAdded = loadBooks;
        return () => { window.onBookAdded = null; };
    }, []);

    const loadBooks = async () => {
        const allBooks = await getBooks();
        setBooks(allBooks);
    };

    const availableGenres = ['All', ...new Set(books.flatMap((b) => b.genres || (b.genre ? [b.genre] : [])))].filter(Boolean).sort();

    const filteredBooks = books.filter((book) => {
        const statusMatch = filter === 'All' || book.status === filter;
        const bookGenres = book.genres || (book.genre ? [book.genre] : []);
        const genreMatch = genreFilter === 'All' || bookGenres.includes(genreFilter);
        const searchMatch =
            !globalSearchQuery.trim() ||
            book.title.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
            (book.author || '').toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
            (book.genres || []).some((g) => g.toLowerCase().includes(globalSearchQuery.toLowerCase())) ||
            (book.notes || []).some((n) => n.content.toLowerCase().includes(globalSearchQuery.toLowerCase()));
        return statusMatch && genreMatch && searchMatch;
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

    return (
        <div style={{ padding: 'var(--space-6) var(--space-10)', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
            <h1 className="page-title" style={{ marginBottom: 'var(--space-2)' }}>
                Home
            </h1>
            <p className="label-meta" style={{ marginBottom: 'var(--space-6)' }}>
                Your reading and notes at a glance.
            </p>

            {/* Continue Reading - prominent */}
            {continueReading && (
                <div
                    style={{
                        marginBottom: 'var(--space-6)',
                        padding: 'var(--space-4)',
                        backgroundColor: 'var(--color-card-bg)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-5)',
                    }}
                >
                    <div
                        style={{
                            width: 80,
                            height: 120,
                            flexShrink: 0,
                            borderRadius: 'var(--radius-sm)',
                            backgroundImage: continueReading.coverUrl ? `url(${continueReading.coverUrl})` : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundColor: 'var(--color-bg-secondary)',
                        }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <span className="label-meta" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                            Continue reading
                        </span>
                        <h2 className="section-title" style={{ marginBottom: 'var(--space-1)' }}>
                            {continueReading.title}
                        </h2>
                        <p style={{ margin: 0, fontSize: 'var(--text-meta)', color: 'var(--color-text-light)' }}>
                            {continueReading.author || 'Unknown'} · Page {continueReading.currentPage}
                            {continueReading.totalPages > 0 ? ` of ${continueReading.totalPages}` : ''}
                        </p>
                    </div>
                    <button
                        className="btn-primary"
                        style={{ flexShrink: 0 }}
                        onClick={() => onOpenBook(continueReading.id)}
                    >
                        Continue
                    </button>
                </div>
            )}

            {/* Segmented control + genre */}
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    marginBottom: 'var(--space-5)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        backgroundColor: 'var(--color-card-bg)',
                        padding: 'var(--space-1)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-sm)',
                    }}
                >
                    {STATUS_OPTIONS.map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setFilter(cat)}
                            style={{
                                padding: 'var(--space-2) var(--space-4)',
                                backgroundColor: filter === cat ? 'var(--color-accent)' : 'transparent',
                                color: filter === cat ? '#fff' : 'var(--color-text-light)',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: 'var(--text-meta)',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <select
                    value={genreFilter}
                    onChange={(e) => setGenreFilter(e.target.value)}
                    style={{
                        padding: 'var(--space-2) var(--space-4)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-card-bg)',
                        color: 'var(--color-text)',
                        fontSize: 'var(--text-meta)',
                        fontWeight: 500,
                        cursor: 'pointer',
                    }}
                >
                    <option value="All">All genres</option>
                    {availableGenres.filter((g) => g !== 'All').map((g) => (
                        <option key={g} value={g}>
                            {g}
                        </option>
                    ))}
                </select>
            </div>

            {/* Grid 3-4 columns */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: 'var(--space-5)',
                }}
            >
                {filteredBooks.map((book) => (
                    <BookCard
                        key={book.id}
                        book={book}
                        onClick={onOpenBook}
                        onSaveToggle={handleSaveToggle}
                        onDelete={handleDelete}
                    />
                ))}
            </div>
            {filteredBooks.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-light)' }}>
                    <p style={{ margin: 0 }}>No books match your filters or search.</p>
                    <p style={{ margin: 'var(--space-2) 0 0 0', fontSize: 'var(--text-meta)' }}>Upload a PDF to get started.</p>
                </div>
            )}
        </div>
    );
};

export default Library;
