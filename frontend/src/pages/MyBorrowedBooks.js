import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { booksAPI, requestsAPI } from '../services/api';
import {
    FiBookOpen,
    FiUser,
    FiMapPin,
    FiRotateCcw,
    FiClock,
    FiBook,
} from 'react-icons/fi';

const MyBorrowedBooks = () => {
    const navigate = useNavigate();

    const [borrowedBooks, setBorrowedBooks] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('current');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [borrowedRes, historyRes] = await Promise.all([
                booksAPI.getMyBorrowed(),
                requestsAPI.getHistory(),
            ]);
            setBorrowedBooks(borrowedRes.data.data);
            setHistory(historyRes.data.data);
        } catch (error) {
            setError('Failed to fetch borrowed books');
        } finally {
            setLoading(false);
        }
    };

    const handleReturn = async (requestId) => {
        setError('');
        setSuccess('');
        setActionLoading(true);

        try {
            await requestsAPI.returnBook(requestId);
            setSuccess('Book returned successfully!');
            fetchData();
        } catch (error) {
            setError(
                error.response?.data?.error || 'Failed to return book'
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

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getActiveRequest = (bookId) => {
        return history.find(
            (req) => req.book_id === bookId && req.status === 'approved'
        );
    };

    const getStatusBadge = (status) => {
        return <span className={`badge badge-${status}`}>{status}</span>;
    };

    if (loading) {
        return (
            <div className="loading-screen" style={{ minHeight: '300px' }}>
                <div className="loading-spinner"></div>
                <p>Loading borrowed books...</p>
            </div>
        );
    }

    return (
        <div className="my-borrowed fade-in">
            {/* Page Header */}
            <div className="page-header">
                <h1>📚 My Borrowed Books</h1>
                <p>Books you're currently borrowing and your borrowing history</p>
            </div>

            {/* Alerts */}
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'current' ? 'active' : ''}`}
                    onClick={() => setActiveTab('current')}
                >
                    Currently Borrowed
                    {borrowedBooks.length > 0 && (
                        <span className="tab-badge">{borrowedBooks.length}</span>
                    )}
                </button>
                <button
                    className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    Borrowing History
                </button>
            </div>

            {/* Currently Borrowed Tab */}
            {activeTab === 'current' && (
                <>
                    {borrowedBooks.length > 0 ? (
                        <div className="grid-2">
                            {borrowedBooks.map((book) => {
                                const activeRequest = getActiveRequest(book.id);
                                return (
                                    <div key={book.id} className="card fade-in">
                                        {/* Book Info with Cover */}
                                        <div
                                            style={{
                                                cursor: 'pointer',
                                                display: 'flex',
                                                gap: '16px',
                                            }}
                                            onClick={() => navigate(`/books/${book.id}`)}
                                        >
                                            {/* Cover Image */}
                                            {book.cover_image ? (
                                                <img
                                                    src={book.cover_image}
                                                    alt={book.title}
                                                    style={{
                                                        width: '80px',
                                                        height: '112px',
                                                        objectFit: 'cover',
                                                        borderRadius: '4px',
                                                        boxShadow: 'var(--shadow-sm)',
                                                        flexShrink: 0,
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        width: '80px',
                                                        height: '112px',
                                                        background: 'var(--border-light)',
                                                        borderRadius: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0,
                                                        color: 'var(--text-light)',
                                                        fontSize: '1.8rem',
                                                    }}
                                                >
                                                    <FiBook />
                                                </div>
                                            )}

                                            {/* Book Details */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <h3
                                                    className="font-heading"
                                                    style={{
                                                        color: 'var(--primary)',
                                                        fontSize: '1.05rem',
                                                        marginBottom: '4px',
                                                    }}
                                                >
                                                    {book.title}
                                                </h3>
                                                <p
                                                    style={{
                                                        fontSize: '0.85rem',
                                                        color: 'var(--text-secondary)',
                                                        marginBottom: '8px',
                                                    }}
                                                >
                                                    by {book.author}
                                                </p>

                                                {book.genre && (
                                                    <span
                                                        className="book-card-genre"
                                                        style={{ display: 'inline-block', marginBottom: '8px' }}
                                                    >
                                                        {book.genre}
                                                    </span>
                                                )}

                                                {/* Borrowed Date */}
                                                {activeRequest && (
                                                    <p
                                                        style={{
                                                            fontSize: '0.75rem',
                                                            color: 'var(--text-secondary)',
                                                        }}
                                                    >
                                                        <FiClock style={{ marginRight: '4px' }} />
                                                        Since: {formatDate(activeRequest.responded_at)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Lender Info */}
                                        {book.owner && (
                                            <div
                                                style={{
                                                    background: 'var(--bg-primary)',
                                                    borderRadius: 'var(--radius-sm)',
                                                    padding: '10px',
                                                    marginTop: '14px',
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
                                                        background: 'var(--secondary)',
                                                        color: 'white',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600',
                                                    }}
                                                >
                                                    {getInitials(book.owner.name)}
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
                                                        {book.owner.name}
                                                    </p>
                                                    <p
                                                        style={{
                                                            fontSize: '0.75rem',
                                                            color: 'var(--text-secondary)',
                                                        }}
                                                    >
                                                        <FiMapPin style={{ marginRight: '4px' }} />
                                                        Apt {book.owner.apartment_number}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Return Button */}
                                        <div
                                            style={{
                                                borderTop: '1px solid var(--border-light)',
                                                paddingTop: '12px',
                                                marginTop: '14px',
                                            }}
                                        >
                                            {activeRequest && (
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleReturn(activeRequest.id);
                                                    }}
                                                    disabled={actionLoading}
                                                >
                                                    <FiRotateCcw />
                                                    {actionLoading ? 'Returning...' : 'Return Book'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">📖</div>
                            <h3>No books currently borrowed</h3>
                            <p>Browse the community library to find your next read!</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => navigate('/books')}
                            >
                                <FiBookOpen /> Browse Library
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
                <>
                    {history.length > 0 ? (
                        <div>
                            {history.map((req) => (
                                <div
                                    key={req.id}
                                    className="request-card fade-in"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => navigate(`/books/${req.book_id}`)}
                                >
                                    <div className="request-card-header">
                                        <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                                            {/* Mini Cover */}
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
                                                    color: 'var(--text-light)',
                                                    fontSize: '1rem',
                                                }}
                                            >
                                                <FiBook />
                                            </div>
                                            <div>
                                                <div className="request-card-book">
                                                    {req.book?.title || 'Unknown Book'}
                                                </div>
                                                <div className="request-card-user">
                                                    <FiUser style={{ marginRight: '4px' }} />
                                                    {req.lender?.name || 'Unknown'}
                                                    <FiMapPin
                                                        style={{ marginLeft: '8px', marginRight: '4px' }}
                                                    />
                                                    Apt {req.lender?.apartment_number}
                                                </div>
                                            </div>
                                        </div>
                                        <div>{getStatusBadge(req.status)}</div>
                                    </div>

                                    {req.message && (
                                        <div className="request-card-message">
                                            "{req.message}"
                                        </div>
                                    )}

                                    <div className="request-card-date">
                                        <FiClock style={{ marginRight: '4px' }} />
                                        Requested: {formatDate(req.requested_at)}
                                        {req.responded_at && (
                                            <span style={{ marginLeft: '16px' }}>
                                                Responded: {formatDate(req.responded_at)}
                                            </span>
                                        )}
                                        {req.returned_at && (
                                            <span style={{ marginLeft: '16px' }}>
                                                Returned: {formatDate(req.returned_at)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">📋</div>
                            <h3>No borrowing history</h3>
                            <p>Your borrowing history will appear here once you borrow a book.</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => navigate('/books')}
                            >
                                <FiBookOpen /> Browse Library
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default MyBorrowedBooks;