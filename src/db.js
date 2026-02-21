import { openDB } from 'idb';
import { v4 as uuidv4 } from 'uuid';

const DB_NAME = 'audiobook-library-db';
const DB_VERSION = 4; // Bump for canvasNotes store

export async function initDB() {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
            // Create object store if it doesn't exist (initial creation)
            if (!db.objectStoreNames.contains('books')) {
                const store = db.createObjectStore('books', { keyPath: 'id' });
                store.createIndex('status', 'status');
                store.createIndex('genres', 'genres', { multiEntry: true });
                store.createIndex('saved', 'saved'); // Add saved index
            } else {
                // Handle upgrades
                const store = transaction.objectStore('books');
                if (oldVersion < 2) {
                    // Start migration: add 'genres' index.
                    if (!store.indexNames.contains('genres')) {
                        store.createIndex('genres', 'genres', { multiEntry: true });
                    }
                }
                if (oldVersion < 3) {
                    if (!store.indexNames.contains('saved')) {
                        store.createIndex('saved', 'saved');
                    }
                }
            }
            if (oldVersion < 4 && !db.objectStoreNames.contains('canvasNotes')) {
                db.createObjectStore('canvasNotes', { keyPath: 'bookId' });
            }
        },
    });
}

export async function addBook(file, coverUrl, title, author, genres) {
    const db = await initDB();
    const id = uuidv4();
    const book = {
        id,
        title,
        author,
        coverUrl,
        fileBlob: file,
        totalPages: 0, // Will be updated when opened
        currentPage: 1,
        status: 'To Read',
        genres: Array.isArray(genres) ? genres : [genres], // Ensure array
        notes: [],
        rating: 0,
        review: '',
        format: 'Digital', // Default format
        saved: false, // Default saved status
        addedAt: Date.now(),
    };
    await db.add('books', book);
    return book;
}

export async function getBooks() {
    const db = await initDB();
    return db.getAll('books');
}

export async function getBook(id) {
    const db = await initDB();
    return db.get('books', id);
}

export async function searchLibrary(query) {
    const db = await initDB();
    const books = await db.getAll('books');
    if (!query) return books;

    const lowerQuery = query.toLowerCase();
    return books.filter(book => {
        const matchesTitle = book.title.toLowerCase().includes(lowerQuery);
        const matchesAuthor = (book.author || '').toLowerCase().includes(lowerQuery);
        const matchesNotes = book.notes.some(note => note.content.toLowerCase().includes(lowerQuery));
        return matchesTitle || matchesAuthor || matchesNotes;
    });
}

export async function getLibraryStats() {
    const db = await initDB();
    const books = await db.getAll('books');

    const totalBooks = books.length;
    const totalPagesRead = books.reduce((sum, book) => sum + (book.currentPage || 0), 0);
    const totalNotes = books.reduce((sum, book) => sum + (book.notes ? book.notes.length : 0), 0);

    return { totalBooks, totalPagesRead, totalNotes };
}

export async function deleteBooks(ids) {
    const db = await initDB();
    const tx = db.transaction('books', 'readwrite');
    await Promise.all(ids.map(id => tx.store.delete(id)));
    await tx.done;
}

export async function updateBooksStatus(ids, status) {
    const db = await initDB();
    const tx = db.transaction('books', 'readwrite');
    for (const id of ids) {
        const book = await tx.store.get(id);
        if (book) {
            book.status = status;
            await tx.store.put(book);
        }
    }
    await tx.done;
}

export async function addBooksToCategory(ids, category) {
    const db = await initDB();
    const tx = db.transaction('books', 'readwrite');
    for (const id of ids) {
        const book = await tx.store.get(id);
        if (book) {
            const genres = book.genres || (book.genre ? [book.genre] : []);
            if (!genres.includes(category)) {
                book.genres = [...genres, category];
                await tx.store.put(book);
            }
        }
    }
    await tx.done;
}

export async function updateBookProgress(id, page) {
    const db = await initDB();
    const book = await db.get('books', id);
    if (book) {
        book.currentPage = page;
        if (book.status === 'To Read') {
            book.status = 'In Progress';
        }
        if (page >= book.totalPages && book.totalPages > 0) {
            book.status = 'Read';
        }
        await db.put('books', book);
    }
}

export async function updateBookTotalPages(id, total) {
    const db = await initDB();
    const book = await db.get('books', id);
    if (book) {
        book.totalPages = total;
        await db.put('books', book);
    }
}

export async function addNote(bookId, page, content) {
    const db = await initDB();
    const book = await db.get('books', bookId);
    if (book) {
        const note = {
            id: uuidv4(),
            page,
            content,
            timestamp: Date.now(),
        };
        book.notes.push(note);
        await db.put('books', book);
        return note;
    }
}

export async function updateNote(bookId, noteId, content) {
    const db = await initDB();
    const book = await db.get('books', bookId);
    if (book && book.notes) {
        const note = book.notes.find(n => n.id === noteId);
        if (note) {
            note.content = content;
            note.timestamp = Date.now();
            await db.put('books', book);
            return note;
        }
    }
}

export async function deleteNote(bookId, noteId) {
    const db = await initDB();
    const book = await db.get('books', bookId);
    if (book && book.notes) {
        book.notes = book.notes.filter(n => n.id !== noteId);
        await db.put('books', book);
    }
}

export async function deleteBook(id) {
    const db = await initDB();
    await db.delete('books', id);
}

export async function updateBookDetails(id, updates) {
    const db = await initDB();
    const book = await db.get('books', id);
    if (book) {
        const updatedBook = { ...book, ...updates };
        await db.put('books', updatedBook);
        return updatedBook;
    }
}

/** Canvas notes: one per book. { bookId, text, strokes, updatedAt } */
export async function getCanvasNotes(bookId) {
    const db = await initDB();
    return db.get('canvasNotes', bookId);
}

export async function saveCanvasNotes(bookId, data) {
    const db = await initDB();
    const payload = {
        bookId,
        text: data.text ?? '',
        strokes: data.strokes ?? [],
        updatedAt: Date.now(),
    };
    await db.put('canvasNotes', payload);
    return payload;
}
