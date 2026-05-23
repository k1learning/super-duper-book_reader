'use client'

// Offline-aware data layer. All components should import from this module
// (not from `app/actions/*` directly). On every read it tries the server,
// falls back to the IndexedDB cache when offline or when the server errors.
// Writes update the cache optimistically and queue a server replay if the
// network call fails.

import {
  addBook as serverAddBook,
  addBooksToCategory as serverAddBooksToCategory,
  deleteBook as serverDeleteBook,
  deleteBooks as serverDeleteBooks,
  getBook as serverGetBook,
  getBooks as serverGetBooks,
  getLibraryStats as serverGetLibraryStats,
  updateBookDetails as serverUpdateBookDetails,
  updateBookProgress as serverUpdateBookProgress,
  updateBookTotalPages as serverUpdateBookTotalPages,
  updateBooksStatus as serverUpdateBooksStatus,
} from '../actions/books'
import {
  addNote as serverAddNote,
  deleteNote as serverDeleteNote,
  getCanvasNotes as serverGetCanvasNotes,
  saveCanvasNotes as serverSaveCanvasNotes,
  updateNote as serverUpdateNote,
} from '../actions/notes'
import {
  cacheBook,
  cacheBookFile,
  cacheBooks,
  cacheCanvasNotes,
  enqueueMutation,
  getCachedBook,
  getCachedBookFile,
  getCachedBooks,
  getCachedCanvasNotes,
  getQueuedMutations,
  isOnline,
  patchCachedBook,
  removeCachedBook,
  removeCachedBooks,
  removeMutation,
  setMeta,
} from './cache'
import { v4 as uuidv4 } from 'uuid'

// ─── Reads ──────────────────────────────────────────────────────────────────

export async function getBooks() {
  if (isOnline()) {
    try {
      const fresh = await serverGetBooks()
      await cacheBooks(fresh)
      await setMeta('lastSync:books', Date.now())
      return fresh
    } catch (err) {
      // Network or server error — fall through to cache
      // eslint-disable-next-line no-console
      console.warn('getBooks: serving from cache', err?.message || err)
    }
  }
  return getCachedBooks()
}

export async function getBook(id) {
  if (!id) return null
  if (isOnline()) {
    try {
      const fresh = await serverGetBook(id)
      if (fresh) await cacheBook(fresh)
      return fresh
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('getBook: serving from cache', err?.message || err)
    }
  }
  return getCachedBook(id)
}

export async function getLibraryStats() {
  if (isOnline()) {
    try {
      return await serverGetLibraryStats()
    } catch {
      // fallthrough
    }
  }
  const books = await getCachedBooks()
  return {
    totalBooks: books.length,
    totalPagesRead: books.reduce((sum, b) => sum + (b.currentPage || 0), 0),
    totalNotes: books.reduce((sum, b) => sum + ((b.notes || []).length || 0), 0),
  }
}

export async function searchLibrary(query = '') {
  const books = await getBooks()
  const q = query.trim().toLowerCase()
  if (!q) return books
  return books.filter((book) => {
    const inTitle = (book.title || '').toLowerCase().includes(q)
    const inAuthor = (book.author || '').toLowerCase().includes(q)
    const inGenres = (book.genres || []).some((g) => g.toLowerCase().includes(q))
    const inNotes = (book.notes || []).some((n) => (n.content || '').toLowerCase().includes(q))
    return inTitle || inAuthor || inGenres || inNotes
  })
}

// ─── Add book (online-only; PDF upload cannot be queued offline) ───────────

export async function addBook(formData) {
  if (!isOnline()) {
    throw new Error('Adding a book requires a network connection (PDF upload).')
  }
  const book = await serverAddBook(formData)
  if (book) await cacheBook(book)
  return book
}

// ─── Mutations: optimistic + queue on failure ──────────────────────────────

export async function deleteBook(id) {
  return deleteBooks([id])
}

export async function deleteBooks(ids) {
  await removeCachedBooks(ids)
  try {
    if (!isOnline()) throw new Error('offline')
    await serverDeleteBooks(ids)
  } catch {
    await enqueueMutation({ kind: 'deleteBooks', args: { ids } })
  }
}

