'use client'

import React, { useState, useEffect, useRef } from 'react';
import { getBook, updateBookProgress, updateBookTotalPages, getBookFileBlob } from '../../lib/db';
import { ArrowLeft, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import NotesCanvas from './NotesCanvas';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set PDF worker for Next.js - use the public path
if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';
}

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
    const [pdfSource, setPdfSource] = useState(null);
    const [pageWidth, setPageWidth] = useState(600);
    const containerRef = useRef(null);
    const pageRefs = useRef({});       // pageNumber → DOM node
    const initialScrollDoneRef = useRef(false);
    const isDesktop = useIsDesktop();

    useEffect(() => {
        loadBook();
    }, [bookId]);

    const loadBook = async () => {
        const data = await getBook(bookId);
        setBook(data);
    };

    // Recompute Page width when the container resizes (window resize, drawer toggle, etc).
    useEffect(() => {
        if (!containerRef.current) return;
        const recompute = () => {
            if (!containerRef.current) return;
            setPageWidth(Math.min(containerRef.current.offsetWidth - 40, 900));
        };
        recompute();
        const ro = new ResizeObserver(recompute);
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, [pdfSource]);

    // Cache the PDF blob locally so the reader works offline. On first open
    // we fetch and store; subsequent opens read from IndexedDB.
    useEffect(() => {
        let revoked = null;
        let cancelled = false;
        async function load() {
            if (!book?.id) return;
            const blob = await getBookFileBlob(book.id, book.fileUrl);
            if (cancelled) return;
            if (blob) {
                const url = URL.createObjectURL(blob);
                revoked = url;
                setPdfSource(url);
            } else if (book.fileUrl) {
                setPdfSource(book.fileUrl);
            } else {
                setPdfSource(null);
            }
        }
        load();
        return () => {
            cancelled = true;
            if (revoked) URL.revokeObjectURL(revoked);
        };
    }, [book?.id, book?.fileUrl]);

    const onDocumentLoadSuccess = async ({ numPages: total }) => {
        setNumPages(total);
        if (book && book.totalPages !== total) {
            await updateBookTotalPages(book.id, total);
            if (book.currentPage === 1 && book.status === 'To Read') {
                await updateBookProgress(book.id, book.currentPage);
            }
        }
    };

    // Scroll an arbitrary page into view (used by prev/next + slider).
    const scrollToPage = (page) => {
        const target = pageRefs.current[page];
        const scroller = containerRef.current;
        if (!target || !scroller) return;
        const offset = target.offsetTop - scroller.offsetTop;
        scroller.scrollTo({ top: Math.max(0, offset - 8), behavior: 'smooth' });
    };

    const changePage = (offset) => {
        if (!book) return;
        const next = Math.min(Math.max(1, book.currentPage + offset), numPages || 1);
        scrollToPage(next);
    };

    const setPage = (page) => {
        const p = Math.max(1, Math.min(page, numPages || 1));
        scrollToPage(p);
    };

    // Restore the last read position once pages are mounted, then attach a
    // scroll listener that tracks which page is most visible in the viewport.
    useEffect(() => {
        if (!numPages || !containerRef.current) return;
        if (!initialScrollDoneRef.current && book?.currentPage > 1) {
            // Wait one tick for Page nodes to mount + measure.
            const t = setTimeout(() => {
                scrollToPage(book.currentPage);
                initialScrollDoneRef.current = true;
            }, 150);
            return () => clearTimeout(t);
        }
        initialScrollDoneRef.current = true;
    }, [numPages, book?.id]);

    // Track current page from scroll position. Throttled via rAF.
    useEffect(() => {
        if (!numPages) return;
        const scroller = containerRef.current;
        if (!scroller) return;
        let pending = false;
        let lastReported = book?.currentPage || 1;
        const onScroll = () => {
            if (pending) return;
            pending = true;
            requestAnimationFrame(() => {
                pending = false;
                const viewportTop = scroller.scrollTop;
                const viewportMid = viewportTop + scroller.clientHeight / 3;
                let best = lastReported;
                for (let i = 1; i <= numPages; i++) {
                    const node = pageRefs.current[i];
                    if (!node) continue;
                    const top = node.offsetTop - scroller.offsetTop;
                    const bottom = top + node.offsetHeight;
                    if (viewportMid >= top && viewportMid < bottom) {
                        best = i;
                        break;
                    }
                }
                if (best !== lastReported) {
                    lastReported = best;
                    setBook((b) => (b && b.currentPage !== best ? { ...b, currentPage: best } : b));
                    updateBookProgress(book.id, best);
                }
            });
        };
        scroller.addEventListener('scroll', onScroll, { passive: true });
        return () => scroller.removeEventListener('scroll', onScroll);
    }, [numPages, book?.id]);

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
                        {pdfSource ? (
                            <Document
                                file={pdfSource}
                                onLoadSuccess={onDocumentLoadSuccess}
                                loading={<div style={{ color: 'rgba(255,255,255,0.8)' }}>Loading PDF…</div>}
                                error={<div style={{ color: '#f87171' }}>Failed to load PDF.</div>}
                            >
                                <div className="reader-pdf-pages">
                                    {Array.from({ length: numPages || 0 }, (_, i) => i + 1).map((pageNumber) => (
                                        <div
                                            key={pageNumber}
                                            ref={(node) => {
                                                if (node) pageRefs.current[pageNumber] = node;
                                                else delete pageRefs.current[pageNumber];
                                            }}
                                            className="reader-pdf-page"
                                        >
                                            <Page
                                                pageNumber={pageNumber}
                                                scale={scale}
                                                renderTextLayer
                                                renderAnnotationLayer
                                                width={pageWidth}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </Document>
                        ) : (
                            <div style={{ color: 'rgba(255,255,255,0.8)' }}>
                                {book.fileUrl ? 'PDF not cached and you appear to be offline.' : 'No PDF file found.'}
                            </div>
                        )}

                    </div>
                    <button
                        type="button"
                        onClick={() => changePage(-1)}
                        disabled={book.currentPage <= 1}
                        className="reader-nav-btn reader-nav-prev"
                        aria-label="Previous page"
                    >
                        <ChevronLeft size={28} />
                    </button>
                    <button
                        type="button"
                        onClick={() => changePage(1)}
                        disabled={book.currentPage >= (numPages || 1)}
                        className="reader-nav-btn reader-nav-next"
                        aria-label="Next page"
                    >
                        <ChevronRight size={28} />
                    </button>
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

