from flask import Blueprint, request, jsonify
from database import db
from models import Book, BorrowRequest, Notification
from middleware import token_required
from datetime import datetime

requests_bp = Blueprint('requests', __name__)


# ──────────────────────────────────────────────
# Create a borrow request (Borrower)
# ──────────────────────────────────────────────
@requests_bp.route('', methods=['POST'])
@token_required
def create_request(current_user):
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    book_id = data.get('book_id')
    message = data.get('message', '').strip()

    if not book_id:
        return jsonify({'error': 'book_id is required'}), 400

    # Find the book
    book = db.session.get(Book, book_id)

    if not book:
        return jsonify({'error': 'Book not found'}), 404

    # Cannot borrow your own book
    if book.owner_id == current_user.id:
        return jsonify({
            'error': 'You cannot borrow your own book'
        }), 400

    # Book must be available
    if book.status != 'available':
        return jsonify({
            'error': 'This book is not available for borrowing'
        }), 400

    # Check if user already has a pending request for this book
    existing_request = BorrowRequest.query.filter_by(
        book_id=book_id,
        borrower_id=current_user.id,
        status='pending'
    ).first()

    if existing_request:
        return jsonify({
            'error': 'You already have a pending request for this book'
        }), 409

    # Create the borrow request
    new_request = BorrowRequest(
        book_id=book_id,
        borrower_id=current_user.id,
        lender_id=book.owner_id,
        message=message,
        status='pending'
    )

    db.session.add(new_request)

    # Notify the lender
    notification = Notification(
        user_id=book.owner_id,
        message=f'{current_user.name} (Apt {current_user.apartment_number}) '
                f'wants to borrow "{book.title}".',
        notification_type='borrow_request'
    )

    db.session.add(notification)
    db.session.commit()

    return jsonify({
        'status': 'success',
        'message': 'Borrow request sent successfully',
        'data': new_request.to_dict()
    }), 201


# ──────────────────────────────────────────────
# Get incoming requests (Lender - requests for my books)
# ──────────────────────────────────────────────
@requests_bp.route('/incoming', methods=['GET'])
@token_required
def get_incoming_requests(current_user):
    status_filter = request.args.get('status', '').strip()

    query = BorrowRequest.query.filter_by(lender_id=current_user.id)

    if status_filter:
        query = query.filter(BorrowRequest.status == status_filter)

    query = query.order_by(BorrowRequest.requested_at.desc())
    requests_list = query.all()

    requests_data = [req.to_dict() for req in requests_list]

    return jsonify({
        'status': 'success',
        'data': requests_data,
        'total': len(requests_data)
    }), 200


# ──────────────────────────────────────────────
# Get outgoing requests (Borrower - my requests)
# ──────────────────────────────────────────────
@requests_bp.route('/outgoing', methods=['GET'])
@token_required
def get_outgoing_requests(current_user):
    status_filter = request.args.get('status', '').strip()

    query = BorrowRequest.query.filter_by(borrower_id=current_user.id)

    if status_filter:
        query = query.filter(BorrowRequest.status == status_filter)

    query = query.order_by(BorrowRequest.requested_at.desc())
    requests_list = query.all()

    requests_data = [req.to_dict() for req in requests_list]

    return jsonify({
        'status': 'success',
        'data': requests_data,
        'total': len(requests_data)
    }), 200


# ──────────────────────────────────────────────
# Approve a borrow request (Lender)
# ──────────────────────────────────────────────
@requests_bp.route('/<int:request_id>/approve', methods=['PUT'])
@token_required
def approve_request(current_user, request_id):
    borrow_request = db.session.get(BorrowRequest, request_id)

    if not borrow_request:
        return jsonify({'error': 'Request not found'}), 404

    # Only the lender can approve
    if borrow_request.lender_id != current_user.id:
        return jsonify({
            'error': 'Unauthorized. Only the book owner can approve requests'
        }), 403

    # Must be pending
    if borrow_request.status != 'pending':
        return jsonify({
            'error': f'Cannot approve. Request status is: {borrow_request.status}'
        }), 400

    # Get the book
    book = db.session.get(Book, borrow_request.book_id)

    if not book:
        return jsonify({'error': 'Book not found'}), 404

    if book.status != 'available':
        return jsonify({
            'error': 'Book is no longer available'
        }), 400

    # Approve the request
    borrow_request.status = 'approved'
    borrow_request.responded_at = datetime.utcnow()

    # Update book status
    book.status = 'borrowed'
    book.borrower_id = borrow_request.borrower_id

    # Reject all other pending requests for this book
    other_requests = BorrowRequest.query.filter(
        BorrowRequest.book_id == book.id,
        BorrowRequest.id != request_id,
        BorrowRequest.status == 'pending'
    ).all()

    for other_req in other_requests:
        other_req.status = 'rejected'
        other_req.responded_at = datetime.utcnow()

        # Notify other borrowers that their request was rejected
        reject_notification = Notification(
            user_id=other_req.borrower_id,
            message=f'Your request to borrow "{book.title}" was declined '
                    f'because the book was lent to someone else.',
            notification_type='request_rejected'
        )
        db.session.add(reject_notification)

    # Notify the approved borrower
    approve_notification = Notification(
        user_id=borrow_request.borrower_id,
        message=f'Your request to borrow "{book.title}" has been approved! '
                f'Pick it up from Apt {current_user.apartment_number}.',
        notification_type='request_approved'
    )
    db.session.add(approve_notification)

    db.session.commit()

    return jsonify({
        'status': 'success',
        'message': 'Request approved successfully',
        'data': borrow_request.to_dict()
    }), 200


