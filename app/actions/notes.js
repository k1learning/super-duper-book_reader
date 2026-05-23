'use server';

import { supabase } from '../lib/supabase';

function mapNote(row) {
    if (!row) return null;
    return {
        id: row.id,
        page: row.page,
        content: row.content,
        timestamp: row.timestamp ? new Date(row.timestamp).getTime() : Date.now(),
    };
}

function throwIfError(error) {
    if (error) {
        throw new Error(error.message || 'Unknown database error');
    }
}

// ─── Text Notes ────────────────────────────────────────────────────────────

export async function addNote(bookId, page, content) {
    const { data, error } = await supabase
        .from('notes')
        .insert({ book_id: bookId, page, content })
        .select()
        .single();
    throwIfError(error);
    return mapNote(data);
}

export async function updateNote(bookId, noteId, content) {
    const { data, error } = await supabase
        .from('notes')
        .update({ content, timestamp: new Date().toISOString() })
        .eq('id', noteId)
        .select()
        .single();
    throwIfError(error);
    return mapNote(data);
}

export async function deleteNote(bookId, noteId) {
    const { error } = await supabase.from('notes').delete().eq('id', noteId);
    throwIfError(error);
}

// ─── Canvas Notes ──────────────────────────────────────────────────────────

export async function getCanvasNotes(bookId) {
    const { data, error } = await supabase
        .from('canvas_notes')
        .select('*')
        .eq('book_id', bookId)
        .single();

    if (error && error.code !== 'PGRST116') throwIfError(error);
    if (!data) return null;

    return {
        text: data.text || '',
        strokes: data.strokes || [],
        updatedAt: new Date(data.updated_at).getTime(),
    };
}

export async function saveCanvasNotes(bookId, data) {
    const payload = {
        book_id: bookId,
        text: data.text ?? '',
        strokes: data.strokes ?? [],
        updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
        .from('canvas_notes')
        .upsert(payload);
    throwIfError(error);

    return { text: data.text, strokes: data.strokes, updatedAt: Date.now() };
}
