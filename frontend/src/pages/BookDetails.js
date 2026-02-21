import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { booksAPI, requestsAPI } from '../services/api';
import {
    FiArrowLeft,
    FiUser,
    FiMapPin,
    FiTag,
    FiCalendar,
    FiBookOpen,
    FiBook,
    FiSend,
    FiEdit,
    FiTrash2,
    FiRotateCcw,
} from 'react-icons/fi';

const BookDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [borrowMessage, setBorrowMessage] = useState('');
    const [showBorrowForm, setShowBorrowForm] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editAuthor, setEditAuthor] = useState('');
    const [editGenre, setEditGenre] = useState('');

    const isOwner = user?.id === book?.owner_id;

    const genreOptions = [
        'General', 'Fiction', 'Non-Fiction', 'Science Fiction',
        'Fantasy', 'Mystery', 'Thriller', 'Romance', 'Horror',
        'Biography', 'History', 'Science', 'Self-Help',
        'Technology', 'Philosophy', 'Poetry', 'Children',
        'Young Adult', 'Comics', 'Other',
    ];

    useEffect(() => {
        fetchBook();
    }, [id]);

    const fetchBook = async () => {
        try {
            setLoading(true);
            const response = await booksAPI.getById(id);
            const bookData = response.data.data;
            setBook(bookData);
            setEditTitle(bookData.title);
            setEditAuthor(bookData.author);
            setEditGenre(bookData.genre || 'General');
        } catch (error) {
            setError('Failed to load book details');
        } finally {
            setLoading(false);
        }
    };

    const handleBorrowRequest = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setActionLoading(true);

        try {
            await requestsAPI.create({
                book_id: book.id,
                message: borrowMessage.trim(),
            });
            setSuccess(
                'Borrow request sent successfully! The lender will review your request.'
            );
            setShowBorrowForm(false);
            setBorrowMessage('');
            fetchBook();
        } catch (error) {
            setError(
                error.response?.data?.error || 'Failed to send borrow request'
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleMarkReturned = async () => {
        setError('');
        setSuccess('');
        setActionLoading(true);

        try {
            await booksAPI.markReturned(book.id);
            setSuccess('Book marked as returned and is now available again.');
            fetchBook();
        } catch (error) {
            setError(
                error.response?.data?.error || 'Failed to mark book as returned'
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        setError('');
        setActionLoading(true);

        try {
            await booksAPI.delete(book.id);
            navigate('/my-books', {
                state: { message: 'Book removed from library successfully' },
            });
        } catch (error) {
            setError(
                error.response?.data?.error || 'Failed to delete book'
            );
        } finally {
            setActionLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setActionLoading(true);

        try {
            const response = await booksAPI.update(book.id, {
                title: editTitle.trim(),
                author: editAuthor.trim(),
                genre: editGenre,
            });
            setBook(response.data.data);
            setSuccess('Book updated successfully!');
            setShowEditForm(false);
        } catch (error) {
            setError(
                error.response?.data?.error || 'Failed to update book'
            );
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
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

    if (loading) {
        return (
            <div className="loading-screen" style={{ minHeight: '400px' }}>
                <div className="loading-spinner"></div>
                <p>Loading book details...</p>
            </div>
        );
    }

    if (error && !book) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">❌</div>
                <h3>{error}</h3>
                <button className="btn btn-primary" onClick={() => navigate('/books')}>
                    Back to Library
                </button>
            </div>
        );
    }

    if (!book) return null;

    return (
        <div className="book-details fade-in">
            {/* Back Button */}
            <button
                className="btn btn-outline btn-sm mb-3"
                onClick={() => navigate(-1)}
            >
                <FiArrowLeft /> Back
            </button>

            {/* Alerts */}
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Book Details Card */}
            <div className="book-details-card">
                <div className="book-details-color-bar"></div>
                <div className="book-details-content">
                    {/* Cover + Title Section */}
                    <div
                        style={{
                            display: 'flex',
                            gap: '24px',
                            marginBottom: '24px',
                            flexWrap: 'wrap',
                        }}
                    >
                        {/* Cover Image */}
                        {book.cover_image ? (
                            <img
                                src={book.cover_image}
                                alt={book.title}
                                style={{
                                    width: '150px',
                                    height: '210px',
                                    objectFit: 'cover',
                                    borderRadius: 'var(--radius-sm)',
                                    boxShadow: 'var(--shadow-md)',
                                    flexShrink: 0,
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: '150px',
                                    height: '210px',
                                    background: 'var(--border-light)',
                                    borderRadius: 'var(--radius-sm)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    color: 'var(--text-light)',
                                    fontSize: '3rem',
                                }}
                            >
                                <FiBook />
                            </div>
                        )}

                        {/* Title and Info */}
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <h1 className="book-details-title">{book.title}</h1>
                            <p className="book-details-author">by {book.author}</p>

                            {/* Info Badges */}
                            <div className="book-details-info">
                                <div className="book-details-info-item">
                                    <FiTag />
                                    <span>{book.genre || 'General'}</span>
                                </div>
                                <div className="book-details-info-item">
                                    <FiCalendar />
                                    <span>Added {formatDate(book.created_at)}</span>
                                </div>
                                <div className="book-details-info-item">
                                    <FiBookOpen />
                                    <span className={`badge badge-${book.status}`}>
                                        {book.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Owner Info */}
                    {book.owner && (
                        <div className="book-details-owner">
                            <div className="book-details-owner-avatar">
                                {getInitials(book.owner.name)}
                            </div>
                            <div className="book-details-owner-info">
                                <h4>
                                    <FiUser style={{ marginRight: '6px' }} />
                                    {isOwner ? 'You (Owner)' : book.owner.name}
                                </h4>
                                <p>
                                    <FiMapPin style={{ marginRight: '6px' }} />
                                    Apartment {book.owner.apartment_number}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Borrower Info (visible to owner only) */}
                    {isOwner && book.status === 'borrowed' && book.borrower && (
                        <div
                            className="book-details-owner"
                            style={{ borderLeft: '3px solid var(--secondary)' }}
                        >
                            <div
                                className="book-details-owner-avatar"
                                style={{ background: 'var(--info)' }}
                            >
                                {getInitials(book.borrower.name)}
                            </div>
                            <div className="book-details-owner-info">
                                <h4>
                                    <FiUser style={{ marginRight: '6px' }} />
                                    Currently borrowed by: {book.borrower.name}
                                </h4>
                                <p>
                                    <FiMapPin style={{ marginRight: '6px' }} />
                                    Apartment {book.borrower.apartment_number}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="book-details-actions">
                        {/* Borrower: Request to borrow */}
                        {!isOwner && book.status === 'available' && (
                            <button
                                className="btn btn-primary btn-lg"
                                onClick={() => setShowBorrowForm(true)}
                            >
                                <FiSend /> Request to Borrow
                            </button>
                        )}

                        {/* Borrower: Already borrowed */}
                        {!isOwner && book.status === 'borrowed' && (
                            <div className="alert alert-info" style={{ margin: 0 }}>
                                <FiBookOpen />
                                This book is currently borrowed by someone else.
                            </div>
                        )}

                        {/* Owner: Edit */}
                        {isOwner && book.status !== 'borrowed' && (
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowEditForm(true)}
                            >
                                <FiEdit /> Edit Book
                            </button>
                        )}

                        {/* Owner: Mark Returned */}
                        {isOwner && book.status === 'borrowed' && (
                            <button
                                className="btn btn-success btn-lg"
                                onClick={handleMarkReturned}
                                disabled={actionLoading}
                            >
                                <FiRotateCcw />
                                {actionLoading ? 'Processing...' : 'Mark as Returned'}
                            </button>
                        )}

                        {/* Owner: Delete */}
                        {isOwner && book.status !== 'borrowed' && (
                            <button
                                className="btn btn-danger"
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                <FiTrash2 /> Remove Book
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Borrow Request Modal */}
            {showBorrowForm && (
                <div className="modal-overlay" onClick={() => setShowBorrowForm(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Request to Borrow</h2>
                            <button
                                className="modal-close"
                                onClick={() => setShowBorrowForm(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                gap: '12px',
                                marginBottom: '16px',
                                alignItems: 'center',
                            }}
                        >
                            {book.cover_image ? (
                                <img
                                    src={book.cover_image}
                                    alt={book.title}
                                    style={{
                                        width: '50px',
                                        height: '70px',
                                        objectFit: 'cover',
                                        borderRadius: '4px',
                                        flexShrink: 0,
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: '50px',
                                        height: '70px',
                                        background: 'var(--border-light)',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        color: 'var(--text-light)',
                                    }}
                                >
                                    <FiBook />
                                </div>
                            )}
                            <div>
                                <p style={{ fontWeight: '600', color: 'var(--primary)' }}>
                                    {book.title}
                                </p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    by {book.author} • Apt {book.owner?.apartment_number}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleBorrowRequest}>
                            <div className="form-group">
                                <label htmlFor="borrowMessage">Message (Optional)</label>
                                <textarea
                                    id="borrowMessage"
                                    className="form-control"
                                    placeholder="Add a message to the lender..."
                                    value={borrowMessage}
                                    onChange={(e) => setBorrowMessage(e.target.value)}
                                    disabled={actionLoading}
                                    rows={3}
                                />
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => setShowBorrowForm(false)}
                                    disabled={actionLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={actionLoading}
                                >
                                    <FiSend />
                                    {actionLoading ? 'Sending...' : 'Send Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Book Modal */}
            {showEditForm && (
                <div className="modal-overlay" onClick={() => setShowEditForm(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Edit Book</h2>
                            <button
                                className="modal-close"
                                onClick={() => setShowEditForm(false)}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleEdit}>
                            <div className="form-group">
                                <label htmlFor="editTitle">Title</label>
                                <input
                                    id="editTitle"
                                    type="text"
                                    className="form-control"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    disabled={actionLoading}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="editAuthor">Author</label>
                                <input
                                    id="editAuthor"
                                    type="text"
                                    className="form-control"
                                    value={editAuthor}
                                    onChange={(e) => setEditAuthor(e.target.value)}
                                    disabled={actionLoading}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="editGenre">Genre</label>
                                <select
                                    id="editGenre"
                                    className="form-control"
                                    value={editGenre}
                                    onChange={(e) => setEditGenre(e.target.value)}
                                    disabled={actionLoading}
                                >
                                    {genreOptions.map((g) => (
                                        <option key={g} value={g}>
                                            {g}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => setShowEditForm(false)}
                                    disabled={actionLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={actionLoading}
                                >
                                    <FiEdit />
                                    {actionLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowDeleteConfirm(false)}
                >
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Remove Book</h2>
                            <button
                                className="modal-close"
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                gap: '12px',
                                marginBottom: '16px',
                                alignItems: 'center',
                            }}
                        >
                            {book.cover_image ? (
                                <img
                                    src={book.cover_image}
                                    alt={book.title}
                                    style={{
                                        width: '50px',
                                        height: '70px',
                                        objectFit: 'cover',
                                        borderRadius: '4px',
                                        flexShrink: 0,
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: '50px',
                                        height: '70px',
                                        background: 'var(--border-light)',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        color: 'var(--text-light)',
                                    }}
                                >
                                    <FiBook />
                                </div>
                            )}
                            <div>
                                <p style={{ fontWeight: '600', color: 'var(--primary)' }}>
                                    {book.title}
                                </p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    by {book.author}
                                </p>
                            </div>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            Are you sure you want to remove this book from the community library?
                        </p>
                        <p
                            style={{
                                color: 'var(--danger)',
                                fontSize: '0.85rem',
                                marginBottom: '16px',
                            }}
                        >
                            This action cannot be undone. All borrow requests for this book
                            will also be deleted.
                        </p>

                        <div className="modal-footer">
                            <button
                                className="btn btn-outline"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={actionLoading}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={handleDelete}
                                disabled={actionLoading}
                            >
                                <FiTrash2 />
                                {actionLoading ? 'Removing...' : 'Yes, Remove Book'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookDetails;