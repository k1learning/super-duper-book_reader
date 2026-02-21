import React, { useEffect, useState } from 'react';
import { getBooks } from '../db';
import BookCard from './BookCard';

const SavedView = ({ onOpenBook }) => {
    const [savedBooks, setSavedBooks] = useState([]);

    useEffect(() => {
        loadSavedBooks();
    }, []);

    const loadSavedBooks = async () => {
        const allBooks = await getBooks();
        // Filter for saved books
        // Note: Older books might not have the 'saved' property, so we check for === true
        const saved = allBooks.filter(book => book.saved === true);
        setSavedBooks(saved);
    };

    return (
        <div style={{ padding: '30px 50px', maxWidth: '1600px', margin: '0 auto', animation: 'fadeIn 0.3s ease-in-out' }}>
            <h1 style={{ marginBottom: '30px', color: 'var(--color-text)', fontSize: '28px' }}>Saved Books</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' }}>
                {savedBooks.map(book => (
                    <BookCard key={book.id} book={book} onClick={() => onOpenBook(book.id)} />
                ))}
            </div>

            {savedBooks.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '60px',
                    color: 'var(--color-text-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '15px'
                }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-card-bg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '10px'
                    }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </div>
                    <h3 style={{ margin: 0, color: 'var(--color-text)' }}>No saved books yet</h3>
                    <p style={{ margin: 0 }}>Books you save will appear here for quick access.</p>
                </div>
            )}
        </div>
    );
};

export default SavedView;
