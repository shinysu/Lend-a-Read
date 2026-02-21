import React, { useState, useEffect } from 'react';
import { requestsAPI, booksAPI } from '../services/api';
import RequestCard from '../components/RequestCard';
import {
    FiInbox,
    FiSend,
    FiFilter,
} from 'react-icons/fi';

const RequestsPage = () => {
    const [activeTab, setActiveTab] = useState('incoming');
    const [statusFilter, setStatusFilter] = useState('');
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [outgoingRequests, setOutgoingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, [activeTab, statusFilter]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter) {
                params.status = statusFilter;
            }

            if (activeTab === 'incoming') {
                const response = await requestsAPI.getIncoming(params);
                setIncomingRequests(response.data.data);
            } else {
                const response = await requestsAPI.getOutgoing(params);
                setOutgoingRequests(response.data.data);
            }
        } catch (error) {
            setError('Failed to fetch requests');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (requestId) => {
        setError('');
        setSuccess('');
        setActionLoading(true);

        try {
            await requestsAPI.approve(requestId);
            setSuccess('Request approved successfully!');
            fetchRequests();
        } catch (error) {
            setError(
                error.response?.data?.error || 'Failed to approve request'
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (requestId) => {
        setError('');
        setSuccess('');
        setActionLoading(true);

        try {
            await requestsAPI.reject(requestId);
            setSuccess('Request rejected.');
            fetchRequests();
        } catch (error) {
            setError(
                error.response?.data?.error || 'Failed to reject request'
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleReturn = async (requestId) => {
        setError('');
        setSuccess('');
        setActionLoading(true);

        try {
            if (activeTab === 'incoming') {
                // Lender marking as returned - find the book and use booksAPI
                const request = incomingRequests.find((r) => r.id === requestId);
                if (request) {
                    await booksAPI.markReturned(request.book_id);
                }
            } else {
                // Borrower returning
                await requestsAPI.returnBook(requestId);
            }
            setSuccess('Book returned successfully!');
            fetchRequests();
        } catch (error) {
            setError(
                error.response?.data?.error || 'Failed to return book'
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = async (requestId) => {
        setError('');
        setSuccess('');
        setActionLoading(true);

        try {
            await requestsAPI.cancel(requestId);
            setSuccess('Request cancelled.');
            fetchRequests();
        } catch (error) {
            setError(
                error.response?.data?.error || 'Failed to cancel request'
            );
        } finally {
            setActionLoading(false);
        }
    };

    const getPendingCount = (requests) => {
        return requests.filter((r) => r.status === 'pending').length;
    };

    const currentRequests =
        activeTab === 'incoming' ? incomingRequests : outgoingRequests;

    return (
        <div className="requests-page fade-in">
            {/* Page Header */}
            <div className="page-header">
                <h1>📬 Borrow Requests</h1>
                <p>Manage incoming and outgoing borrow requests</p>
            </div>

            {/* Alerts */}
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'incoming' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('incoming');
                        setStatusFilter('');
                    }}
                >
                    <FiInbox style={{ marginRight: '6px' }} />
                    Incoming
                    {getPendingCount(incomingRequests) > 0 && (
                        <span className="tab-badge">
                            {getPendingCount(incomingRequests)}
                        </span>
                    )}
                </button>
                <button
                    className={`tab ${activeTab === 'outgoing' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('outgoing');
                        setStatusFilter('');
                    }}
                >
                    <FiSend style={{ marginRight: '6px' }} />
                    Outgoing
                    {getPendingCount(outgoingRequests) > 0 && (
                        <span className="tab-badge">
                            {getPendingCount(outgoingRequests)}
                        </span>
                    )}
                </button>
            </div>

            {/* Status Filter */}
            <div
                className="d-flex align-center gap-2 mb-3"
                style={{ flexWrap: 'wrap' }}
            >
                <FiFilter style={{ color: 'var(--text-secondary)' }} />
                <span
                    style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        marginRight: '8px',
                    }}
                >
                    Filter:
                </span>
                {['', 'pending', 'approved', 'rejected', 'returned', 'cancelled'].map(
                    (s) => (
                        <button
                            key={s}
                            className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-outline'
                                }`}
                            onClick={() => setStatusFilter(s)}
                            style={{ textTransform: 'capitalize' }}
                        >
                            {s || 'All'}
                        </button>
                    )
                )}
            </div>

            {/* Loading */}
            {loading ? (
                <div className="loading-screen" style={{ minHeight: '300px' }}>
                    <div className="loading-spinner"></div>
                    <p>Loading requests...</p>
                </div>
            ) : currentRequests.length > 0 ? (
                <div>
                    {currentRequests.map((req) => (
                        <RequestCard
                            key={req.id}
                            request={req}
                            type={activeTab}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            onReturn={handleReturn}
                            onCancel={handleCancel}
                        />
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon">📭</div>
                    <h3>
                        {statusFilter
                            ? `No ${statusFilter} requests`
                            : `No ${activeTab} requests`}
                    </h3>
                    <p>
                        {activeTab === 'incoming'
                            ? 'When someone requests to borrow your books, it will appear here.'
                            : 'When you request to borrow a book, it will appear here.'}
                    </p>
                    {statusFilter && (
                        <button
                            className="btn btn-outline"
                            onClick={() => setStatusFilter('')}
                        >
                            Clear Filter
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default RequestsPage;