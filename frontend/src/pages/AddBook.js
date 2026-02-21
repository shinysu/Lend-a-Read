import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { booksAPI, googleBooksAPI } from '../services/api';
import {
    FiBook,
    FiUser,
    FiTag,
    FiPlusCircle,
    FiArrowLeft,
    FiSearch,
    FiX,
    FiEdit,
} from 'react-icons/fi';

const AddBook = () => {
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [manualMode, setManualMode] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);

    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [genre, setGenre] = useState('General');

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const searchTimeout = useRef(null);
    const searchRef = useRef(null);

    const genreOptions = [
        'General', 'Fiction', 'Non-Fiction', 'Science Fiction',
        'Fantasy', 'Mystery', 'Thriller', 'Romance', 'Horror',
        'Biography', 'History', 'Science', 'Self-Help',
        'Technology', 'Philosophy', 'Poetry', 'Children',
        'Young Adult', 'Comics', 'Other',
    ];

    // Debounced search
    useEffect(() => {
        if (!searchQuery.trim() || searchQuery.length < 2) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        searchTimeout.current = setTimeout(() => {
            searchGoogleBooks(searchQuery);
        }, 400);

        return () => {
            if (searchTimeout.current) {
                clearTimeout(searchTimeout.current);
            }
        };
    }, [searchQuery]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const searchGoogleBooks = async (query) => {
        setSearchLoading(true);
        try {
            const response = await googleBooksAPI.search(query);
            console.log('Search response:', response.data);
            const results = response.data.data || [];
            setSearchResults(results);
            setShowResults(true);
        } catch (error) {
            console.error('Search failed:', error);
            setSearchResults([]);
            setShowResults(true);
        } finally {
            setSearchLoading(false);
        }
    };
    const handleSelectBook = (book) => {
        setSelectedBook(book);
        setTitle(book.title);
        setAuthor(book.author);
        setCoverImage(book.cover_image || '');
        setGenre(book.genre || 'General');
        setSearchQuery('');
        setShowResults(false);
        setManualMode(false);
    };

    const handleClearSelection = () => {
        setSelectedBook(null);
        setTitle('');
        setAuthor('');
        setCoverImage('');
        setGenre('General');
        setSearchQuery('');
        setManualMode(false);
    };

    const handleManualMode = () => {
        setManualMode(true);
        setSelectedBook(null);
        setSearchQuery('');
        setShowResults(false);
        setTitle('');
        setAuthor('');
        setCoverImage('');
        setGenre('General');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!title.trim() || !author.trim()) {
            setError('Title and author are required');
            return;
        }

        setLoading(true);

        try {
            const response = await booksAPI.create({
                title: title.trim(),
                author: author.trim(),
                cover_image: coverImage.trim(),
                genre,
            });

            setSuccess('Book added successfully! Redirecting...');

            setTimeout(() => {
                navigate(`/books/${response.data.data.id}`);
            }, 1500);
        } catch (error) {
            setError(
                error.response?.data?.error || 'Failed to add book. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleAddAnother = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!title.trim() || !author.trim()) {
            setError('Title and author are required');
            return;
        }

        setLoading(true);

        try {
            await booksAPI.create({
                title: title.trim(),
                author: author.trim(),
                cover_image: coverImage.trim(),
                genre,
            });

            setSuccess('Book added successfully! Add another one.');
            handleClearSelection();
        } catch (error) {
            setError(
                error.response?.data?.error || 'Failed to add book. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-book fade-in" style={{ maxWidth: '650px' }}>
            {/* Page Header */}
            <div className="page-header">
                <button
                    className="btn btn-outline btn-sm mb-2"
                    onClick={() => navigate(-1)}
                >
                    <FiArrowLeft /> Back
                </button>
                <h1>📖 Add a Book</h1>
                <p>Search for a book or enter details manually</p>
            </div>

            {/* Alerts */}
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Search Section */}
            {!selectedBook && !manualMode && (
                <div className="card mb-3">
                    <h3
                        className="font-heading"
                        style={{
                            color: 'var(--primary)',
                            marginBottom: '16px',
                            fontSize: '1.1rem',
                        }}
                    >
                        <FiSearch style={{ marginRight: '8px' }} />
                        Search for a Book
                    </h3>

                    <div ref={searchRef} style={{ position: 'relative' }}>
                        <div className="search-input-wrapper">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Type book name or author..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ width: '100%' }}
                            />
                        </div>

                        {/* Search Loading */}
                        {searchLoading && (
                            <div
                                style={{
                                    padding: '12px',
                                    textAlign: 'center',
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.85rem',
                                }}
                            >
                                Searching Google Books...
                            </div>
                        )}

                        {/* Search Results Dropdown */}
                        {showResults && searchResults.length > 0 && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    background: 'var(--bg-card)',
                                    border: '2px solid var(--border)',
                                    borderRadius: 'var(--radius-md)',
                                    boxShadow: 'var(--shadow-lg)',
                                    maxHeight: '400px',
                                    overflowY: 'auto',
                                    zIndex: 50,
                                    marginTop: '4px',
                                }}
                            >
                                {searchResults.map((book, index) => (
                                    <div
                                        key={`${book.google_id}-${index}`}
                                        onClick={() => handleSelectBook(book)}
                                        style={{
                                            display: 'flex',
                                            gap: '12px',
                                            padding: '12px 16px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid var(--border-light)',
                                            transition: 'background 0.2s',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'var(--bg-primary)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        {/* Book Cover Thumbnail */}
                                        {book.cover_image ? (
                                            <img
                                                src={book.cover_image}
                                                alt={book.title}
                                                style={{
                                                    width: '40px',
                                                    height: '56px',
                                                    objectFit: 'cover',
                                                    borderRadius: '4px',
                                                    flexShrink: 0,
                                                }}
                                            />
                                        ) : (
                                            <div
                                                style={{
                                                    width: '40px',
                                                    height: '56px',
                                                    background: 'var(--border-light)',
                                                    borderRadius: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                    fontSize: '0.7rem',
                                                    color: 'var(--text-light)',
                                                }}
                                            >
                                                <FiBook />
                                            </div>
                                        )}

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p
                                                style={{
                                                    fontWeight: '600',
                                                    fontSize: '0.9rem',
                                                    color: 'var(--text-primary)',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}
                                            >
                                                {book.title}
                                            </p>
                                            <p
                                                style={{
                                                    fontSize: '0.8rem',
                                                    color: 'var(--text-secondary)',
                                                }}
                                            >
                                                {book.author}
                                            </p>
                                            {book.genre && book.genre !== 'General' && (
                                                <span
                                                    style={{
                                                        fontSize: '0.7rem',
                                                        background: 'var(--bg-primary)',
                                                        padding: '2px 8px',
                                                        borderRadius: '50px',
                                                        color: 'var(--text-secondary)',
                                                    }}
                                                >
                                                    {book.genre}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* No Results */}
                        {showResults && !searchLoading && searchResults.length === 0 && searchQuery.length >= 2 && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    background: 'var(--bg-card)',
                                    border: '2px solid var(--border)',
                                    borderRadius: 'var(--radius-md)',
                                    boxShadow: 'var(--shadow-lg)',
                                    padding: '20px',
                                    textAlign: 'center',
                                    zIndex: 50,
                                    marginTop: '4px',
                                }}
                            >
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                    No books found for "{searchQuery}"
                                </p>
                                <button
                                    className="btn btn-sm btn-primary"
                                    onClick={handleManualMode}
                                >
                                    <FiEdit /> Enter Details Manually
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Manual Entry Button */}
                    <div style={{ marginTop: '16px', textAlign: 'center' }}>
                        <button
                            className="btn btn-outline btn-sm"
                            onClick={handleManualMode}
                        >
                            <FiEdit /> Can't find your book? Enter manually
                        </button>
                    </div>
                </div>
            )}

            {/* Selected Book Preview */}
            {selectedBook && (
                <div className="card mb-3">
                    <div className="d-flex justify-between align-center mb-2">
                        <h3
                            className="font-heading"
                            style={{ color: 'var(--primary)', fontSize: '1.1rem' }}
                        >
                            Selected Book
                        </h3>
                        <button
                            className="btn btn-sm btn-outline"
                            onClick={handleClearSelection}
                        >
                            <FiX /> Change
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                        {coverImage ? (
                            <img
                                src={coverImage}
                                alt={title}
                                style={{
                                    width: '100px',
                                    height: '140px',
                                    objectFit: 'cover',
                                    borderRadius: 'var(--radius-sm)',
                                    boxShadow: 'var(--shadow-md)',
                                    flexShrink: 0,
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: '100px',
                                    height: '140px',
                                    background: 'var(--border-light)',
                                    borderRadius: 'var(--radius-sm)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    color: 'var(--text-light)',
                                    fontSize: '2rem',
                                }}
                            >
                                <FiBook />
                            </div>
                        )}

                        <div>
                            <h3
                                className="font-heading"
                                style={{
                                    color: 'var(--primary)',
                                    fontSize: '1.2rem',
                                    marginBottom: '4px',
                                }}
                            >
                                {title}
                            </h3>
                            <p
                                style={{
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.9rem',
                                    marginBottom: '8px',
                                }}
                            >
                                by {author}
                            </p>
                            <span className="book-card-genre">{genre}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Entry Form / Genre Selection */}
            {(selectedBook || manualMode) && (
                <div className="card">
                    <h3
                        className="font-heading"
                        style={{
                            color: 'var(--primary)',
                            marginBottom: '20px',
                            fontSize: '1.1rem',
                        }}
                    >
                        {manualMode ? (
                            <>
                                <FiEdit style={{ marginRight: '8px' }} />
                                Enter Book Details
                            </>
                        ) : (
                            <>
                                <FiTag style={{ marginRight: '8px' }} />
                                Confirm Details
                            </>
                        )}
                    </h3>

                    {manualMode && (
                        <div style={{ marginBottom: '12px' }}>
                            <button
                                className="btn btn-sm btn-outline"
                                onClick={handleClearSelection}
                            >
                                <FiArrowLeft /> Back to Search
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Title - editable in manual mode */}
                        {manualMode && (
                            <div className="form-group">
                                <label htmlFor="title">
                                    <FiBook style={{ marginRight: '6px' }} />
                                    Book Title *
                                </label>
                                <input
                                    id="title"
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter the book title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        )}

                        {/* Author - editable in manual mode */}
                        {manualMode && (
                            <div className="form-group">
                                <label htmlFor="author">
                                    <FiUser style={{ marginRight: '6px' }} />
                                    Author Name *
                                </label>
                                <input
                                    id="author"
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter the author's name"
                                    value={author}
                                    onChange={(e) => setAuthor(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        )}

                        {/* Cover Image URL - manual mode only */}
                        {manualMode && (
                            <div className="form-group">
                                <label htmlFor="coverImage">
                                    <FiBook style={{ marginRight: '6px' }} />
                                    Cover Image URL (Optional)
                                </label>
                                <input
                                    id="coverImage"
                                    type="text"
                                    className="form-control"
                                    placeholder="https://example.com/book-cover.jpg"
                                    value={coverImage}
                                    onChange={(e) => setCoverImage(e.target.value)}
                                    disabled={loading}
                                />
                                <p className="form-help">
                                    Paste a URL for the book cover image
                                </p>
                            </div>
                        )}

                        {/* Genre */}
                        <div className="form-group">
                            <label htmlFor="genre">
                                <FiTag style={{ marginRight: '6px' }} />
                                Genre
                            </label>
                            <select
                                id="genre"
                                className="form-control"
                                value={genre}
                                onChange={(e) => setGenre(e.target.value)}
                                disabled={loading}
                            >
                                {genreOptions.map((g) => (
                                    <option key={g} value={g}>
                                        {g}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Buttons */}
                        <div className="btn-group">
                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                disabled={loading}
                            >
                                <FiPlusCircle />
                                {loading ? 'Adding...' : 'Add Book'}
                            </button>

                            <button
                                type="button"
                                className="btn btn-outline btn-lg"
                                onClick={handleAddAnother}
                                disabled={loading}
                            >
                                {loading ? 'Adding...' : 'Add & Add Another'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AddBook;