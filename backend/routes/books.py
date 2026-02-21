from flask import Blueprint, request, jsonify
from database import db
from models import Book, User
from middleware import token_required

books_bp = Blueprint('books', __name__)


# ──────────────────────────────────────────────
# Get all available books (with search & filter)
# ──────────────────────────────────────────────
@books_bp.route('', methods=['GET'])
@token_required
def get_all_books(current_user):
    # Query parameters
    search = request.args.get('search', '').strip()
    genre = request.args.get('genre', '').strip()
    status = request.args.get('status', 'available').strip()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    # Build query
    query = Book.query

    # Filter by status
    if status and status != 'all':
        query = query.filter(Book.status == status)

    # Search by title or author
    if search:
        search_term = f'%{search}%'
        query = query.filter(
            db.or_(
                Book.title.ilike(search_term),
                Book.author.ilike(search_term)
            )
        )

    # Filter by genre
    if genre:
        query = query.filter(Book.genre.ilike(f'%{genre}%'))

    # Order by newest first
    query = query.order_by(Book.created_at.desc())

    # Paginate
    paginated = query.paginate(
        page=page, per_page=per_page, error_out=False
    )

    books = [book.to_dict(include_owner=True) for book in paginated.items]

    return jsonify({
        'status': 'success',
        'data': books,
        'pagination': {
            'page': paginated.page,
            'per_page': paginated.per_page,
            'total': paginated.total,
            'pages': paginated.pages,
            'has_next': paginated.has_next,
            'has_prev': paginated.has_prev
        }
    }), 200


# ──────────────────────────────────────────────
# Get a single book by ID
# ──────────────────────────────────────────────
@books_bp.route('/<int:book_id>', methods=['GET'])
@token_required
def get_book(current_user, book_id):
    book = db.session.get(Book, book_id)

    if not book:
        return jsonify({'error': 'Book not found'}), 404

    # Include borrower info only if current user is the owner
    include_borrower = (book.owner_id == current_user.id)

    return jsonify({
        'status': 'success',
        'data': book.to_dict(
            include_owner=True,
            include_borrower=include_borrower
        )
    }), 200


# ──────────────────────────────────────────────
# Add a new book (Lender)
# ──────────────────────────────────────────────
@books_bp.route('', methods=['POST'])
@token_required
def add_book(current_user):
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    title = data.get('title', '').strip()
    author = data.get('author', '').strip()
    cover_image = data.get('cover_image', '').strip()
    genre = data.get('genre', 'General').strip()

    # Validate required fields
    if not title or not author:
        return jsonify({
            'error': 'Title and author are required',
            'required': ['title', 'author']
        }), 400

    # Create new book
    new_book = Book(
        title=title,
        author=author,
        cover_image=cover_image,
        genre=genre,
        status='available',
        owner_id=current_user.id
    )

    db.session.add(new_book)
    db.session.commit()

    return jsonify({
        'status': 'success',
        'message': 'Book added successfully',
        'data': new_book.to_dict(include_owner=True)
    }), 201


# ──────────────────────────────────────────────
# Update a book (Lender - owner only)
# ──────────────────────────────────────────────
@books_bp.route('/<int:book_id>', methods=['PUT'])
@token_required
def update_book(current_user, book_id):
    book = db.session.get(Book, book_id)

    if not book:
        return jsonify({'error': 'Book not found'}), 404

    # Only owner can update
    if book.owner_id != current_user.id:
        return jsonify({
            'error': 'Unauthorized. You can only update your own books'
        }), 403

    # Cannot update a book that is currently borrowed
    if book.status == 'borrowed':
        return jsonify({
            'error': 'Cannot update a book that is currently borrowed'
        }), 400

    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    # Update fields if provided
    title = data.get('title', '').strip()
    author = data.get('author', '').strip()
    description = data.get('description', '').strip()
    genre = data.get('genre', '').strip()

    if title:
        book.title = title
    if author:
        book.author = author
    if description is not None:
        book.description = description
    if genre:
        book.genre = genre

    db.session.commit()

    return jsonify({
        'status': 'success',
        'message': 'Book updated successfully',
        'data': book.to_dict(include_owner=True)
    }), 200


