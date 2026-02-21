import jwt
from functools import wraps
from flask import request, jsonify, current_app
from models import User
from database import db


def token_required(f):
    """
    Decorator to protect routes that require authentication.
    Extracts and validates JWT token from the Authorization header.
    Passes the current_user object to the decorated function.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        # Extract token from Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]

        # Check if token exists
        if not token:
            return jsonify({
                'error': 'Authentication token is missing',
                'message': 'Please log in to access this resource'
            }), 401

        try:
            # Decode and verify the token
            payload = jwt.decode(
                token,
                current_app.config['SECRET_KEY'],
                algorithms=['HS256']
            )

            # Get user ID from token payload
            user_id = payload.get('user_id')
            if not user_id:
                return jsonify({
                    'error': 'Invalid token',
                    'message': 'Token payload is malformed'
                }), 401

            # Fetch the user from database
            current_user = db.session.get(User, user_id)
            if not current_user:
                return jsonify({
                    'error': 'User not found',
                    'message': 'The user associated with this token no longer exists'
                }), 401

        except jwt.ExpiredSignatureError:
            return jsonify({
                'error': 'Token expired',
                'message': 'Your session has expired. Please log in again'
            }), 401

        except jwt.InvalidTokenError:
            return jsonify({
                'error': 'Invalid token',
                'message': 'The provided token is invalid'
            }), 401

        except Exception as e:
            return jsonify({
                'error': 'Authentication failed',
                'message': str(e)
            }), 401

        # Pass current_user to the route function
        return f(current_user, *args, **kwargs)

    return decorated


def optional_token(f):
    """
    Decorator for routes where authentication is optional.
    If a valid token is provided, current_user is passed.
    If no token or invalid token, current_user is None.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        current_user = None
        token = None

        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]

        if token:
            try:
                payload = jwt.decode(
                    token,
                    current_app.config['SECRET_KEY'],
                    algorithms=['HS256']
                )
                user_id = payload.get('user_id')
                if user_id:
                    current_user = db.session.get(User, user_id)
            except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
                current_user = None

        return f(current_user, *args, **kwargs)

    return decorated


def generate_token(user_id, expires_hours=24):
    """
    Generate a JWT token for a given user ID.

    Args:
        user_id: The ID of the user
        expires_hours: Number of hours until token expires (default 24)

    Returns:
        Encoded JWT token string
    """
    from datetime import datetime, timedelta

    payload = {
        'user_id': user_id,
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(hours=expires_hours)
    }

    token = jwt.encode(
        payload,
        current_app.config['SECRET_KEY'],
        algorithm='HS256'
    )

    return token


def get_current_user_from_token(token):
    """
    Utility function to extract user from a token string.

    Args:
        token: JWT token string

    Returns:
        User object or None
    """
    try:
        payload = jwt.decode(
            token,
            current_app.config['SECRET_KEY'],
            algorithms=['HS256']
        )
        user_id = payload.get('user_id')
        if user_id:
            return db.session.get(User, user_id)
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None

    return None