import React, { useState } from 'react';
import { X, Upload, Link as LinkIcon, Save } from 'lucide-react';
import { addBook } from '../db';

const AddBookModal = ({ onClose }) => {
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [coverUrl, setCoverUrl] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
        } else {
            alert('Please upload a valid PDF file.');
        }
    };

    const GENRE_OPTIONS = [
        "Business Culture", "Thriller", "Mental Health", "Entrepreneurship", "Economics", "Management",
        "Sci-Fi", "Literary Fiction", "Mythology", "Mystery", "Sociology", "Philosophy", "Science",
        "Finance", "Marketing", "Leadership", "History", "Nonfiction", "Spirituality", "Fantasy",
        "Business & Money", "Self-help", "Fiction", "Romance", "Psychological", "Biographies"
    ];

    const toggleGenre = (genre) => {
        if (selectedGenres.includes(genre)) {
            setSelectedGenres(selectedGenres.filter(g => g !== genre));
        } else {
            setSelectedGenres([...selectedGenres, genre]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !title) {
            alert("Please provide at least a title and a PDF file.");
            return;
        }

        setLoading(true);
        try {
            await addBook(file, coverUrl, title, author, selectedGenres);
            // Refresh library or notify parent? For now just close.
            if (window.onBookAdded) window.onBookAdded();
            onClose();
            window.location.reload(); // Simple reload to refresh data for now
        } catch (error) {
            console.error("Failed to add book", error);
            alert("Failed to add book.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                backgroundColor: 'var(--color-bg)',
                padding: '30px',
                borderRadius: '8px',
                width: '600px', // Wider for chips
                maxHeight: '90vh', // Limit height
                overflowY: 'auto', // Scroll if needed
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                position: 'relative'
            }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={24} />
                </button>

                <h2 style={{ marginTop: 0, marginBottom: '20px', fontFamily: 'monospace' }}>Add New Book</h2>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {/* ... Title and Author inputs (unchanged) ... */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            required
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Author</label>
                        <input
                            type="text"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Genres</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '150px', overflowY: 'auto', border: '1px solid #eee', padding: '10px', borderRadius: '4px' }}>
                            {GENRE_OPTIONS.map(g => (
                                <button
                                    key={g}
                                    type="button"
                                    onClick={() => toggleGenre(g)}
                                    style={{
                                        border: 'none',
                                        borderRadius: '20px',
                                        padding: '5px 12px',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        backgroundColor: selectedGenres.includes(g) ? 'var(--color-accent)' : '#eee',
                                        color: selectedGenres.includes(g) ? '#fff' : '#333',
                                        transition: 'all 0.2s',
                                        fontWeight: selectedGenres.includes(g) ? 'bold' : 'normal'
                                    }}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                        {selectedGenres.length === 0 && <span style={{ fontSize: '11px', color: '#888' }}>Select at least one genre</span>}
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Cover Image URL</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <LinkIcon size={20} />
                            <input
                                type="url"
                                value={coverUrl}
                                onChange={(e) => setCoverUrl(e.target.value)}
                                placeholder="https://example.com/cover.jpg"
                                style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>PDF File</label>
                        {/* ... File upload (unchanged) ... */}
                        <div style={{ border: '2px dashed #ccc', padding: '20px', textAlign: 'center', borderRadius: '4px', cursor: 'pointer' }} onClick={() => document.getElementById('fileInput').click()}>
                            <Upload size={24} style={{ marginBottom: '10px' }} />
                            <p>Click to upload PDF</p>
                            <input
                                id="fileInput"
                                type="file"
                                accept="application/pdf"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                            {file && <p style={{ fontSize: '12px', color: 'green' }}>{file.name}</p>}
                        </div>
                    </div>

                    <button type="submit" disabled={loading} style={{
                        marginTop: '10px',
                        backgroundColor: 'var(--color-accent)',
                        color: 'white',
                        padding: '10px',
                        borderRadius: '4px',
                        border: 'none',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: 'disabled' ? 'wait' : 'pointer',
                        opacity: loading ? 0.7 : 1
                    }}>
                        {loading ? 'Adding Book...' : 'Save Book'}
                    </button>

                </form>
            </div>
        </div>
    );
};

export default AddBookModal;
