import React, { useState, useEffect } from 'react';
import { searchLibrary, getLibraryStats, deleteBooks, updateBooksStatus } from '../../db';
import ArchiveFilters from './ArchiveFilters';
import ArchiveGrid from './ArchiveGrid';
import { Search, CheckSquare, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';

const ArchiveView = ({ onOpenBook, globalSearchQuery }) => {
    const [books, setBooks] = useState([]);
    const [filteredBooks, setFilteredBooks] = useState([]);
    const [filters, setFilters] = useState({ sort: 'newest' });
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [filtersOpen, setFiltersOpen] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [books, globalSearchQuery, filters]);

    const loadData = async () => {
        const allBooks = await searchLibrary('');
        setBooks(allBooks);
    };

    const applyFilters = () => {
        let result = [...books];
        const q = (globalSearchQuery || '').trim().toLowerCase();
        if (q) {
            result = result.filter(
                (b) =>
                    b.title.toLowerCase().includes(q) ||
                    (b.author || '').toLowerCase().includes(q) ||
                    (b.genres || []).some((g) => g.toLowerCase().includes(q)) ||
                    (b.notes || []).some((n) => n.content.toLowerCase().includes(q))
            );
        }
        if (filters.format?.length > 0) {
            result = result.filter((b) => filters.format.includes(b.format || 'Digital'));
        }
        if (filters.status?.length > 0) {
            result = result.filter((b) => filters.status.includes(b.status));
        }
        if (filters.rating?.length > 0) {
            result = result.filter((b) => filters.rating.includes(Math.floor(b.rating || 0)));
        }
        switch (filters.sort) {
            case 'newest':
                result.sort((a, b) => b.addedAt - a.addedAt);
                break;
            case 'oldest':
                result.sort((a, b) => a.addedAt - b.addedAt);
                break;
            case 'latest_read':
                result.sort((a, b) => b.addedAt - a.addedAt);
                break;
            case 'rating_desc':
                result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'notes_desc':
                result.sort((a, b) => (b.notes?.length || 0) - (a.notes?.length || 0));
                break;
            default:
                break;
        }
        setFilteredBooks(result);
    };

    const handleFilterChange = (category, value) => {
        setFilters((prev) => ({ ...prev, [category]: value }));
    };

    const toggleSelection = (id) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const handleBulkAction = async (action) => {
        if (selectedIds.length === 0) return;
        if (action === 'delete') {
            if (!window.confirm(`Delete ${selectedIds.length} book(s)?`)) return;
            await deleteBooks(selectedIds);
        } else if (action.startsWith('status:')) {
            await updateBooksStatus(selectedIds, action.split(':')[1]);
        }
        loadData();
        setSelectionMode(false);
        setSelectedIds([]);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div
                style={{
                    flexShrink: 0,
                    padding: 'var(--space-3) var(--space-10)',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'var(--color-card-bg)',
                }}
            >
                <h1 className="page-title" style={{ margin: 0, fontSize: 'var(--text-h2)' }}>
                    Library
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    {selectionMode ? (
                        <>
                            <span style={{ fontSize: 'var(--text-meta)', fontWeight: 600 }}>{selectedIds.length} selected</span>
                            <button
                                type="button"
                                onClick={() => handleBulkAction('status:Read')}
                                className="btn-secondary"
                                style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-meta)' }}
                            >
                                Mark read
                            </button>
                            <button
                                type="button"
                                onClick={() => handleBulkAction('delete')}
                                style={{
                                    padding: 'var(--space-2) var(--space-4)',
                                    fontSize: 'var(--text-meta)',
                                    border: '1px solid #ef4444',
                                    color: '#ef4444',
                                    background: 'transparent',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                }}
                            >
                                Delete
                            </button>
                            <button type="button" onClick={() => { setSelectionMode(false); setSelectedIds([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setSelectionMode(true)}
                            className="btn-secondary"
                            style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-meta)' }}
                        >
                            <CheckSquare size={16} /> Select
                        </button>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <div
                    style={{
                        width: filtersOpen ? 220 : 48,
                        flexShrink: 0,
                        borderRight: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-bg)',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'width 0.2s ease',
                    }}
                >
                    <button
                        type="button"
                        onClick={() => setFiltersOpen(!filtersOpen)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: filtersOpen ? 'space-between' : 'center',
                            padding: 'var(--space-3) var(--space-4)',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: 'var(--text-meta)',
                            color: 'var(--color-text)',
                        }}
                    >
                        {filtersOpen && <span>Filters</span>}
                        {filtersOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    {filtersOpen && (
                        <div style={{ overflowY: 'auto', padding: '0 var(--space-3) var(--space-4)' }}>
                            <ArchiveFilters filters={filters} onFilterChange={handleFilterChange} />
                        </div>
                    )}
                </div>
                <ArchiveGrid
                    books={filteredBooks}
                    selectionMode={selectionMode}
                    selectedIds={selectedIds}
                    onSelect={toggleSelection}
                    onOpenBook={onOpenBook}
                />
            </div>
        </div>
    );
};

export default ArchiveView;