export async function updateBookDetails(id, updates) {
  const optimistic = await patchCachedBook(id, updates)
  try {
    if (!isOnline()) throw new Error('offline')
    const fresh = await serverUpdateBookDetails(id, updates)
    if (fresh) await cacheBook(fresh)
    return fresh || optimistic
  } catch {
    await enqueueMutation({ kind: 'updateBookDetails', args: { id, updates } })
    return optimistic
  }
}

export async function updateBookProgress(id, page) {
  const book = await getCachedBook(id)
  const patch = { currentPage: page }
  if (book) {
    if (book.status === 'To Read') patch.status = 'In Progress'
    if (book.totalPages > 0 && page >= book.totalPages) patch.status = 'Read'
  }
  await patchCachedBook(id, patch)
  try {
    if (!isOnline()) throw new Error('offline')
    await serverUpdateBookProgress(id, page)
  } catch {
    await enqueueMutation({ kind: 'updateBookProgress', args: { id, page } })
  }
}

export async function updateBookTotalPages(id, total) {
  await patchCachedBook(id, { totalPages: total })
  try {
    if (!isOnline()) throw new Error('offline')
    await serverUpdateBookTotalPages(id, total)
  } catch {
    await enqueueMutation({ kind: 'updateBookTotalPages', args: { id, total } })
  }
}

export async function updateBooksStatus(ids, status) {
  await Promise.all(ids.map((id) => patchCachedBook(id, { status })))
  try {
    if (!isOnline()) throw new Error('offline')
    await serverUpdateBooksStatus(ids, status)
  } catch {
    await enqueueMutation({ kind: 'updateBooksStatus', args: { ids, status } })
  }
}

export async function addBooksToCategory(ids, category) {
  for (const id of ids) {
    const book = await getCachedBook(id)
    if (!book) continue
    const genres = book.genres || []
    if (!genres.includes(category)) {
      await patchCachedBook(id, { genres: [...genres, category] })
    }
  }
  try {
    if (!isOnline()) throw new Error('offline')
    await serverAddBooksToCategory(ids, category)
  } catch {
    await enqueueMutation({ kind: 'addBooksToCategory', args: { ids, category } })
  }
}

// ─── Notes ──────────────────────────────────────────────────────────────────

export async function addNote(bookId, page, content) {
  const optimisticNote = {
    id: uuidv4(),
    page,
    content,
    timestamp: Date.now(),
  }
  const book = await getCachedBook(bookId)
  if (book) {
    await patchCachedBook(bookId, { notes: [...(book.notes || []), optimisticNote] })
  }
  try {
    if (!isOnline()) throw new Error('offline')
    const saved = await serverAddNote(bookId, page, content)
    if (saved && book) {
      const cached = await getCachedBook(bookId)
      const notes = (cached?.notes || []).map((n) => (n.id === optimisticNote.id ? saved : n))
      await patchCachedBook(bookId, { notes })
    }
    return saved || optimisticNote
  } catch {
    await enqueueMutation({
      kind: 'addNote',
      args: { bookId, page, content, optimisticId: optimisticNote.id },
    })
    return optimisticNote
  }
}

export async function updateNote(bookId, noteId, content) {
  const book = await getCachedBook(bookId)
  if (book) {
    const notes = (book.notes || []).map((n) =>
      n.id === noteId ? { ...n, content, timestamp: Date.now() } : n
    )
    await patchCachedBook(bookId, { notes })
  }
  try {
    if (!isOnline()) throw new Error('offline')
    return await serverUpdateNote(bookId, noteId, content)
  } catch {
    await enqueueMutation({ kind: 'updateNote', args: { bookId, noteId, content } })
    return null
  }
}

export async function deleteNote(bookId, noteId) {
  const book = await getCachedBook(bookId)
  if (book) {
    const notes = (book.notes || []).filter((n) => n.id !== noteId)
    await patchCachedBook(bookId, { notes })
  }
  try {
    if (!isOnline()) throw new Error('offline')
    await serverDeleteNote(bookId, noteId)
  } catch {
    await enqueueMutation({ kind: 'deleteNote', args: { bookId, noteId } })
  }
}

