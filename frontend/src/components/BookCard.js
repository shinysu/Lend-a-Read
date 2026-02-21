import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMapPin, FiBook } from 'react-icons/fi';

const BookCard = ({ book, showActions = true }) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const isOwner = user?.id === book.owner_id;

    const handleClick = () => {
        navigate(`/books/${book.id}`);
    };

    const getStatusBadge = (status) => {
        return <span className={`badge badge-${status}`}>{status}</span>;
    };

    return (
        <div className="book-card fade-in">
            <div className="book-card-color-bar"></div>
            <div className="book-card-body" onClick={handleClick} style={{ cursor: 'pointer' }}>
                {/* Cover Image */}
                <div style={{ display: 'flex', gap: '14px', marginBottom: '12px' }}>
                    {book.cover_image ? (
                        <img
                            src={book.cover_image}
                            alt={book.title}
                            style={{
                                width: '60px',
                                height: '84px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                                boxShadow: 'var(--shadow-sm)',
                                flexShrink: 0,
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: '60px',
                                height: '84px',
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

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 className="book-card-title">{book.title}</h3>
                        <p className="book-card-author">by {book.author}</p>
                    </div>
                </div>

                <div className="book-card-meta">
                    {book.genre && (
                        <span className="book-card-genre">{book.genre}</span>
                    )}
                    {getStatusBadge(book.status)}
                </div>
            </div>

            <div className="book-card-footer">
                {book.owner && !isOwner ? (
                    <div className="book-card-owner">
                        <FiUser style={{ marginRight: '4px' }} />
                        {book.owner.name}
                        <FiMapPin style={{ marginLeft: '8px', marginRight: '4px' }} />
                        Apt {book.owner.apartment_number}
                    </div>
                ) : isOwner ? (
                    <div className="book-card-owner">
                        <span style={{ color: 'var(--secondary)', fontWeight: '500' }}>
                            Your Book
                        </span>
                    </div>
                ) : (
                    <div className="book-card-owner"></div>
                )}

                {showActions && (
                    <button
                        className="btn btn-sm btn-primary"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleClick();
                        }}
                    >
                        View Details
                    </button>
                )}
            </div>
        </div>
    );
};

export default BookCard;