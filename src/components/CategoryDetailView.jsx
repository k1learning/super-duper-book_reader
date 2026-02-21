import React, { useEffect, useState } from 'react';
import { getBooks } from '../db';
import { ArrowLeft, BookOpen, Calendar, ChevronRight, Quote, Download } from 'lucide-react';

const CategoryDetailView = ({ category, onClose, onOpenBook }) => {
    const [books, setBooks] = useState([]);
    const [insights, setInsights] = useState([]);
    const [hoveredBookId, setHoveredBookId] = useState(null);

    useEffect(() => {
        loadCategoryData();
    }, [category]);

    const loadCategoryData = async () => {
        const allBooks = await getBooks();
        // Filter books that match the category
        const categoryBooks = allBooks.filter(b => {
            const bGenres = b.genres || (b.genre ? [b.genre] : []);
            return bGenres.includes(category);
        });
        setBooks(categoryBooks);

        // Extract notes (insights) from these books
        // Flatten array: { ...note, bookTitle, bookId, bookCover }
        const allInsights = categoryBooks.flatMap(b => {
            return (b.notes || []).map(n => ({
                ...n,
                bookTitle: b.title,
                bookId: b.id,
                bookCover: b.coverUrl
            }));
        });

        // Sort by timestamp descending (newest first)
        allInsights.sort((a, b) => b.timestamp - a.timestamp);
        setInsights(allInsights);
    };

    const handleDownloadSummary = () => {
        alert("Downloading summary (simulation)...");
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', backgroundColor: 'var(--color-bg)' }}>

            {/* Top Bar */}
            <div style={{
                height: '80px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 40px',
                backgroundColor: 'var(--color-card-bg)',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--color-text-light)' }}>
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '24px', color: 'var(--color-text)' }}>{category}</h1>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>{books.length} Books • {insights.length} Insights</span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '18px', fontWeight: 'bold', color: 'var(--color-accent)' }}>{insights.length}</span>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-text-light)', letterSpacing: '1px' }}>Total Insights</span>
                    </div>
                    <button
                        onClick={handleDownloadSummary}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: 'white',
                            border: '1px solid var(--color-border)',
                            borderRadius: '30px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: 'var(--color-text)',
                            boxShadow: 'var(--shadow-sm)'
                        }}
                    >
                        <Download size={16} /> Download Summary
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* Sidebar (Left) */}
                <div style={{
                    width: '350px',
                    borderRight: '1px solid var(--color-border)',
                    overflowY: 'auto',
                    padding: '30px',
                    backgroundColor: '#fafafa'
                }}>
                    <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-light)' }}>
                        Books in {category}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {books.map(book => {
                            const progress = book.totalPages > 0 ? (book.currentPage / book.totalPages) * 100 : 0;
                            const isHovered = hoveredBookId === book.id;

                            return (
                                <div
                                    key={book.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '15px',
                                        padding: '15px',
                                        backgroundColor: isHovered ? 'white' : 'transparent',
                                        borderRadius: '12px',
                                        border: isHovered ? '1px solid var(--color-accent)' : '1px solid transparent',
                                        transition: 'all 0.2s',
                                        boxShadow: isHovered ? '0 4px 12px rgba(255, 127, 80, 0.15)' : 'none',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => onOpenBook(book.id)}
                                >
                                    <img
                                        src={book.coverUrl}
                                        alt={book.title}
                                        style={{ width: '50px', height: '75px', objectFit: 'cover', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--color-text)', marginBottom: '4px' }}>{book.title}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>{book.author}</div>
                                    </div>

                                    {/* Circular Progress */}
                                    <div style={{ width: '40px', height: '40px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width="40" height="40" viewBox="0 0 40 40">
                                            <circle cx="20" cy="20" r="16" fill="none" stroke="#eee" strokeWidth="3" />
                                            <circle
                                                cx="20" cy="20" r="16" fill="none" stroke="var(--color-accent)" strokeWidth="3"
                                                strokeDasharray={`${progress}, 100`}
                                                pathLength="100"
                                                strokeLinecap="round"
                                                transform="rotate(-90 20 20)"
                                            />
                                        </svg>
                                        <span style={{ position: 'absolute', fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text)' }}>{Math.round(progress)}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content (Insight Feed) */}
                <div style={{ flex: 1, padding: '40px 60px', overflowY: 'auto' }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <h2 style={{ fontSize: '24px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            Insight Feed <span style={{ fontSize: '14px', fontWeight: 'normal', color: 'var(--color-text-light)', padding: '4px 10px', backgroundColor: '#eee', borderRadius: '20px' }}>Latest Updates</span>
                        </h2>

                        <div style={{ position: 'relative', paddingLeft: '30px', borderLeft: '2px solid #eee' }}>
                            {insights.length === 0 ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-light)', fontStyle: 'italic' }}>
                                    No notes yet. Start reading and taking notes to populate your insight feed!
                                </div>
                            ) : (
                                insights.map((insight, index) => (
                                    <div
                                        key={index}
                                        style={{ marginBottom: '40px', position: 'relative' }}
                                        onMouseEnter={() => setHoveredBookId(insight.bookId)}
                                        onMouseLeave={() => setHoveredBookId(null)}
                                    >
                                        {/* Timeline Dot */}
                                        <div style={{
                                            position: 'absolute', left: '-36px', top: '0',
                                            width: '10px', height: '10px',
                                            backgroundColor: 'var(--color-accent)',
                                            borderRadius: '50%',
                                            border: '4px solid white',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}></div>

                                        <div style={{
                                            backgroundColor: 'white',
                                            padding: '25px',
                                            borderRadius: '12px',
                                            boxShadow: 'var(--shadow-md)',
                                            border: '1px solid var(--color-border)',
                                            transition: 'transform 0.2s',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', fontSize: '12px', color: 'var(--color-text-light)' }}>
                                                <Calendar size={14} />
                                                <span>{new Date(insight.timestamp).toLocaleDateString()}</span>
                                                <span>•</span>
                                                <span
                                                    onClick={() => onOpenBook(insight.bookId)}
                                                    style={{
                                                        color: 'var(--color-accent)',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}
                                                >
                                                    <BookOpen size={14} /> {insight.bookTitle}
                                                </span>
                                            </div>

                                            <div style={{ fontSize: '16px', lineHeight: '1.6', color: 'var(--color-text)', position: 'relative', paddingLeft: '20px' }}>
                                                <Quote size={20} style={{ position: 'absolute', left: '-5px', top: '-5px', color: '#f3e8ff', fill: '#f3e8ff' }} />
                                                {insight.content}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CategoryDetailView;
