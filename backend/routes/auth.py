from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from database import db
from models import User
from middleware import token_required, generate_token

auth_bp = Blueprint('auth', __name__)


# ──────────────────────────────────────────────
# Register a new user
# ──────────────────────────────────────────────
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    # Validate input
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    apartment_number = data.get('apartment_number', '').strip()
    name = data.get('name', '').strip()
    password = data.get('password', '').strip()

    if not apartment_number or not name or not password:
        return jsonify({
            'error': 'All fields are required',
            'required': ['apartment_number', 'name', 'password']
        }), 400

    if len(password) < 6:
        return jsonify({
            'error': 'Password must be at least 6 characters'
        }), 400

    # Check if apartment number already exists
    existing_user = User.query.filter_by(
        apartment_number=apartment_number
    ).first()

    if existing_user:
        return jsonify({
            'error': 'Apartment number already registered'
        }), 409

    # Create new user
    new_user = User(
        apartment_number=apartment_number,
        name=name,
        password_hash=generate_password_hash(password)
    )

    db.session.add(new_user)
    db.session.commit()

    # Generate token
    token = generate_token(new_user.id)

    return jsonify({
        'status': 'success',
        'message': 'Registration successful',
        'token': token,
        'user': new_user.to_dict()
    }), 201


# ──────────────────────────────────────────────
# Login
# ──────────────────────────────────────────────
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    apartment_number = data.get('apartment_number', '').strip()
    password = data.get('password', '').strip()

    if not apartment_number or not password:
        return jsonify({
            'error': 'Apartment number and password are required'
        }), 400

    # Find user
    user = User.query.filter_by(
        apartment_number=apartment_number
    ).first()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({
            'error': 'Invalid apartment number or password'
        }), 401

    # Generate token
    token = generate_token(user.id)

    return jsonify({
        'status': 'success',
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    }), 200


# ──────────────────────────────────────────────
# Get current user profile
# ──────────────────────────────────────────────
@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    return jsonify({
        'status': 'success',
        'user': current_user.to_dict()
    }), 200


# ──────────────────────────────────────────────
# Update profile
# ──────────────────────────────────────────────
@auth_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    name = data.get('name', '').strip()
    if name:
        current_user.name = name

    password = data.get('password', '').strip()
    if password:
        if len(password) < 6:
            return jsonify({
                'error': 'Password must be at least 6 characters'
            }), 400
        current_user.password_hash = generate_password_hash(password)

    db.session.commit()

    return jsonify({
        'status': 'success',
        'message': 'Profile updated successfully',
        'user': current_user.to_dict()
    }), 200