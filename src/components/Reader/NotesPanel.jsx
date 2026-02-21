import React from 'react';
import BookNotesView from './BookNotesView';

/**
 * Notes panel wrapper. Renders the immersive BookNotesView (open book layout).
 * Kept for backward compatibility with BookDetailView and ReaderView.
 */
const NotesPanel = (props) => <BookNotesView {...props} />;

export default NotesPanel;
