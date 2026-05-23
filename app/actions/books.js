'use server';

import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';

function throwIfError(error) {
  if (error) {
    throw new Error(error.message || 'Unknown database error');
  }
}

function mapNote(note) {
  if (!note) return null;
  return {
    id: note.id,
    page: note.page,
    content: note.content,
    timestamp: new Date(note.timestamp).getTime(),
  };
}

function mapBook(book) {
  if (!book) return null;
  return {
    id: book.id,
    title: book.title,
    author: book.author || '',
    coverUrl: book.cover_url || '',
    fileUrl: book.file_url || '',
    totalPages: book.total_pages || 0,
    currentPage: book.current_page || 1,
    status: book.status || 'To Read',
    genres: book.genres || [],
    notes: Array.isArray(book.notes) ? book.notes.map(mapNote) : [],
    rating: book.rating || 0,
    review: book.review || '',
    format: book.format || 'Digital',
    saved: book.saved || false,
    addedAt: book.added_at ? new Date(book.added_at).getTime() : Date.now(),
  };
}

export async function getBooks() {
  const { data, error } = await supabase
    .from('books')
    .select('*, notes(*)')
    .order('added_at', { ascending: false });
  throwIfError(error);
  return (data || []).map(mapBook);
}

export async function getBook(id) {
  const { data, error } = await supabase
    .from('books')
    .select('*, notes(*)')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throwIfError(error);
  }
  return mapBook(data);
}

export async function addBook(formData) {
  const title = String(formData.get('title') || '').trim();
  const author = String(formData.get('author') || '').trim();
  const coverUrl = String(formData.get('coverUrl') || '').trim();
  const genresRaw = String(formData.get('genres') || '[]');
  const genres = JSON.parse(genresRaw);
  const file = formData.get('file');

  if (!title) throw new Error('Title is required');
  if (!(file instanceof File) || file.size === 0) throw new Error('PDF file is required');

  const fileExt = file.name.split('.').pop() || 'pdf';
  const fileName = `books/${uuidv4()}.${fileExt}`;
  const { error: fileError } = await supabase.storage
    .from('book-files')
    .upload(fileName, file, { upsert: false, contentType: file.type || 'application/pdf' });
  throwIfError(fileError);

  const { data: publicData } = supabase.storage.from('book-files').getPublicUrl(fileName);
  const fileUrl = publicData.publicUrl;

  const { data, error } = await supabase
    .from('books')
    .insert({
      title,
      author: author || null,
      cover_url: coverUrl || null,
      file_url: fileUrl,
      genres: Array.isArray(genres) ? genres : [],
      status: 'To Read',
      added_at: new Date().toISOString(),
    })
    .select('*, notes(*)')
    .single();
  throwIfError(error);
  return mapBook(data);
}

export async function deleteBooks(ids) {
  const { error } = await supabase.from('books').delete().in('id', ids);
  throwIfError(error);
}

export async function deleteBook(id) {
  await deleteBooks([id]);
}

export async function updateBookDetails(id, updates) {
  const dbUpdates = {};
  if (updates.saved !== undefined) dbUpdates.saved = updates.saved;
  if (updates.author !== undefined) dbUpdates.author = updates.author;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.genres !== undefined) dbUpdates.genres = updates.genres;
  if (updates.review !== undefined) dbUpdates.review = updates.review;
  if (updates.rating !== undefined) dbUpdates.rating = updates.rating;
  if (updates.coverUrl !== undefined) dbUpdates.cover_url = updates.coverUrl;
  if (updates.title !== undefined) dbUpdates.title = updates.title;

  if (Object.keys(dbUpdates).length === 0) return getBook(id);

  const { data, error } = await supabase
    .from('books')
    .update(dbUpdates)
    .eq('id', id)
    .select('*, notes(*)')
    .single();
  throwIfError(error);
  return mapBook(data);
}

export async function updateBookProgress(id, page) {
  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('total_pages, status')
    .eq('id', id)
    .single();
  throwIfError(bookError);
  if (!book) return;

  let status = book.status;
  if (status === 'To Read') status = 'In Progress';
  if (book.total_pages > 0 && page >= book.total_pages) status = 'Read';

  const { error } = await supabase
    .from('books')
    .update({ current_page: page, status })
    .eq('id', id);
  throwIfError(error);
}

export async function updateBookTotalPages(id, total) {
  const { error } = await supabase.from('books').update({ total_pages: total }).eq('id', id);
  throwIfError(error);
}

export async function updateBooksStatus(ids, status) {
  const { error } = await supabase.from('books').update({ status }).in('id', ids);
  throwIfError(error);
}

export async function addBooksToCategory(ids, category) {
  const { data: books, error } = await supabase.from('books').select('id, genres').in('id', ids);
  throwIfError(error);

  for (const book of books || []) {
    const genres = book.genres || [];
    if (!genres.includes(category)) {
      const { error: updateError } = await supabase
        .from('books')
        .update({ genres: [...genres, category] })
        .eq('id', book.id);
      throwIfError(updateError);
    }
  }
}

export async function getLibraryStats() {
  const { data: books, error } = await supabase
    .from('books')
    .select('id, current_page, notes(id)');
  throwIfError(error);

  const safeBooks = books || [];
  return {
    totalBooks: safeBooks.length,
    totalPagesRead: safeBooks.reduce((sum, b) => sum + (b.current_page || 0), 0),
    totalNotes: safeBooks.reduce((sum, b) => sum + ((b.notes || []).length || 0), 0),
  };
}
