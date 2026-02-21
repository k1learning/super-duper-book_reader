import React, { useEffect, useState } from 'react';
import { getBook, updateBookDetails } from '../db';
import {
    ArrowLeft,
    User,
    Hash,
    Percent,
    Shapes,
    MessageSquare,
    Star,
    BookOpen,
    Edit2,
    Plus,
    X,
    Save,
    Bookmark,
    StickyNote,
    Search,
    Headphones,
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import NotesPanel from './Reader/NotesPanel';

const BookDetailView = ({ bookId, onClose, onRead, onOpenCategory }) => {
    const { startTrack } = useAudio();
    const [book, setBook] = useState(null);
    const [isEditingAuthor, setIsEditingAuthor] = useState(false);
    const [authorInput, setAuthorInput] = useState('');
    const [showCategoryInput, setShowCategoryInput] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [reviewInput, setReviewInput] = useState('');
    const [showNotes, setShowNotes] = useState(false);
    const [notesSearchQuery, setNotesSearchQuery] = useState('');

    useEffect(() => {
        loadBook();
    }, [bookId]);

    const loadBook = async () => {
        const data = await getBook(bookId);
        setBook(data);
        if (data) {
            setAuthorInput(data.author || '');
            setReviewInput(data.review || '');
        }
    };

    const handleUpdate = async (updates) => {
        const updatedBook = await updateBookDetails(bookId, updates);
        setBook(updatedBook);
    };

    const toggleSave = async () => {
        await handleUpdate({ saved: !book.saved });
    };

    const saveAuthor = async () => {
        await handleUpdate({ author: authorInput });
        setIsEditingAuthor(false);
    };

    const saveStatus = async (newStatus) => {
        await handleUpdate({ status: newStatus });
    };

    const addCategory = async () => {
        if (newCategory.trim()) {
            const currentGenres = book.genres || (book.genre ? [book.genre] : []);
            if (!currentGenres.includes(newCategory.trim())) {
                await handleUpdate({ genres: [...currentGenres, newCategory.trim()] });
            }
            setNewCategory('');
            setShowCategoryInput(false);
        }
    };

    const removeCategory = async (genreToRemove) => {
        const currentGenres = book.genres || (book.genre ? [book.genre] : []);
        await handleUpdate({ genres: currentGenres.filter((g) => g !== genreToRemove) });
    };

    const saveReview = async () => {
        await handleUpdate({ review: reviewInput });
        setIsReviewOpen(false);
    };

    const saveRating = async (rating) => {
        await handleUpdate({ rating });
    };

    if (!book) return <div style={{ padding: 'var(--space-10)', textAlign: 'center' }}>Loading...</div>;

    const progress = book.totalPages > 0 ? (book.currentPage / book.totalPages) * 100 : 0;
    const genres = book.genres || (book.genre ? [book.genre] : []);
    const notes = book.notes || [];
    const recentNotes = notes.slice(0, 3);

    const metaCard = (title, children) => (
        <div
            style={{
                backgroundColor: 'var(--color-card-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
                boxShadow: 'var(--shadow-sm)',
            }}
        >
            <div className="label-meta" style={{ marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {title}
            </div>
            {children}
        </div>
    );

    return (
        <div style={{ padding: 'var(--space-6) var(--space-10)', maxWidth: 1200, margin: '0 auto' }}>
            <button
                onClick={onClose}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-light)',
                    fontWeight: 500,
                    marginBottom: 'var(--space-5)',
                    fontSize: 'var(--text-body)',
                }}
            >
                <ArrowLeft size={20} /> Back
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 'var(--space-8)', alignItems: 'start' }}>
                {/* LEFT COLUMN: Cover, summary, notes preview */}
                <div>
                    <div style={{ display: 'flex', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
                        <div
                            style={{
                                width: 200,
                                flexShrink: 0,
                                borderRadius: 'var(--radius-md)',
                                overflow: 'hidden',
                                boxShadow: 'var(--shadow-md)',
                            }}
                        >
                            <img
                                src={book.coverUrl}
                                alt={book.title}
                                style={{ width: '100%', height: 'auto', display: 'block', aspectRatio: '2/3', objectFit: 'cover' }}
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h1 className="page-title" style={{ marginBottom: 'var(--space-2)' }}>
                                {book.title}
                            </h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                                {isEditingAuthor ? (
                                    <>
                                        <input
                                            value={authorInput}
                                            onChange={(e) => setAuthorInput(e.target.value)}
                                            style={{
                                                padding: 'var(--space-2) var(--space-3)',
                                                borderRadius: 'var(--radius-sm)',
                                                border: '1px solid var(--color-border)',
                                                fontSize: 'var(--text-body)',
                                            }}
                                        />
                                        <button type="button" onClick={saveAuthor} style={{ padding: 'var(--space-1)' }}>
                                            <Save size={16} color="var(--color-accent)" />
                                        </button>
                                        <button type="button" onClick={() => setIsEditingAuthor(false)} style={{ padding: 'var(--space-1)' }}>
                                            <X size={16} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <span style={{ color: 'var(--color-text)' }}>{book.author || 'Unknown'}</span>
                                        <button type="button" onClick={() => setIsEditingAuthor(true)} style={{ padding: 'var(--space-1)' }}>
                                            <Edit2 size={14} color="var(--color-text-light)" />
                                        </button>
                                    </>
                                )}
                            </div>
                            <button
                                onClick={toggleSave}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-2)',
                                    padding: 'var(--space-2) var(--space-3)',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--color-border)',
                                    background: book.saved ? 'rgba(255, 127, 80, 0.1)' : 'transparent',
                                    color: book.saved ? 'var(--color-accent)' : 'var(--color-text-light)',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    fontSize: 'var(--text-meta)',
                                }}
                            >
                                <Bookmark size={16} fill={book.saved ? 'currentColor' : 'none'} /> {book.saved ? 'Saved' : 'Save'}
                            </button>
                        </div>
                    </div>

                    {/* Notes summary + recent + search */}
                    <div
                        style={{
                            backgroundColor: 'var(--color-card-bg)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--space-4)',
                            boxShadow: 'var(--shadow-sm)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                            <h3 className="section-title" style={{ margin: 0, fontSize: 'var(--text-h3)' }}>
                                Notes
                            </h3>
                            {notes.length > 0 && (
                                <span
                                    style={{
                                        fontSize: 'var(--text-meta)',
                                        fontWeight: 600,
                                        padding: '2px 8px',
                                        borderRadius: 'var(--radius-sm)',
                                        backgroundColor: 'var(--color-accent)',
                                        color: '#fff',
                                    }}
                                >
                                    {notes.length}
                                </span>
                            )}
                        </div>
                        <div style={{ marginBottom: 'var(--space-3)' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-2)',
                                    padding: 'var(--space-2) var(--space-3)',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--color-border)',
                                    backgroundColor: 'var(--color-bg)',
                                }}
                            >
                                <Search size={16} color="var(--color-text-light)" />
                                <input
                                    type="text"
                                    placeholder="Search within notes..."
                                    value={notesSearchQuery}
                                    onChange={(e) => setNotesSearchQuery(e.target.value)}
                                    style={{
                                        border: 'none',
                                        background: 'none',
                                        outline: 'none',
                                        flex: 1,
                                        fontSize: 'var(--text-meta)',
                                    }}
                                />
                            </div>
                        </div>
                        {recentNotes.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                {recentNotes.map((n) => (
                                    <div
                                        key={n.id}
                                        style={{
                                            padding: 'var(--space-2)',
                                            borderRadius: 'var(--radius-sm)',
                                            backgroundColor: 'var(--color-bg)',
                                            fontSize: 'var(--text-meta)',
                                            color: 'var(--color-text)',
                                        }}
                                    >
                                        <span className="label-meta">Page {n.page}</span>
                                        <p style={{ margin: 'var(--space-1) 0 0 0', whiteSpace: 'pre-wrap', overflow: 'hidden', textOverflow: 'ellipsis', maxHeight: 48 }}>
                                            {n.content}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ margin: 0, fontSize: 'var(--text-meta)', color: 'var(--color-text-light)' }}>No notes yet. Add some while reading.</p>
                        )}
                    </div>

                    {/* Review block - keep inline */}
                    <div style={{ marginTop: 'var(--space-4)' }}>
                        {metaCard(
                            'Review',
                            book.review ? (
                                <p style={{ margin: 0, fontSize: 'var(--text-body)', color: 'var(--color-text)' }}>"{book.review}"</p>
                            ) : (
                                <button type="button" className="btn-secondary" style={{ fontSize: 'var(--text-meta)' }} onClick={() => setIsReviewOpen(true)}>
                                    Write review
                                </button>
                            )
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Metadata cards + CTAs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    {metaCard(
                        'Reading status',
                        <StatusSelect currentStatus={book.status} onStatusChange={saveStatus} />
                    )}
                    {metaCard(
                        'Progress',
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{progress.toFixed(0)}%</span>
                                <span className="label-meta">Page {book.currentPage} of {book.totalPages || '—'}</span>
                            </div>
                            <div style={{ height: 6, backgroundColor: 'var(--color-border)', borderRadius: 3, overflow: 'hidden' }}>
                                <div
                                    style={{
                                        width: `${progress}%`,
                                        height: '100%',
                                        backgroundColor: 'var(--color-accent)',
                                        borderRadius: 3,
                                        transition: 'width 0.4s ease',
                                    }}
                                />
                            </div>
                        </>
                    )}
                    {metaCard(
                        'Rating',
                        <div style={{ display: 'flex', gap: 2 }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => saveRating(star)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                                >
                                    <Star
                                        size={20}
                                        fill={star <= (book.rating || 0) ? '#f59e0b' : 'none'}
                                        color={star <= (book.rating || 0) ? '#f59e0b' : 'var(--color-border)'}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                    {metaCard(
                        'Categories',
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                            {genres.map((g) => (
                                <span
                                    key={g}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        padding: '4px 10px',
                                        borderRadius: 'var(--radius-sm)',
                                        backgroundColor: 'var(--color-bg-secondary)',
                                        fontSize: 'var(--text-meta)',
                                        fontWeight: 500,
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => onOpenCategory?.(g)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit' }}
                                    >
                                        {g}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); removeCategory(g); }}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                            {showCategoryInput ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <input
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        placeholder="New"
                                        style={{ width: 70, padding: '4px 8px', fontSize: 'var(--text-meta)' }}
                                        onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                                        autoFocus
                                    />
                                    <button type="button" onClick={addCategory}><Plus size={14} /></button>
                                    <button type="button" onClick={() => setShowCategoryInput(false)}><X size={14} /></button>
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowCategoryInput(true)}
                                    style={{
                                        padding: '4px 8px',
                                        border: '1px dashed var(--color-border)',
                                        borderRadius: 'var(--radius-sm)',
                                        background: 'none',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <Plus size={14} />
                                </button>
                            )}
                        </div>
                    )}
                    {metaCard('Total pages', <span style={{ fontWeight: 600 }}>{book.totalPages || '—'}</span>)}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                        <button type="button" className="btn-primary" onClick={onRead} style={{ width: '100%' }}>
                            <BookOpen size={20} />
                            {book.currentPage > 1 ? 'Continue reading' : 'Start reading'}
                        </button>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setShowNotes(!showNotes)}
                            style={{ width: '100%' }}
                        >
                            <StickyNote size={20} />
                            View notes {notes.length > 0 && `(${notes.length})`}
                        </button>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => startTrack(book)}
                            style={{ width: '100%' }}
                        >
                            <Headphones size={20} />
                            Listen mode
                        </button>
                    </div>
                </div>
            </div>

            {showNotes && (
                <div style={{ marginTop: 'var(--space-6)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: 520 }}>
                    <NotesPanel book={book} onClose={() => setShowNotes(false)} onNoteAdded={loadBook} />
                </div>
            )}

            {isReviewOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000,
                    }}
                    onClick={() => setIsReviewOpen(false)}
                >
                    <div
                        style={{
                            backgroundColor: 'var(--color-card-bg)',
                            padding: 'var(--space-6)',
                            borderRadius: 'var(--radius-md)',
                            width: 480,
                            maxWidth: '90%',
                            boxShadow: 'var(--shadow-lg)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="section-title" style={{ marginBottom: 'var(--space-4)' }}>Write a review</h2>
                        <textarea
                            value={reviewInput}
                            onChange={(e) => setReviewInput(e.target.value)}
                            placeholder="What did you think?"
                            style={{
                                width: '100%',
                                minHeight: 120,
                                padding: 'var(--space-3)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--color-border)',
                                fontFamily: 'inherit',
                                fontSize: 'var(--text-body)',
                                resize: 'vertical',
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                            <button type="button" className="btn-secondary" onClick={() => setIsReviewOpen(false)}>Cancel</button>
                            <button type="button" className="btn-primary" onClick={saveReview}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatusSelect = ({ currentStatus, onStatusChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const getStatusConfig = (status) => {
        switch (status) {
            case 'To Read': return { label: 'To Read', color: '#9CA3AF', bg: '#E5E7EB' };
            case 'In Progress': return { label: 'Reading', color: '#3B82F6', bg: '#DBEAFE' };
            case 'Read': return { label: 'Completed', color: '#10B981', bg: '#D1FAE5' };
            case 'Abandoned': return { label: 'Abandoned', color: '#EF4444', bg: '#FEE2E2' };
            default: return { label: status, color: '#6B7280', bg: '#F3F4F6' };
        }
    };
    const currentConfig = getStatusConfig(currentStatus);
    return (
        <div style={{ position: 'relative' }}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    backgroundColor: currentConfig.bg,
                    color: 'var(--color-text)',
                    border: 'none',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--text-meta)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                }}
            >
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: currentConfig.color }} />
                {currentConfig.label}
            </button>
            {isOpen && (
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setIsOpen(false)} />
                    <div
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            marginTop: 4,
                            backgroundColor: 'var(--color-card-bg)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-md)',
                            zIndex: 11,
                            padding: 'var(--space-2)',
                            minWidth: 160,
                        }}
                    >
                        {['To Read', 'In Progress', 'Read', 'Abandoned'].map((status) => {
                            const config = getStatusConfig(status);
                            return (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => { onStatusChange(status); setIsOpen(false); }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-2)',
                                        width: '100%',
                                        padding: 'var(--space-2) var(--space-3)',
                                        border: 'none',
                                        background: currentStatus === status ? 'var(--color-bg)' : 'transparent',
                                        borderRadius: 'var(--radius-sm)',
                                        cursor: 'pointer',
                                        fontSize: 'var(--text-meta)',
                                        textAlign: 'left',
                                    }}
                                >
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: config.color }} />
                                    {config.label}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export default BookDetailView;
