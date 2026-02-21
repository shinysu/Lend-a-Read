import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { statsAPI, booksAPI, requestsAPI } from '../services/api';
import BookCard from '../components/BookCard';
import {
    FiBook,
    FiBookOpen,
    FiUsers,
    FiInbox,
    FiPlusCircle,
    FiArrowRight,
} from 'react-icons/fi';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [recentBooks, setRecentBooks] = useState([]);
    const [myBooks, setMyBooks] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            const [statsRes, booksRes, myBooksRes, requestsRes] = await Promise.all([
                statsAPI.getStats(),
                booksAPI.getAll({ per_page: 4, status: 'available' }),
                booksAPI.getMyBooks({}),
                requestsAPI.getIncoming({ status: 'pending' }),
            ]);

            setStats(statsRes.data.data);
            setRecentBooks(booksRes.data.data);
            setMyBooks(myBooksRes.data.data);
            setPendingRequests(requestsRes.data.data);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard fade-in">
            {/* Welcome Section */}
            <div className="dashboard-welcome">
                <h1>Welcome back, {user?.name}! 👋</h1>
                <p>
                    Apartment {user?.apartment_number} • Your community library at a glance
                </p>
            </div>

            {/* Stats Grid */}
            {stats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon blue">
                            <FiBook />
                        </div>
                        <div className="stat-info">
                            <h3>{stats.total_books}</h3>
                            <p>Total Books</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon green">
                            <FiBookOpen />
                        </div>
                        <div className="stat-info">
                            <h3>{stats.available_books}</h3>
                            <p>Available Books</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon orange">
                            <FiUsers />
                        </div>
                        <div className="stat-info">
                            <h3>{stats.total_users}</h3>
                            <p>Community Members</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon purple">
                            <FiInbox />
                        </div>
                        <div className="stat-info">
                            <h3>{stats.pending_requests}</h3>
                            <p>Pending Requests</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Pending Requests Alert */}
            {pendingRequests.length > 0 && (
                <div className="alert alert-warning mb-3">
                    <FiInbox />
                    You have {pendingRequests.length} pending borrow request
                    {pendingRequests.length > 1 ? 's' : ''}.{' '}
                    <Link
                        to="/requests"
                        style={{ color: 'inherit', fontWeight: '600', textDecoration: 'underline' }}
                    >
                        Review now
                    </Link>
                </div>
            )}

            {/* Quick Actions */}
            <div className="dashboard-section">
                <div className="dashboard-section-header">
                    <h2>Quick Actions</h2>
                </div>
                <div className="grid-3">
                    <Link to="/books/add" className="card" style={{ textDecoration: 'none' }}>
                        <div className="d-flex align-center gap-2">
                            <div
                                className="stat-icon orange"
                                style={{ width: '42px', height: '42px', fontSize: '1.1rem' }}
                            >
                                <FiPlusCircle />
                            </div>
                            <div>
                                <h4 style={{ color: 'var(--primary)', marginBottom: '2px' }}>
                                    Add a Book
                                </h4>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    Share a book with your community
                                </p>
                            </div>
                        </div>
                    </Link>

                    <Link to="/books" className="card" style={{ textDecoration: 'none' }}>
                        <div className="d-flex align-center gap-2">
                            <div
                                className="stat-icon blue"
                                style={{ width: '42px', height: '42px', fontSize: '1.1rem' }}
                            >
                                <FiBook />
                            </div>
                            <div>
                                <h4 style={{ color: 'var(--primary)', marginBottom: '2px' }}>
                                    Browse Library
                                </h4>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    Find your next read
                                </p>
                            </div>
                        </div>
                    </Link>

                    <Link to="/requests" className="card" style={{ textDecoration: 'none' }}>
                        <div className="d-flex align-center gap-2">
                            <div
                                className="stat-icon green"
                                style={{ width: '42px', height: '42px', fontSize: '1.1rem' }}
                            >
                                <FiInbox />
                            </div>
                            <div>
                                <h4 style={{ color: 'var(--primary)', marginBottom: '2px' }}>
                                    View Requests
                                </h4>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    Manage borrow requests
                                </p>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Recently Added Books */}
            <div className="dashboard-section">
                <div className="dashboard-section-header">
                    <h2>Recently Available Books</h2>
                    <Link to="/books">
                        View All <FiArrowRight style={{ marginLeft: '4px' }} />
                    </Link>
                </div>
                {recentBooks.length > 0 ? (
                    <div className="grid-4">
                        {recentBooks.map((book) => (
                            <BookCard key={book.id} book={book} showActions={false} />
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">📚</div>
                        <h3>No books available yet</h3>
                        <p>Be the first to add a book to the community library!</p>
                        <Link to="/books/add" className="btn btn-primary">
                            <FiPlusCircle /> Add a Book
                        </Link>
                    </div>
                )}
            </div>

            {/* My Books Summary */}
            <div className="dashboard-section">
                <div className="dashboard-section-header">
                    <h2>My Listed Books</h2>
                    <Link to="/my-books">
                        View All <FiArrowRight style={{ marginLeft: '4px' }} />
                    </Link>
                </div>
                {myBooks.length > 0 ? (
                    <div className="grid-4">
                        {myBooks.slice(0, 4).map((book) => (
                            <div key={book.id} className="card">
                                <h4
                                    className="font-heading"
                                    style={{ color: 'var(--primary)', marginBottom: '4px' }}
                                >
                                    {book.title}
                                </h4>
                                <p
                                    style={{
                                        fontSize: '0.85rem',
                                        color: 'var(--text-secondary)',
                                        marginBottom: '8px',
                                    }}
                                >
                                    by {book.author}
                                </p>
                                <span className={`badge badge-${book.status}`}>
                                    {book.status}
                                </span>
                                {book.borrower && (
                                    <p
                                        style={{
                                            fontSize: '0.8rem',
                                            color: 'var(--text-secondary)',
                                            marginTop: '8px',
                                        }}
                                    >
                                        Borrowed by: {book.borrower.name} (Apt{' '}
                                        {book.borrower.apartment_number})
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">📖</div>
                        <h3>You haven't listed any books yet</h3>
                        <p>Share your books with the community!</p>
                        <Link to="/books/add" className="btn btn-primary">
                            <FiPlusCircle /> Add a Book
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;