import React, { useState, useMemo, useCallback } from 'react';
import { X, Plus } from 'lucide-react';
import { addNote, updateNote, deleteNote } from '../../db';
import BookPage from './BookPage';
import PageNavigation from './PageNavigation';

const NOTES_PER_PAGE = 5;
const MOBILE_BREAKPOINT = 768;

const BookNotesView = ({ book, onClose, onNoteAdded }) => {
    const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [newNote, setNewNote] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const sortedNotes = useMemo(() => {
        if (!book?.notes?.length) return [];
        return [...book.notes].sort((a, b) => a.page - b.page || a.timestamp - b.timestamp);
    }, [book?.notes]);

    const notesWithNew = useMemo(() => {
        if (!isAdding) return sortedNotes;
        const newEntry = { id: '__new__', page: book?.currentPage || 1, content: newNote, timestamp: Date.now() };
        return [newEntry, ...sortedNotes];
    }, [sortedNotes, isAdding, newNote, book?.currentPage]);

    const pageContents = useMemo(() => {
        const pages = [];
        let idx = 0;
        while (idx < notesWithNew.length) {
            pages.push(notesWithNew.slice(idx, idx + NOTES_PER_PAGE));
            idx += NOTES_PER_PAGE;
        }
        if (pages.length === 0) pages.push([]);
        return pages;
    }, [notesWithNew]);

    const totalSpreads = Math.ceil(pageContents.length / 2);
    const safeSpreadIndex = Math.min(currentSpreadIndex, Math.max(0, totalSpreads - 1));
    const leftPageNotes = pageContents[safeSpreadIndex * 2] || [];
    const rightPageNotes = pageContents[safeSpreadIndex * 2 + 1] || [];
    const leftPageNum = safeSpreadIndex * 2 + 1;
    const rightPageNum = safeSpreadIndex * 2 + 2;

    const isMobile = typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT;

    const saveOnBlur = useCallback(
        (noteId) => {
            if (noteId === '__new__' || editingId !== noteId || !editContent.trim()) return;
            updateNote(book.id, noteId, editContent.trim()).then(() => {
                onNoteAdded();
                setEditingId(null);
                setEditContent('');
            });
        },
        [book?.id, editingId, editContent, onNoteAdded]
    );

    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        await addNote(book.id, book.currentPage || 1, newNote.trim());
        setNewNote('');
        setIsAdding(false);
        onNoteAdded();
    };

    const startEdit = (note) => {
        if (note.id === '__new__') return;
        setEditingId(note.id);
        setEditContent(note.content);
    };

    const saveEdit = () => {
        if (editingId == null) return;
        if (editingId === '__new__') return;
        updateNote(book.id, editingId, editContent.trim()).then(() => {
            setEditingId(null);
            setEditContent('');
            onNoteAdded();
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditContent('');
    };

    const handleDelete = async (noteId) => {
        if (noteId === '__new__') return;
        if (!window.confirm('Delete this note?')) return;
        await deleteNote(book.id, noteId);
        if (editingId === noteId) cancelEdit();
        onNoteAdded();
    };

    const renderNoteContent = (note) => {
        const isNew = note.id === '__new__';
        const isEditing = editingId === note.id;

        if (isNew) {
            return (
                <div className="book-note-edit-wrap">
                    <textarea
                        className="book-note-textarea"
                        placeholder="Write your note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        autoFocus
                    />
                    <div className="book-note-actions">
                        <button type="button" className="book-note-btn primary" onClick={handleAddNote} disabled={!newNote.trim()}>
                            Save
                        </button>
                        <button type="button" className="book-note-btn" onClick={() => { setIsAdding(false); setNewNote(''); }}>
                            Cancel
                        </button>
                    </div>
                </div>
            );
        }

        if (isEditing) {
            return (
                <div className="book-note-edit-wrap">
                    <textarea
                        className="book-note-textarea"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onBlur={() => saveOnBlur(note.id)}
                        autoFocus
                    />
                    <div className="book-note-actions">
                        <button type="button" className="book-note-btn primary" onClick={saveEdit}>Save</button>
                        <button type="button" className="book-note-btn" onClick={cancelEdit}>Cancel</button>
                        <button type="button" className="book-note-btn danger" onClick={() => handleDelete(note.id)}>Delete</button>
                    </div>
                </div>
            );
        }

        return (
            <p
                className="book-note-text"
                onClick={() => startEdit(note)}
                title="Click to edit"
            >
                {note.content}
            </p>
        );
    };

    return (
        <div className="book-notes-view">
            <header className="book-notes-header">
                <div className="book-notes-header-info">
                    <h1 className="book-notes-title">{book?.title}</h1>
                    <p className="book-notes-author">{book?.author || 'Unknown author'}</p>
                </div>
                <div className="book-notes-header-actions">
                    {sortedNotes.length > 0 && (
                        <span className="book-notes-badge">{sortedNotes.length} note{sortedNotes.length !== 1 ? 's' : ''}</span>
                    )}
                    {!isAdding && (
                        <button type="button" className="book-notes-add-btn" onClick={() => setIsAdding(true)}>
                            <Plus size={18} /> Add note
                        </button>
                    )}
                    <button type="button" className="book-notes-close" onClick={onClose} aria-label="Close">
                        <X size={22} />
                    </button>
                </div>
            </header>

            <div className={`book-notes-spread ${isMobile ? 'single-page' : ''}`}>
                <div className="book-notes-pages">
                    <BookPage
                        pageNumber={leftPageNum}
                        notes={leftPageNotes}
                        bookTitle={book?.title}
                        renderNoteContent={renderNoteContent}
                    />
                    {!isMobile && (
                        <BookPage
                            pageNumber={rightPageNum}
                            notes={rightPageNotes}
                            bookTitle={book?.title}
                            renderNoteContent={renderNoteContent}
                            className="book-page-right"
                        />
                    )}
                </div>
                {totalSpreads > 1 && (
                    <PageNavigation
                        currentSpreadIndex={safeSpreadIndex}
                        totalSpreads={totalSpreads}
                        onPrev={() => setCurrentSpreadIndex((i) => Math.max(0, i - 1))}
                        onNext={() => setCurrentSpreadIndex((i) => Math.min(totalSpreads - 1, i + 1))}
                        leftPageNum={leftPageNum}
                        rightPageNum={rightPageNum}
                    />
                )}
            </div>
        </div>
    );
};

export default BookNotesView;
