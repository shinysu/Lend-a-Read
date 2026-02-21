from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from database import db, init_db, get_db_stats
import os


def create_app():
    app = Flask(
        __name__,
        static_folder='../frontend/build',
        static_url_path=''
    )

    app.config['SECRET_KEY'] = os.environ.get(
        'SECRET_KEY', 'your-secret-key-change-in-production'
    )

    CORS(app, resources={
        r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "PATCH"],
            "allow_headers": ["Content-Type", "Authorization"],
        }
    })

    init_db(app)

    from routes.auth import auth_bp
    from routes.books import books_bp
    from routes.requests import requests_bp
    from routes.notifications import notifications_bp
    from routes.google_books import google_books_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(books_bp, url_prefix='/api/books')
    app.register_blueprint(requests_bp, url_prefix='/api/requests')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    app.register_blueprint(google_books_bp, url_prefix='/api/google-books')

    @app.route('/api/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'message': 'Lend-a-Read API is running'
        })

    @app.route('/api/stats')
    def stats():
        return jsonify({
            'status': 'success',
            'data': get_db_stats()
        })

    @app.route('/')
    def serve():
        return send_from_directory(app.static_folder, 'index.html')

    @app.route('/<path:path>')
    def serve_static(path):
        file_path = os.path.join(app.static_folder, path)
        if os.path.exists(file_path):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, 'index.html')

    @app.errorhandler(404)
    def not_found(error):
        return send_from_directory(app.static_folder, 'index.html')

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'error': 'Internal Server Error'}), 500

    return app


if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)