import React from 'react';
import {
    FiClock,
    FiCheck,
    FiX,
    FiRotateCcw,
    FiBook,
    FiUser,
    FiMapPin,
} from 'react-icons/fi';

const RequestCard = ({
    request,
    type = 'incoming',
    onApprove,
    onReject,
    onReturn,
    onCancel,
}) => {
    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return <FiClock />;
            case 'approved':
                return <FiCheck />;
            case 'rejected':
                return <FiX />;
            case 'returned':
                return <FiRotateCcw />;
            case 'cancelled':
                return <FiX />;
            default:
                return <FiClock />;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="request-card fade-in">
            <div className="request-card-header">
                <div>
                    <div className="request-card-book">
                        <FiBook style={{ marginRight: '6px' }} />
                        {request.book?.title || 'Unknown Book'}
                    </div>
                    <div className="request-card-user">
                        <FiUser style={{ marginRight: '4px' }} />
                        {type === 'incoming'
                            ? `${request.borrower?.name || 'Unknown'}`
                            : `${request.lender?.name || 'Unknown'}`}
                        <FiMapPin style={{ marginLeft: '8px', marginRight: '4px' }} />
                        Apt{' '}
                        {type === 'incoming'
                            ? request.borrower?.apartment_number
                            : request.lender?.apartment_number}
                    </div>
                </div>
                <div>
                    <span className={`badge badge-${request.status}`}>
                        {getStatusIcon(request.status)}
                        <span style={{ marginLeft: '4px' }}>{request.status}</span>
                    </span>
                </div>
            </div>

            {request.message && (
                <div className="request-card-message">
                    "{request.message}"
                </div>
            )}

            <div className="request-card-date">
                Requested: {formatDate(request.requested_at)}
                {request.responded_at && (
                    <span style={{ marginLeft: '16px' }}>
                        Responded: {formatDate(request.responded_at)}
                    </span>
                )}
                {request.returned_at && (
                    <span style={{ marginLeft: '16px' }}>
                        Returned: {formatDate(request.returned_at)}
                    </span>
                )}
            </div>

            <div className="request-card-actions">
                {/* Lender actions for incoming pending requests */}
                {type === 'incoming' && request.status === 'pending' && (
                    <>
                        <button
                            className="btn btn-sm btn-success"
                            onClick={() => onApprove && onApprove(request.id)}
                        >
                            <FiCheck /> Approve
                        </button>
                        <button
                            className="btn btn-sm btn-danger"
                            onClick={() => onReject && onReject(request.id)}
                        >
                            <FiX /> Reject
                        </button>
                    </>
                )}

                {/* Borrower actions for outgoing pending requests */}
                {type === 'outgoing' && request.status === 'pending' && (
                    <button
                        className="btn btn-sm btn-outline"
                        onClick={() => onCancel && onCancel(request.id)}
                    >
                        <FiX /> Cancel Request
                    </button>
                )}

                {/* Borrower can return approved books */}
                {type === 'outgoing' && request.status === 'approved' && (
                    <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => onReturn && onReturn(request.id)}
                    >
                        <FiRotateCcw /> Return Book
                    </button>
                )}

                {/* Lender can mark as returned for approved requests */}
                {type === 'incoming' && request.status === 'approved' && (
                    <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => onReturn && onReturn(request.id)}
                    >
                        <FiRotateCcw /> Mark Returned
                    </button>
                )}
            </div>
        </div>
    );
};

export default RequestCard;