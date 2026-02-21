from flask_sqlalchemy import SQLAlchemy
import os

db = SQLAlchemy()


def init_db(app):
    """
    Initialize the SQLite database with the Flask application.

    Args:
        app: Flask application instance
    """

    # Get the base directory of the application
    basedir = os.path.abspath(os.path.dirname(__file__))

    # Database configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(
        basedir, 'virtual_library.db'
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ECHO'] = False  # Set True to log SQL queries

    # Initialize SQLAlchemy with the app
    db.init_app(app)

    # Create all tables
    with app.app_context():
        from models import User, Book, BorrowRequest, Notification
        db.create_all()
        print("✅ Database initialized successfully.")

        # Seed default data if database is empty
        seed_data()


def seed_data():
    """
    Seed the database with sample data if tables are empty.
    This runs only when there are no users in the database.
    """
    from models import User
    from werkzeug.security import generate_password_hash

    # Only seed if no users exist
    if User.query.first() is not None:
        return

    print("🌱 Seeding database with sample data...")

    sample_users = [
        {
            'apartment_number': '101',
            'name': 'Alice Johnson',
            'password_hash': generate_password_hash('password123')
        },
        {
            'apartment_number': '102',
            'name': 'Bob Smith',
            'password_hash': generate_password_hash('password123')
        },
        {
            'apartment_number': '201',
            'name': 'Charlie Brown',
            'password_hash': generate_password_hash('password123')
        },
        {
            'apartment_number': '202',
            'name': 'Diana Prince',
            'password_hash': generate_password_hash('password123')
        },
        {
            'apartment_number': '301',
            'name': 'Eve Williams',
            'password_hash': generate_password_hash('password123')
        }
    ]

    for user_data in sample_users:
        user = User(**user_data)
        db.session.add(user)

    db.session.commit()
    print(f"✅ Added {len(sample_users)} sample users.")

    # Seed sample books
    from models import Book

    sample_books = [
        {
            'title': 'To Kill a Mockingbird',
            'author': 'Harper Lee',
            'cover_image': 'http://books.google.com/books/content?id=PGR2AwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            'genre': 'Fiction',
            'status': 'available',
            'owner_id': 1
        },
        {
            'title': '1984',
            'author': 'George Orwell',
            'cover_image': 'http://books.google.com/books/content?id=kotPYEqx7kMC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            'genre': 'Science Fiction',
            'status': 'available',
            'owner_id': 1
        },
        {
            'title': 'The Great Gatsby',
            'author': 'F. Scott Fitzgerald',
            'cover_image': 'http://books.google.com/books/content?id=iXn5U2IzVH0C&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            'genre': 'Fiction',
            'status': 'available',
            'owner_id': 2
        },
        {
            'title': 'Sapiens',
            'author': 'Yuval Noah Harari',
            'cover_image': 'http://books.google.com/books/content?id=FmyBAwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            'genre': 'Non-Fiction',
            'status': 'available',
            'owner_id': 3
        },
        {
            'title': 'The Alchemist',
            'author': 'Paulo Coelho',
            'cover_image': 'http://books.google.com/books/content?id=FzVjBgAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            'genre': 'Fiction',
            'status': 'available',
            'owner_id': 3
        },
        {
            'title': 'Atomic Habits',
            'author': 'James Clear',
            'cover_image': 'http://books.google.com/books/content?id=XfFvDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            'genre': 'Self-Help',
            'status': 'available',
            'owner_id': 4
        },
        {
            'title': 'Dune',
            'author': 'Frank Herbert',
            'cover_image': 'http://books.google.com/books/content?id=B1hSG45JCX4C&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            'genre': 'Science Fiction',
            'status': 'available',
            'owner_id': 5
        },
        {
            'title': 'Pride and Prejudice',
            'author': 'Jane Austen',
            'cover_image': 'http://books.google.com/books/content?id=s1gVAAAAYAAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            'genre': 'Romance',
            'status': 'available',
            'owner_id': 5
        }
    ]
    
    for book_data in sample_books:
        book = Book(**book_data)
        db.session.add(book)

    db.session.commit()
    print(f"✅ Added {len(sample_books)} sample books.")
    print("🎉 Database seeding complete!")


def reset_db(app):
    """
    Drop all tables and recreate them.
    WARNING: This deletes all data.

    Args:
        app: Flask application instance
    """
    with app.app_context():
        from models import User, Book, BorrowRequest, Notification
        db.drop_all()
        print("🗑️  All tables dropped.")
        db.create_all()
        print("✅ All tables recreated.")
        seed_data()


def get_db_stats():
    """
    Get statistics about the current database.

    Returns:
        Dictionary with table counts
    """
    from models import User, Book, BorrowRequest, Notification

    return {
        'total_users': User.query.count(),
        'total_books': Book.query.count(),
        'available_books': Book.query.filter_by(status='available').count(),
        'borrowed_books': Book.query.filter_by(status='borrowed').count(),
        'total_requests': BorrowRequest.query.count(),
        'pending_requests': BorrowRequest.query.filter_by(status='pending').count(),
        'total_notifications': Notification.query.count(),
        'unread_notifications': Notification.query.filter_by(is_read=False).count()
    }