// ─── Canvas notes ──────────────────────────────────────────────────────────

export async function getCanvasNotes(bookId) {
  if (isOnline()) {
    try {
      const fresh = await serverGetCanvasNotes(bookId)
      if (fresh) await cacheCanvasNotes(bookId, fresh)
      return fresh
    } catch {
      // fall through
    }
  }
  const cached = await getCachedCanvasNotes(bookId)
  if (!cached) return null
  return { text: cached.text, strokes: cached.strokes, updatedAt: cached.updatedAt }
}

export async function saveCanvasNotes(bookId, data) {
  const payload = {
    text: data.text ?? '',
    strokes: data.strokes ?? [],
    updatedAt: Date.now(),
  }
  await cacheCanvasNotes(bookId, payload)
  try {
    if (!isOnline()) throw new Error('offline')
    return await serverSaveCanvasNotes(bookId, payload)
  } catch {
    await enqueueMutation({ kind: 'saveCanvasNotes', args: { bookId, data: payload } })
    return payload
  }
}

// ─── PDF blob caching ──────────────────────────────────────────────────────

// Returns a Blob for the book's PDF. Caches it on first fetch so the
// reader works offline.
export async function getBookFileBlob(bookId, fileUrl) {
  const cached = await getCachedBookFile(bookId)
  if (cached) return cached
  if (!fileUrl) return null
  if (!isOnline()) return null
  try {
    const res = await fetch(fileUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob = await res.blob()
    await cacheBookFile(bookId, blob)
    return blob
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('getBookFileBlob failed', err?.message || err)
    return null
  }
}

// ─── Sync: replay queued mutations ─────────────────────────────────────────

const dispatchers = {
  deleteBooks: ({ ids }) => serverDeleteBooks(ids),
  updateBookDetails: ({ id, updates }) => serverUpdateBookDetails(id, updates),
  updateBookProgress: ({ id, page }) => serverUpdateBookProgress(id, page),
  updateBookTotalPages: ({ id, total }) => serverUpdateBookTotalPages(id, total),
  updateBooksStatus: ({ ids, status }) => serverUpdateBooksStatus(ids, status),
  addBooksToCategory: ({ ids, category }) => serverAddBooksToCategory(ids, category),
  addNote: ({ bookId, page, content }) => serverAddNote(bookId, page, content),
  updateNote: ({ bookId, noteId, content }) => serverUpdateNote(bookId, noteId, content),
  deleteNote: ({ bookId, noteId }) => serverDeleteNote(bookId, noteId),
  saveCanvasNotes: ({ bookId, data }) => serverSaveCanvasNotes(bookId, data),
}

let flushing = false

export async function flushQueue() {
  if (flushing || !isOnline()) return { processed: 0, failed: 0 }
  flushing = true
  let processed = 0
  let failed = 0
  try {
    const queue = await getQueuedMutations()
    for (const m of queue) {
      const dispatch = dispatchers[m.kind]
      if (!dispatch) {
        await removeMutation(m.id)
        continue
      }
      try {
        await dispatch(m.args)
        await removeMutation(m.id)
        processed++
      } catch (err) {
        failed++
        // eslint-disable-next-line no-console
        console.warn(`flushQueue: ${m.kind} failed, will retry later`, err?.message || err)
      }
    }
    if (processed > 0) await setMeta('lastSync:queue', Date.now())
  } finally {
    flushing = false
  }
  return { processed, failed }
}

let listenersAttached = false

export function startSyncListener(onSync) {
  if (listenersAttached || typeof window === 'undefined') return
  listenersAttached = true
  const handler = async () => {
    const result = await flushQueue()
    if (onSync) onSync(result)
  }
  window.addEventListener('online', handler)
  // Best-effort initial flush
  if (isOnline()) handler()
}

export async function getPendingMutationCount() {
  const queue = await getQueuedMutations()
  return queue.length
}
