import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { booksAPI } from '../services/api';
import {
    FiBook,
    FiPlusCircle,
    FiEdit,
    FiTrash2,
    FiRotateCcw,
    FiUser,
    FiMapPin,
} from 'react-icons/fi';

const MyBooks = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (location.state?.message) {
            setSuccess(location.state.message);
            window.history.replaceState({}, document.title);
        }
        fetchMyBooks();
    }, [statusFilter]);

    const fetchMyBooks = async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter) {
                params.status = statusFilter;
            }
            const response = await booksAPI.getMyBooks(params);
            setBooks(response.data.data);
        } catch (error) {
            setError('Failed to fetch your books');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkReturned = async (bookId) => {
        setError('');
        setSuccess('');
        setActionLoading(true);

        try {
            await booksAPI.markReturned(bookId);
            setSuccess('Book marked as returned and is now available again.');
            fetchMyBooks();
        } catch (error) {
            setError(
                error.response?.data?.error || 'Failed to mark book as returned'
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (bookId) => {
        setError('');
        setSuccess('');
        setActionLoading(true);

        try {
            await booksAPI.delete(bookId);
            setSuccess('Book removed from library successfully.');
            setDeleteConfirm(null);
            fetchMyBooks();
        } catch (error) {
            setError(
                error.response?.data?.error || 'Failed to delete book'
            );
        } finally {
            setActionLoading(false);
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="my-books fade-in">
            {/* Page Header */}
            <div className="page-header">
                <div className="d-flex justify-between align-center flex-wrap gap-2">
                    <div>
                        <h1>📖 My Books</h1>
                        <p>Manage books you've shared with the community</p>
                    </div>
                    <Link to="/books/add" className="btn btn-primary">
                        <FiPlusCircle /> Add New Book
                    </Link>
                </div>
            </div>

            {/* Alerts */}
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Status Filter Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${statusFilter === '' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('')}
                >
                    All
                </button>
                <button
                    className={`tab ${statusFilter === 'available' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('available')}
                >
                    Available
                </button>
                <button
                    className={`tab ${statusFilter === 'borrowed' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('borrowed')}
                >
                    Borrowed
                </button>
            </div>

            {/* Loading */}
            {loading ? (
                <div className="loading-screen" style={{ minHeight: '300px' }}>
                    <div className="loading-spinner"></div>
                    <p>Loading your books...</p>
                </div>
            ) : books.length > 0 ? (
                <div className="grid-3">
                    {books.map((book) => (
                        <div key={book.id} className="card fade-in">
                            {/* Book Info with Cover */}
                            <div
                                style={{ cursor: 'pointer', display: 'flex', gap: '14px' }}
                                onClick={() => navigate(`/books/${book.id}`)}
                            >
                                {/* Cover Image */}
                                {book.cover_image ? (
                                    <img
                                        src={book.cover_image}
                                        alt={book.title}
                                        style={{
                                            width: '70px',
                                            height: '98px',
                                            objectFit: 'cover',
                                            borderRadius: '4px',
                                            boxShadow: 'var(--shadow-sm)',
                                            flexShrink: 0,
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: '70px',
                                            height: '98px',
                                            background: 'var(--border-light)',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            color: 'var(--text-light)',
                                            fontSize: '1.5rem',
                                        }}
                                    >
                                        <FiBook />
                                    </div>
                                )}

                                {/* Book Details */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="d-flex justify-between align-center mb-1">
                                        <h3
                                            className="font-heading"
                                            style={{
                                                color: 'var(--primary)',
                                                fontSize: '1rem',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                        >
                                            {book.title}
                                        </h3>
                                    </div>

                                    <p
                                        style={{
                                            fontSize: '0.8rem',
                                            color: 'var(--text-secondary)',
                                            marginBottom: '6px',
                                        }}
                                    >
                                        by {book.author}
                                    </p>

                                    <div className="d-flex align-center gap-1">
                                        {book.genre && (
                                            <span className="book-card-genre">{book.genre}</span>
                                        )}
                                        <span className={`badge badge-${book.status}`}>
                                            {book.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Borrower Info */}
                            {book.status === 'borrowed' && book.borrower && (
                                <div
                                    style={{
                                        background: 'var(--bg-primary)',
                                        borderRadius: 'var(--radius-sm)',
                                        padding: '10px',
                                        marginTop: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            background: 'var(--info)',
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                        }}
                                    >
                                        {getInitials(book.borrower.name)}
                                    </div>
                                    <div>
                                        <p
                                            style={{
                                                fontSize: '0.8rem',
                                                color: 'var(--text-primary)',
                                                fontWeight: '500',
                                            }}
                                        >
                                            <FiUser style={{ marginRight: '4px' }} />
                                            {book.borrower.name}
                                        </p>
                                        <p
                                            style={{
                                                fontSize: '0.75rem',
                                                color: 'var(--text-secondary)',
                                            }}
                                        >
                                            <FiMapPin style={{ marginRight: '4px' }} />
                                            Apt {book.borrower.apartment_number}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div
                                style={{
                                    borderTop: '1px solid var(--border-light)',
                                    paddingTop: '12px',
                                    marginTop: '12px',
                                    display: 'flex',
                                    gap: '8px',
                                    flexWrap: 'wrap',
                                }}
                            >
                                {book.status !== 'borrowed' && (
                                    <button
                                        className="btn btn-sm btn-outline"
                                        onClick={() => navigate(`/books/${book.id}`)}
                                    >
                                        <FiEdit /> Edit
                                    </button>
                                )}

                                {book.status === 'borrowed' && (
                                    <button
                                        className="btn btn-sm btn-success"
                                        onClick={() => handleMarkReturned(book.id)}
                                        disabled={actionLoading}
                                    >
                                        <FiRotateCcw /> Mark Returned
                                    </button>
                                )}

                                {book.status !== 'borrowed' && (
                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={() => setDeleteConfirm(book.id)}
                                    >
                                        <FiTrash2 /> Remove
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon">📚</div>
                    <h3>
                        {statusFilter
                            ? `No ${statusFilter} books`
                            : "You haven't listed any books yet"}
                    </h3>
                    <p>
                        {statusFilter
                            ? 'Try changing the filter'
                            : 'Share your books with the community!'}
                    </p>
                    {!statusFilter && (
                        <Link to="/books/add" className="btn btn-primary">
                            <FiPlusCircle /> Add Your First Book
                        </Link>
                    )}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div
                    className="modal-overlay"
                    onClick={() => setDeleteConfirm(null)}
                >
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Remove Book</h2>
                            <button
                                className="modal-close"
                                onClick={() => setDeleteConfirm(null)}
                            >
                                ×
                            </button>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            Are you sure you want to remove this book from the community
                            library?
                        </p>
                        <p
                            style={{
                                color: 'var(--danger)',
                                fontSize: '0.85rem',
                                marginBottom: '16px',
                            }}
                        >
                            This action cannot be undone.
                        </p>

                        <div className="modal-footer">
                            <button
                                className="btn btn-outline"
                                onClick={() => setDeleteConfirm(null)}
                                disabled={actionLoading}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={() => handleDelete(deleteConfirm)}
                                disabled={actionLoading}
                            >
                                <FiTrash2 />
                                {actionLoading ? 'Removing...' : 'Yes, Remove'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyBooks;