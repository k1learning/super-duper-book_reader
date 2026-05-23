'use client'

// Offline cache backed by IndexedDB. Holds book metadata, notes (joined),
// canvas notes, cached PDF blobs, and a queue of mutations to replay when
// connectivity is restored.

import { openDB } from 'idb'

const DB_NAME = 'bookos-cache'
const DB_VERSION = 1

const STORES = {
  books: 'books',
  canvasNotes: 'canvasNotes',
  files: 'files',
  mutations: 'mutations',
  meta: 'meta',
}

let dbPromise = null

export function getCacheDB() {
  if (typeof indexedDB === 'undefined') return null
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORES.books)) {
          db.createObjectStore(STORES.books, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(STORES.canvasNotes)) {
          db.createObjectStore(STORES.canvasNotes, { keyPath: 'bookId' })
        }
        if (!db.objectStoreNames.contains(STORES.files)) {
          db.createObjectStore(STORES.files, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(STORES.mutations)) {
          db.createObjectStore(STORES.mutations, { keyPath: 'id', autoIncrement: true })
        }
        if (!db.objectStoreNames.contains(STORES.meta)) {
          db.createObjectStore(STORES.meta)
        }
      },
    })
  }
  return dbPromise
}

export function isOnline() {
  if (typeof navigator === 'undefined') return true
  return navigator.onLine !== false
}

// ─── Books cache ────────────────────────────────────────────────────────────

export async function cacheBooks(books) {
  const db = await getCacheDB()
  if (!db) return
  const tx = db.transaction(STORES.books, 'readwrite')
  await tx.store.clear()
  await Promise.all(books.map((b) => tx.store.put(b)))
  await tx.done
}

export async function cacheBook(book) {
  const db = await getCacheDB()
  if (!db || !book) return
  await db.put(STORES.books, book)
}

export async function removeCachedBook(id) {
  const db = await getCacheDB()
  if (!db) return
  await db.delete(STORES.books, id)
  await db.delete(STORES.files, id).catch(() => {})
}

export async function removeCachedBooks(ids) {
  await Promise.all(ids.map(removeCachedBook))
}

export async function getCachedBooks() {
  const db = await getCacheDB()
  if (!db) return []
  const books = await db.getAll(STORES.books)
  return books.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
}

export async function getCachedBook(id) {
  const db = await getCacheDB()
  if (!db) return null
  return (await db.get(STORES.books, id)) || null
}

export async function patchCachedBook(id, patch) {
  const db = await getCacheDB()
  if (!db) return null
  const existing = await db.get(STORES.books, id)
  if (!existing) return null
  const next = { ...existing, ...patch }
  await db.put(STORES.books, next)
  return next
}

// ─── Canvas notes cache ─────────────────────────────────────────────────────

export async function cacheCanvasNotes(bookId, data) {
  const db = await getCacheDB()
  if (!db) return
  await db.put(STORES.canvasNotes, { bookId, ...data })
}

export async function getCachedCanvasNotes(bookId) {
  const db = await getCacheDB()
  if (!db) return null
  return (await db.get(STORES.canvasNotes, bookId)) || null
}

// ─── PDF file blob cache ────────────────────────────────────────────────────

export async function cacheBookFile(bookId, blob) {
  const db = await getCacheDB()
  if (!db) return
  await db.put(STORES.files, { id: bookId, blob, cachedAt: Date.now() })
}

export async function getCachedBookFile(bookId) {
  const db = await getCacheDB()
  if (!db) return null
  const row = await db.get(STORES.files, bookId)
  return row?.blob || null
}

// ─── Mutation queue ─────────────────────────────────────────────────────────

export async function enqueueMutation(mutation) {
  const db = await getCacheDB()
  if (!db) return
  await db.add(STORES.mutations, { ...mutation, queuedAt: Date.now() })
}

export async function getQueuedMutations() {
  const db = await getCacheDB()
  if (!db) return []
  return db.getAll(STORES.mutations)
}

export async function removeMutation(id) {
  const db = await getCacheDB()
  if (!db) return
  await db.delete(STORES.mutations, id)
}

export async function clearMutations() {
  const db = await getCacheDB()
  if (!db) return
  await db.clear(STORES.mutations)
}

// ─── Meta (last-synced timestamps, etc) ─────────────────────────────────────

export async function setMeta(key, value) {
  const db = await getCacheDB()
  if (!db) return
  await db.put(STORES.meta, value, key)
}

export async function getMeta(key) {
  const db = await getCacheDB()
  if (!db) return null
  return (await db.get(STORES.meta, key)) ?? null
}
