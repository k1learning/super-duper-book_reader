'use client'

import './polyfill'
import React, { useState } from 'react'
import Layout from './components/Layout'
import Library from './components/Library'
import ReaderView from './components/Reader/ReaderView'
import BookDetailView from './components/BookDetailView'
import CategoryDetailView from './components/CategoryDetailView'
import CategoriesGallery from './components/CategoriesGallery'
import ArchiveView from './components/Archive/ArchiveView'
import SavedView from './components/SavedView'

export default function HomeClient({ setupWarning = null }) {
    const [view, setView] = useState('home')
    const [currentBookId, setCurrentBookId] = useState(null)
    const [currentCategory, setCurrentCategory] = useState(null)
    const [globalSearchQuery, setGlobalSearchQuery] = useState('')

    const openBook = (bookId) => {
        setCurrentBookId(bookId);
        setView('detail');
    };

    const startReading = () => {
        setView('reader');
    };

    const closeBook = () => {
        setCurrentBookId(null);
        setView('home');
    };

    const backToDetail = () => {
        setView('detail');
    };

    const openCategory = (category) => {
        setCurrentCategory(category);
        setView('category');
    };

    const closeCategory = () => {
        setCurrentCategory(null);
        setView('categories');
    };

    // Main Navigation Handler
    const handleNavigate = (targetView) => {
        setView(targetView);
        if (targetView === 'home' || targetView === 'categories' || targetView === 'archive' || targetView === 'saved') {
            setCurrentBookId(null);
            setCurrentCategory(null);
        }
    };

    return (
        <Layout
            onNavigate={handleNavigate}
            activeView={view}
            globalSearchQuery={globalSearchQuery}
            onGlobalSearchChange={setGlobalSearchQuery}
        >
            {setupWarning && (
                <div
                    style={{
                        margin: '12px 24px 0',
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: '#fff7ed',
                        border: '1px solid #fed7aa',
                        color: '#9a3412',
                        fontSize: 13,
                    }}
                >
                    <strong>Supabase setup warning:</strong> {setupWarning}
                </div>
            )}
            {view === 'home' && (
                <Library onOpenBook={openBook} globalSearchQuery={globalSearchQuery} />
            )}
            {view === 'archive' && <ArchiveView onOpenBook={openBook} globalSearchQuery={globalSearchQuery} />}
            {view === 'saved' && <SavedView onOpenBook={openBook} />}
            {view === 'categories' && <CategoriesGallery onOpenCategory={openCategory} />}
            {view === 'detail' && (
                <BookDetailView
                    bookId={currentBookId}
                    onClose={closeBook}
                    onRead={startReading}
                    onOpenCategory={openCategory}
                />
            )}
            {view === 'reader' && <ReaderView bookId={currentBookId} onClose={backToDetail} />}
            {view === 'category' && (
                <CategoryDetailView
                    category={currentCategory}
                    onClose={closeCategory}
                    onOpenBook={openBook}
                />
            )}
        </Layout>
    )
}
