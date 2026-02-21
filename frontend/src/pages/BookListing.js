import React, { useState, useEffect } from 'react';
import { booksAPI } from '../services/api';
import BookCard from '../components/BookCard';
import { FiSearch, FiFilter } from 'react-icons/fi';

const BookListing = () => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [genre, setGenre] = useState('');
    const [status, setStatus] = useState('available');
    const [genres, setGenres] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchGenres();
    }, []);

    useEffect(() => {
        fetchBooks();
    }, [search, genre, status, page]);

    const fetchGenres = async () => {
        try {
            const response = await booksAPI.getGenres();
            setGenres(response.data.data);
        } catch (error) {
            console.error('Failed to fetch genres:', error);
        }
    };

    const fetchBooks = async () => {
        try {
            setLoading(true);
            const response = await booksAPI.getAll({
                search,
                genre,
                status,
                page,
                per_page: 12,
            });
            setBooks(response.data.data);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Failed to fetch books:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleGenreChange = (e) => {
        setGenre(e.target.value);
        setPage(1);
    };

    const handleStatusChange = (e) => {
        setStatus(e.target.value);
        setPage(1);
    };

    const handlePrevPage = () => {
        if (pagination && pagination.has_prev) {
            setPage(page - 1);
        }
    };

    const handleNextPage = () => {
        if (pagination && pagination.has_next) {
            setPage(page + 1);
        }
    };

    return (
        <div className="book-listing fade-in">
            {/* Page Header */}
            <div className="page-header">
                <h1>📚 Community Library</h1>
                <p>Browse and discover books shared by your neighbors</p>
            </div>

            {/* Search and Filters */}
            <div className="search-bar">
                <div className="search-input-wrapper">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by title or author..."
                        value={search}
                        onChange={handleSearchChange}
                    />
                </div>

                <div className="search-filter">
                    <select value={genre} onChange={handleGenreChange}>
                        <option value="">All Genres</option>
                        {genres.map((g) => (
                            <option key={g} value={g}>
                                {g}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="search-filter">
                    <select value={status} onChange={handleStatusChange}>
                        <option value="available">Available</option>
                        <option value="borrowed">Borrowed</option>
                        <option value="all">All Books</option>
                    </select>
                </div>
            </div>

            {/* Results Info */}
            {pagination && (
                <div
                    className="d-flex justify-between align-center mb-2"
                    style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}
                >
                    <span>
                        <FiFilter style={{ marginRight: '6px' }} />
                        Showing {books.length} of {pagination.total} books
                    </span>
                    {search && (
                        <span>
                            Results for: "<strong>{search}</strong>"
                        </span>
                    )}
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="loading-screen" style={{ minHeight: '300px' }}>
                    <div className="loading-spinner"></div>
                    <p>Loading books...</p>
                </div>
            ) : books.length > 0 ? (
                <>
                    {/* Book Grid */}
                    <div className="grid-3">
                        {books.map((book) => (
                            <BookCard key={book.id} book={book} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.pages > 1 && (
                        <div className="pagination">
                            <button
                                className="pagination-btn"
                                onClick={handlePrevPage}
                                disabled={!pagination.has_prev}
                            >
                                Previous
                            </button>
                            <span className="pagination-info">
                                Page {pagination.page} of {pagination.pages}
                            </span>
                            <button
                                className="pagination-btn"
                                onClick={handleNextPage}
                                disabled={!pagination.has_next}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            ) : (
                /* Empty State */
                <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <h3>No books found</h3>
                    <p>
                        {search || genre
                            ? 'Try adjusting your search or filters'
                            : 'No books have been added to the library yet'}
                    </p>
                    {(search || genre) && (
                        <button
                            className="btn btn-outline"
                            onClick={() => {
                                setSearch('');
                                setGenre('');
                                setStatus('available');
                                setPage(1);
                            }}
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default BookListing;