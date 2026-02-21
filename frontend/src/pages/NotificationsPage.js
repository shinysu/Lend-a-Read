import React, { useState, useEffect } from 'react';
import { notificationsAPI } from '../services/api';
import {
    FiBell,
    FiCheck,
    FiCheckCircle,
    FiTrash2,
    FiBookOpen,
    FiSend,
    FiX,
    FiRotateCcw,
    FiInfo,
    FiXCircle,
} from 'react-icons/fi';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [pagination, setPagination] = useState(null);
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchNotifications();
    }, [unreadOnly, page]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const params = {
                page,
                per_page: 15,
            };
            if (unreadOnly) {
                params.unread = 'true';
            }

            const response = await notificationsAPI.getAll(params);
            setNotifications(response.data.data);
            setUnreadCount(response.data.unread_count);
            setPagination(response.data.pagination);
        } catch (error) {
            setError('Failed to fetch notifications');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await notificationsAPI.markAsRead(notificationId);
            setNotifications((prev) =>
                prev.map((n) =>
                    n.id === notificationId ? { ...n, is_read: true } : n
                )
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            setError('Failed to mark notification as read');
        }
    };

    const handleMarkAllAsRead = async () => {
        setError('');
        setSuccess('');

        try {
            await notificationsAPI.markAllAsRead();
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, is_read: true }))
            );
            setUnreadCount(0);
            setSuccess('All notifications marked as read');
        } catch (error) {
            setError('Failed to mark all as read');
        }
    };

    const handleDelete = async (notificationId) => {
        try {
            await notificationsAPI.delete(notificationId);
            setNotifications((prev) =>
                prev.filter((n) => n.id !== notificationId)
            );
            const deleted = notifications.find((n) => n.id === notificationId);
            if (deleted && !deleted.is_read) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (error) {
            setError('Failed to delete notification');
        }
    };

    const handleClearRead = async () => {
        setError('');
        setSuccess('');

        try {
            await notificationsAPI.clearRead();
            setNotifications((prev) => prev.filter((n) => !n.is_read));
            setSuccess('Read notifications cleared');
        } catch (error) {
            setError('Failed to clear notifications');
        }
    };

    const handleClearAll = async () => {
        setError('');
        setSuccess('');

        try {
            await notificationsAPI.clearAll();
            setNotifications([]);
            setUnreadCount(0);
            setSuccess('All notifications cleared');
        } catch (error) {
            setError('Failed to clear notifications');
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'borrow_request':
                return <FiSend />;
            case 'request_approved':
                return <FiCheckCircle />;
            case 'request_rejected':
                return <FiXCircle />;
            case 'book_returned':
                return <FiRotateCcw />;
            case 'return':
                return <FiBookOpen />;
            case 'request_cancelled':
                return <FiX />;
            default:
                return <FiInfo />;
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });
    };

    return (
        <div className="notifications-page fade-in">
            {/* Page Header */}
            <div className="page-header">
                <div className="d-flex justify-between align-center flex-wrap gap-2">
                    <div>
                        <h1>🔔 Notifications</h1>
                        <p>
                            {unreadCount > 0
                                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''
                                }`
                                : 'You\'re all caught up!'}
                        </p>
                    </div>
                    <div className="btn-group">
                        {unreadCount > 0 && (
                            <button
                                className="btn btn-sm btn-secondary"
                                onClick={handleMarkAllAsRead}
                            >
                                <FiCheck /> Mark All Read
                            </button>
                        )}
                        <button
                            className="btn btn-sm btn-outline"
                            onClick={handleClearRead}
                        >
                            <FiTrash2 /> Clear Read
                        </button>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Filter */}
            <div className="d-flex align-center gap-2 mb-3">
                <button
                    className={`btn btn-sm ${!unreadOnly ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => {
                        setUnreadOnly(false);
                        setPage(1);
                    }}
                >
                    All
                </button>
                <button
                    className={`btn btn-sm ${unreadOnly ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => {
                        setUnreadOnly(true);
                        setPage(1);
                    }}
                >
                    <FiBell /> Unread Only
                    {unreadCount > 0 && (
                        <span
                            style={{
                                background: 'white',
                                color: 'var(--danger)',
                                padding: '1px 6px',
                                borderRadius: '50px',
                                fontSize: '0.7rem',
                                fontWeight: '600',
                                marginLeft: '4px',
                            }}
                        >
                            {unreadCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Loading */}
            {loading ? (
                <div className="loading-screen" style={{ minHeight: '300px' }}>
                    <div className="loading-spinner"></div>
                    <p>Loading notifications...</p>
                </div>
            ) : notifications.length > 0 ? (
                <>
                    <div
                        className="card"
                        style={{ padding: 0, overflow: 'hidden' }}
                    >
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`notification-item ${!notification.is_read ? 'unread' : ''
                                    }`}
                                onClick={() => {
                                    if (!notification.is_read) {
                                        handleMarkAsRead(notification.id);
                                    }
                                }}
                            >
                                <div
                                    className={`notification-icon ${notification.notification_type}`}
                                >
                                    {getNotificationIcon(notification.notification_type)}
                                </div>

                                <div className="notification-content">
                                    <p className="notification-message">
                                        {notification.message}
                                    </p>
                                    <p className="notification-time">
                                        {formatTime(notification.created_at)}
                                    </p>
                                </div>

                                <div className="notification-actions">
                                    {!notification.is_read && (
                                        <button
                                            className="btn btn-sm btn-outline"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMarkAsRead(notification.id);
                                            }}
                                            title="Mark as read"
                                        >
                                            <FiCheck />
                                        </button>
                                    )}
                                    <button
                                        className="btn btn-sm btn-outline"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(notification.id);
                                        }}
                                        title="Delete"
                                        style={{ color: 'var(--danger)' }}
                                    >
                                        <FiTrash2 />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.pages > 1 && (
                        <div className="pagination">
                            <button
                                className="pagination-btn"
                                onClick={() => setPage(page - 1)}
                                disabled={!pagination.has_prev}
                            >
                                Previous
                            </button>
                            <span className="pagination-info">
                                Page {pagination.page} of {pagination.pages}
                            </span>
                            <button
                                className="pagination-btn"
                                onClick={() => setPage(page + 1)}
                                disabled={!pagination.has_next}
                            >
                                Next
                            </button>
                        </div>
                    )}

                    {/* Clear All Button */}
                    {notifications.length > 0 && (
                        <div className="text-center mt-3">
                            <button
                                className="btn btn-sm btn-outline"
                                onClick={handleClearAll}
                                style={{ color: 'var(--danger)' }}
                            >
                                <FiTrash2 /> Clear All Notifications
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon">🔔</div>
                    <h3>No notifications</h3>
                    <p>
                        {unreadOnly
                            ? 'You have no unread notifications'
                            : 'Your notifications will appear here'}
                    </p>
                    {unreadOnly && (
                        <button
                            className="btn btn-outline"
                            onClick={() => {
                                setUnreadOnly(false);
                                setPage(1);
                            }}
                        >
                            Show All Notifications
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;