# ──────────────────────────────────────────────
# Delete a book (Lender - owner only)
# ──────────────────────────────────────────────
@books_bp.route('/<int:book_id>', methods=['DELETE'])
@token_required
def delete_book(current_user, book_id):
    book = db.session.get(Book, book_id)

    if not book:
        return jsonify({'error': 'Book not found'}), 404

    # Only owner can delete
    if book.owner_id != current_user.id:
        return jsonify({
            'error': 'Unauthorized. You can only delete your own books'
        }), 403

    # Cannot delete a book that is currently borrowed
    if book.status == 'borrowed':
        return jsonify({
            'error': 'Cannot delete a book that is currently borrowed. '
                     'Wait for the borrower to return it first.'
        }), 400

    # Delete all associated borrow requests
    from models import BorrowRequest
    BorrowRequest.query.filter_by(book_id=book_id).delete()

    db.session.delete(book)
    db.session.commit()

    return jsonify({
        'status': 'success',
        'message': 'Book removed from library successfully'
    }), 200


# ──────────────────────────────────────────────
# Get my books (books I've listed as a lender)
# ──────────────────────────────────────────────
@books_bp.route('/my-books', methods=['GET'])
@token_required
def get_my_books(current_user):
    status_filter = request.args.get('status', '').strip()

    query = Book.query.filter_by(owner_id=current_user.id)

    if status_filter:
        query = query.filter(Book.status == status_filter)

    query = query.order_by(Book.created_at.desc())
    books = query.all()

    books_data = [
        book.to_dict(include_owner=False, include_borrower=True)
        for book in books
    ]

    return jsonify({
        'status': 'success',
        'data': books_data,
        'total': len(books_data)
    }), 200


# ──────────────────────────────────────────────
# Get my borrowed books (books I'm borrowing)
# ──────────────────────────────────────────────
@books_bp.route('/my-borrowed', methods=['GET'])
@token_required
def get_my_borrowed_books(current_user):
    books = Book.query.filter_by(
        borrower_id=current_user.id,
        status='borrowed'
    ).order_by(Book.updated_at.desc()).all()

    books_data = [
        book.to_dict(include_owner=True, include_borrower=False)
        for book in books
    ]

    return jsonify({
        'status': 'success',
        'data': books_data,
        'total': len(books_data)
    }), 200


# ──────────────────────────────────────────────
# Mark a book as returned (Lender only)
# ──────────────────────────────────────────────
@books_bp.route('/<int:book_id>/return', methods=['PUT'])
@token_required
def mark_returned(current_user, book_id):
    book = db.session.get(Book, book_id)

    if not book:
        return jsonify({'error': 'Book not found'}), 404

    if book.owner_id != current_user.id:
        return jsonify({
            'error': 'Unauthorized. Only the owner can mark a book as returned'
        }), 403

    if book.status != 'borrowed':
        return jsonify({
            'error': 'This book is not currently borrowed'
        }), 400

    # Create notification for borrower
    from models import Notification, BorrowRequest
    from datetime import datetime

    borrower_id = book.borrower_id

    # Update the borrow request status
    active_request = BorrowRequest.query.filter_by(
        book_id=book_id,
        borrower_id=borrower_id,
        status='approved'
    ).first()

    if active_request:
        active_request.status = 'returned'
        active_request.returned_at = datetime.utcnow()

    # Reset book status
    book.status = 'available'
    book.borrower_id = None

    # Notify borrower
    notification = Notification(
        user_id=borrower_id,
        message=f'"{book.title}" has been marked as returned by '
                f'Apt {current_user.apartment_number}.',
        notification_type='return'
    )
    db.session.add(notification)
    db.session.commit()

    return jsonify({
        'status': 'success',
        'message': 'Book marked as returned and is now available',
        'data': book.to_dict(include_owner=True)
    }), 200


# ──────────────────────────────────────────────
# Get all genres (for filter dropdown)
# ──────────────────────────────────────────────
@books_bp.route('/genres', methods=['GET'])
@token_required
def get_genres(current_user):
    genres = db.session.query(Book.genre).distinct().all()
    genre_list = sorted([g[0] for g in genres if g[0]])

    return jsonify({
        'status': 'success',
        'data': genre_list
    }), 200