import React from 'react';

/**
 * Single page (left or right) in the open book spread.
 * Renders notes with proper book-like typography and margins.
 */
const BookPage = ({ pageNumber, notes = [], bookTitle, renderNoteContent, className = '' }) => {
    return (
        <div className={`book-page ${className}`.trim()} data-page={pageNumber}>
            <div className="book-page-inner">
                <div className="book-page-header">{bookTitle}</div>
                <div className="book-page-content">
                    {notes.length === 0 ? (
                        <p className="book-page-empty">No notes on this page.</p>
                    ) : (
                        notes.map((note) => (
                            <div key={note.id} className="book-note-block">
                                <div className="book-note-ref">Page {note.page}</div>
                                {renderNoteContent(note)}
                            </div>
                        ))
                    )}
                </div>
                <div className="book-page-footer">{String(pageNumber).padStart(2, '0')}</div>
            </div>
        </div>
    );
};

export default BookPage;
