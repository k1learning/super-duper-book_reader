import React, { useEffect, useState } from 'react';
import { getBooks } from '../db';
import { ArrowRight, Book } from 'lucide-react';

const CategoriesGallery = ({ onOpenCategory }) => {
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        const books = await getBooks();
        const genreMap = {};

        books.forEach(book => {
            const bookGenres = book.genres || (book.genre ? [book.genre] : []);
            bookGenres.forEach(g => {
                if (!genreMap[g]) {
                    genreMap[g] = { name: g, count: 0, covers: [] };
                }
                genreMap[g].count++;
                if (book.coverUrl && genreMap[g].covers.length < 3) {
                    genreMap[g].covers.push(book.coverUrl);
                }
            });
        });

        const sortedCategories = Object.values(genreMap).sort((a, b) => b.count - a.count);
        setCategories(sortedCategories);
    };

    return (
        <div style={{ padding: '40px 60px', overflowY: 'auto', height: '100%', backgroundColor: 'var(--color-bg)' }}>
            <h1 style={{ fontSize: '32px', marginBottom: '10px', color: 'var(--color-text)' }}>Explore Categories</h1>
            <p style={{ color: 'var(--color-text-light)', marginBottom: '40px' }}>Discover books and insights by topic.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}>
                {categories.map(cat => (
                    <div
                        key={cat.name}
                        onClick={() => onOpenCategory(cat.name)}
                        style={{
                            backgroundColor: 'var(--color-card-bg)',
                            borderRadius: '16px',
                            padding: '25px',
                            cursor: 'pointer',
                            border: '1px solid var(--color-border)',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            height: '200px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        {/* Background decorative blob */}
                        <div style={{
                            position: 'absolute', top: -20, right: -20, width: '100px', height: '100px',
                            backgroundColor: 'var(--color-accent)', opacity: 0.1, borderRadius: '50%'
                        }}></div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
                            <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--color-text)' }}>{cat.name}</h2>
                            <span style={{
                                backgroundColor: 'rgba(0,0,0,0.05)',
                                padding: '4px 8px', borderRadius: '12px',
                                fontSize: '12px', fontWeight: '600', color: 'var(--color-text-light)'
                            }}>
                                {cat.count} Books
                            </span>
                        </div>

                        {/* Cover Preview Stack */}
                        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', position: 'relative' }}>
                            {cat.covers.length > 0 ? (
                                cat.covers.slice(0, 3).map((cover, idx) => (
                                    <img
                                        key={idx}
                                        src={cover}
                                        alt=""
                                        style={{
                                            width: '60px', height: '90px', objectFit: 'cover', borderRadius: '4px',
                                            position: 'absolute', bottom: 0, left: idx * 25,
                                            boxShadow: '-2px 0 5px rgba(0,0,0,0.2)',
                                            zIndex: idx,
                                            border: '1px solid white'
                                        }}
                                    />
                                ))
                            ) : (
                                <div style={{
                                    width: '60px', height: '90px', backgroundColor: '#eee', borderRadius: '4px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Book size={20} color="#ccc" />
                                </div>
                            )}

                            <div style={{ marginLeft: 'auto', marginBottom: '10px', color: 'var(--color-accent)' }}>
                                <ArrowRight size={24} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategoriesGallery;
