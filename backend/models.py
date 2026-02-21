from database import db
from datetime import datetime


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    apartment_number = db.Column(db.String(20), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    books = db.relationship('Book', backref='owner', lazy=True,
                            foreign_keys='Book.owner_id')

    def to_dict(self):
        return {
            'id': self.id,
            'apartment_number': self.apartment_number,
            'name': self.name,
            'created_at': self.created_at.isoformat()
        }


class Book(db.Model):
    __tablename__ = 'books'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    author = db.Column(db.String(200), nullable=False)
    cover_image = db.Column(db.String(500), default='')
    genre = db.Column(db.String(50), default='General')
    status = db.Column(db.String(20), default='available')
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    borrower_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow,
                           onupdate=datetime.utcnow)

    current_borrower = db.relationship('User', foreign_keys=[borrower_id])

    def to_dict(self, include_owner=True, include_borrower=False):
        data = {
            'id': self.id,
            'title': self.title,
            'author': self.author,
            'cover_image': self.cover_image,
            'genre': self.genre,
            'status': self.status,
            'owner_id': self.owner_id,
            'borrower_id': self.borrower_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        if include_owner and self.owner:
            data['owner'] = {
                'id': self.owner.id,
                'name': self.owner.name,
                'apartment_number': self.owner.apartment_number
            }
        if include_borrower and self.current_borrower:
            data['borrower'] = {
                'id': self.current_borrower.id,
                'name': self.current_borrower.name,
                'apartment_number': self.current_borrower.apartment_number
            }
        return data

        
class BorrowRequest(db.Model):
    __tablename__ = 'borrow_requests'

    id = db.Column(db.Integer, primary_key=True)
    book_id = db.Column(db.Integer, db.ForeignKey('books.id'), nullable=False)
    borrower_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    lender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')
    message = db.Column(db.Text, default='')
    requested_at = db.Column(db.DateTime, default=datetime.utcnow)
    responded_at = db.Column(db.DateTime, nullable=True)
    returned_at = db.Column(db.DateTime, nullable=True)

    book = db.relationship('Book', backref='borrow_requests')
    borrower = db.relationship('User', foreign_keys=[borrower_id])
    lender = db.relationship('User', foreign_keys=[lender_id])

    def to_dict(self):
        return {
            'id': self.id,
            'book_id': self.book_id,
            'borrower_id': self.borrower_id,
            'lender_id': self.lender_id,
            'status': self.status,
            'message': self.message,
            'requested_at': self.requested_at.isoformat(),
            'responded_at': self.responded_at.isoformat() if self.responded_at else None,
            'returned_at': self.returned_at.isoformat() if self.returned_at else None,
            'book': {
                'id': self.book.id,
                'title': self.book.title,
                'author': self.book.author
            } if self.book else None,
            'borrower': {
                'id': self.borrower.id,
                'name': self.borrower.name,
                'apartment_number': self.borrower.apartment_number
            } if self.borrower else None,
            'lender': {
                'id': self.lender.id,
                'name': self.lender.name,
                'apartment_number': self.lender.apartment_number
            } if self.lender else None
        }


class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    notification_type = db.Column(db.String(50), default='info')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='notifications')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'message': self.message,
            'is_read': self.is_read,
            'notification_type': self.notification_type,
            'created_at': self.created_at.isoformat()
        }