# ──────────────────────────────────────────────
# Reject a borrow request (Lender)
# ──────────────────────────────────────────────
@requests_bp.route('/<int:request_id>/reject', methods=['PUT'])
@token_required
def reject_request(current_user, request_id):
    borrow_request = db.session.get(BorrowRequest, request_id)

    if not borrow_request:
        return jsonify({'error': 'Request not found'}), 404

    # Only the lender can reject
    if borrow_request.lender_id != current_user.id:
        return jsonify({
            'error': 'Unauthorized. Only the book owner can reject requests'
        }), 403

    # Must be pending
    if borrow_request.status != 'pending':
        return jsonify({
            'error': f'Cannot reject. Request status is: {borrow_request.status}'
        }), 400

    # Get the book
    book = db.session.get(Book, borrow_request.book_id)

    # Reject the request
    borrow_request.status = 'rejected'
    borrow_request.responded_at = datetime.utcnow()

    # Notify the borrower
    notification = Notification(
        user_id=borrow_request.borrower_id,
        message=f'Your request to borrow "{book.title}" has been declined '
                f'by Apt {current_user.apartment_number}.',
        notification_type='request_rejected'
    )
    db.session.add(notification)

    db.session.commit()

    return jsonify({
        'status': 'success',
        'message': 'Request rejected',
        'data': borrow_request.to_dict()
    }), 200


# ──────────────────────────────────────────────
# Return a borrowed book (Borrower initiates return)
# ──────────────────────────────────────────────
@requests_bp.route('/<int:request_id>/return', methods=['PUT'])
@token_required
def return_book(current_user, request_id):
    borrow_request = db.session.get(BorrowRequest, request_id)

    if not borrow_request:
        return jsonify({'error': 'Request not found'}), 404

    # Only the borrower can initiate return
    if borrow_request.borrower_id != current_user.id:
        return jsonify({
            'error': 'Unauthorized. Only the borrower can return the book'
        }), 403

    # Must be approved (currently borrowed)
    if borrow_request.status != 'approved':
        return jsonify({
            'error': f'Cannot return. Request status is: {borrow_request.status}'
        }), 400

    # Get the book
    book = db.session.get(Book, borrow_request.book_id)

    if not book:
        return jsonify({'error': 'Book not found'}), 404

    # Update request status
    borrow_request.status = 'returned'
    borrow_request.returned_at = datetime.utcnow()

    # Update book status
    book.status = 'available'
    book.borrower_id = None

    # Notify the lender
    notification = Notification(
        user_id=borrow_request.lender_id,
        message=f'{current_user.name} (Apt {current_user.apartment_number}) '
                f'has returned "{book.title}".',
        notification_type='book_returned'
    )
    db.session.add(notification)

    db.session.commit()

    return jsonify({
        'status': 'success',
        'message': 'Book returned successfully',
        'data': borrow_request.to_dict()
    }), 200


# ──────────────────────────────────────────────
# Cancel a borrow request (Borrower)
# ──────────────────────────────────────────────
@requests_bp.route('/<int:request_id>/cancel', methods=['PUT'])
@token_required
def cancel_request(current_user, request_id):
    borrow_request = db.session.get(BorrowRequest, request_id)

    if not borrow_request:
        return jsonify({'error': 'Request not found'}), 404

    # Only the borrower can cancel
    if borrow_request.borrower_id != current_user.id:
        return jsonify({
            'error': 'Unauthorized. Only the borrower can cancel the request'
        }), 403

    # Must be pending
    if borrow_request.status != 'pending':
        return jsonify({
            'error': f'Cannot cancel. Request status is: {borrow_request.status}'
        }), 400

    # Get the book
    book = db.session.get(Book, borrow_request.book_id)

    # Update request status
    borrow_request.status = 'cancelled'
    borrow_request.responded_at = datetime.utcnow()

    # Notify the lender
    notification = Notification(
        user_id=borrow_request.lender_id,
        message=f'{current_user.name} (Apt {current_user.apartment_number}) '
                f'cancelled their request to borrow "{book.title}".',
        notification_type='request_cancelled'
    )
    db.session.add(notification)

    db.session.commit()

    return jsonify({
        'status': 'success',
        'message': 'Request cancelled successfully',
        'data': borrow_request.to_dict()
    }), 200


# ──────────────────────────────────────────────
# Get a single request by ID
# ──────────────────────────────────────────────
@requests_bp.route('/<int:request_id>', methods=['GET'])
@token_required
def get_request(current_user, request_id):
    borrow_request = db.session.get(BorrowRequest, request_id)

    if not borrow_request:
        return jsonify({'error': 'Request not found'}), 404

    # Only lender or borrower can view
    if (borrow_request.lender_id != current_user.id and
            borrow_request.borrower_id != current_user.id):
        return jsonify({
            'error': 'Unauthorized. You are not part of this request'
        }), 403

    return jsonify({
        'status': 'success',
        'data': borrow_request.to_dict()
    }), 200


# ──────────────────────────────────────────────
# Get borrowing history (Borrower)
# ──────────────────────────────────────────────
@requests_bp.route('/history', methods=['GET'])
@token_required
def get_borrow_history(current_user):
    requests_list = BorrowRequest.query.filter_by(
        borrower_id=current_user.id
    ).order_by(
        BorrowRequest.requested_at.desc()
    ).all()

    requests_data = [req.to_dict() for req in requests_list]

    return jsonify({
        'status': 'success',
        'data': requests_data,
        'total': len(requests_data)
    }), 200