import React, { useState, useEffect, useRef } from 'react';
import { getBook, updateBookProgress, updateBookTotalPages } from '../../db';
import { ArrowLeft, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import NotesCanvas from './NotesCanvas';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

const DESKTOP_BREAKPOINT = 900;

function useIsDesktop() {
    const [isDesktop, setIsDesktop] = useState(
        () => typeof window !== 'undefined' && window.innerWidth >= DESKTOP_BREAKPOINT
    );
    useEffect(() => {
        const mql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
        const update = () => setIsDesktop(mql.matches);
        mql.addEventListener('change', update);
        return () => mql.removeEventListener('change', update);
    }, []);
    return isDesktop;
}

const ReaderView = ({ bookId, onClose }) => {
    const [book, setBook] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [scale, setScale] = useState(1.0);
    const [notesDrawerOpen, setNotesDrawerOpen] = useState(false);
    const containerRef = useRef(null);
    const isDesktop = useIsDesktop();

    useEffect(() => {
        loadBook();
    }, [bookId]);

    const loadBook = async () => {
        const data = await getBook(bookId);
        setBook(data);
    };

    const onDocumentLoadSuccess = async ({ numPages }) => {
        setNumPages(numPages);
        if (book && book.totalPages !== numPages) {
            await updateBookTotalPages(book.id, numPages);
            if (book.currentPage === 1 && book.status === 'To Read') {
                await updateBookProgress(book.id, book.currentPage);
            }
        }
    };

    const changePage = async (offset) => {
        if (!book) return;
        const newPage = Math.min(Math.max(1, book.currentPage + offset), numPages || 1);
        setBook((b) => (b ? { ...b, currentPage: newPage } : b));
        await updateBookProgress(book.id, newPage);
    };

    const setPage = async (page) => {
        const p = Math.max(1, Math.min(page, numPages));
        setBook((b) => (b ? { ...b, currentPage: p } : b));
        await updateBookProgress(book.id, p);
    };

    if (!book) return <div style={{ padding: '20px' }}>Loading book...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#323639' }}>
            <header
                style={{
                    flexShrink: 0,
                    height: 56,
                    backgroundColor: '#323639',
                    color: '#e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 var(--space-5)',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 'var(--space-2)' }}
                        aria-label="Back"
                    >
                        <ArrowLeft size={22} />
                    </button>
                    <span style={{ fontWeight: 600, fontSize: 'var(--text-body)' }}>{book.title}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                    <span style={{ fontSize: 'var(--text-meta)', color: 'rgba(255,255,255,0.8)' }}>
                        Page {book.currentPage} of {numPages || '—'}
                    </span>
                    <button
                        type="button"
                        className="reader-split-notes-drawer-toggle"
                        onClick={() => setNotesDrawerOpen(true)}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                            padding: 'var(--space-2) var(--space-3)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(255,255,255,0.08)',
                            color: 'inherit',
                            fontSize: 'var(--text-meta)',
                            cursor: 'pointer',
                        }}
                    >
                        <FileText size={18} /> Open Notes
                    </button>
                </div>
            </header>

            <div className="reader-split">
                <div className="reader-split-pdf">
                    <div className="reader-split-pdf-inner" ref={containerRef}>
                        {book.fileBlob ? (
                            <Document
                                file={book.fileBlob}
                                onLoadSuccess={onDocumentLoadSuccess}
                                loading={<div style={{ color: 'rgba(255,255,255,0.8)' }}>Loading PDF…</div>}
                                error={<div style={{ color: '#f87171' }}>Failed to load PDF.</div>}
                            >
                                <Page
                                    pageNumber={book.currentPage}
                                    scale={scale}
                                    renderTextLayer={true}
                                    renderAnnotationLayer={true}
                                    width={containerRef.current ? Math.min(containerRef.current.offsetWidth - 40, 800) : 600}
                                />
                            </Document>
                        ) : (
                            <div style={{ color: 'rgba(255,255,255,0.8)' }}>No PDF file found.</div>
                        )}

                        <button
                            type="button"
                            onClick={() => changePage(-1)}
                            disabled={book.currentPage <= 1}
                            style={{
                                position: 'absolute',
                                left: 'var(--space-5)',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                border: 'none',
                                background: 'rgba(0,0,0,0.4)',
                                color: '#fff',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            aria-label="Previous page"
                        >
                            <ChevronLeft size={28} />
                        </button>
                        <button
                            type="button"
                            onClick={() => changePage(1)}
                            disabled={book.currentPage >= numPages}
                            style={{
                                position: 'absolute',
                                right: 'var(--space-5)',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                border: 'none',
                                background: 'rgba(0,0,0,0.4)',
                                color: '#fff',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            aria-label="Next page"
                        >
                            <ChevronRight size={28} />
                        </button>
                    </div>
                </div>

                <div className="reader-split-divider" aria-hidden />

                <div className="reader-split-notes">
                    {isDesktop && <NotesCanvas bookId={book.id} />}
                </div>
            </div>

            {/* Mobile/tablet: notes drawer (only mount canvas when drawer open to avoid double instance) */}
            <div
                className={`reader-notes-drawer-backdrop ${notesDrawerOpen && !isDesktop ? 'visible' : ''}`}
                onClick={() => setNotesDrawerOpen(false)}
                onKeyDown={(e) => e.key === 'Escape' && setNotesDrawerOpen(false)}
                role="button"
                tabIndex={-1}
                aria-label="Close notes"
            />
            <div
                className={`reader-notes-drawer ${notesDrawerOpen && !isDesktop ? 'open' : ''}`}
                style={{ display: isDesktop ? 'none' : 'flex' }}
            >
                <div
                    style={{
                        flexShrink: 0,
                        padding: 'var(--space-3) var(--space-4)',
                        borderBottom: '1px solid var(--color-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <span style={{ fontWeight: 600, fontSize: 'var(--text-body)' }}>Notes</span>
                    <button
                        type="button"
                        onClick={() => setNotesDrawerOpen(false)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--space-2)' }}
                        aria-label="Close notes"
                    >
                        ✕
                    </button>
                </div>
                <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                    {!isDesktop && notesDrawerOpen && <NotesCanvas bookId={book.id} />}
                </div>
            </div>

            <div
                style={{
                    position: 'absolute',
                    bottom: 'var(--space-5)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 'min(70%, 400px)',
                    padding: 'var(--space-2) var(--space-4)',
                    backgroundColor: 'rgba(50, 54, 57, 0.95)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                }}
            >
                <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 'var(--text-caption)' }}>{book.currentPage}</span>
                <input
                    type="range"
                    min={1}
                    max={numPages || 1}
                    value={book.currentPage}
                    onChange={(e) => setPage(Number(e.target.value))}
                    style={{ flex: 1, cursor: 'pointer' }}
                />
                <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 'var(--text-caption)' }}>{numPages}</span>
            </div>
        </div>
    );
};

export default ReaderView;
