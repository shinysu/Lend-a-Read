from flask import Blueprint, request, jsonify
from database import db
from models import Notification
from middleware import token_required

notifications_bp = Blueprint('notifications', __name__)


# ──────────────────────────────────────────────
# Get all notifications for current user
# ──────────────────────────────────────────────
@notifications_bp.route('', methods=['GET'])
@token_required
def get_notifications(current_user):
    # Query parameters
    unread_only = request.args.get('unread', '').strip().lower() == 'true'
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    # Build query
    query = Notification.query.filter_by(user_id=current_user.id)

    if unread_only:
        query = query.filter_by(is_read=False)

    # Order by newest first
    query = query.order_by(Notification.created_at.desc())

    # Paginate
    paginated = query.paginate(
        page=page, per_page=per_page, error_out=False
    )

    notifications_data = [n.to_dict() for n in paginated.items]

    # Get unread count
    unread_count = Notification.query.filter_by(
        user_id=current_user.id,
        is_read=False
    ).count()

    return jsonify({
        'status': 'success',
        'data': notifications_data,
        'unread_count': unread_count,
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
# Get unread notification count
# ──────────────────────────────────────────────
@notifications_bp.route('/count', methods=['GET'])
@token_required
def get_unread_count(current_user):
    unread_count = Notification.query.filter_by(
        user_id=current_user.id,
        is_read=False
    ).count()

    return jsonify({
        'status': 'success',
        'unread_count': unread_count
    }), 200


# ──────────────────────────────────────────────
# Mark a single notification as read
# ──────────────────────────────────────────────
@notifications_bp.route('/<int:notification_id>/read', methods=['PUT'])
@token_required
def mark_as_read(current_user, notification_id):
    notification = db.session.get(Notification, notification_id)

    if not notification:
        return jsonify({'error': 'Notification not found'}), 404

    # Only the owner can mark as read
    if notification.user_id != current_user.id:
        return jsonify({
            'error': 'Unauthorized. This notification does not belong to you'
        }), 403

    notification.is_read = True
    db.session.commit()

    return jsonify({
        'status': 'success',
        'message': 'Notification marked as read',
        'data': notification.to_dict()
    }), 200


# ──────────────────────────────────────────────
# Mark all notifications as read
# ──────────────────────────────────────────────
@notifications_bp.route('/read-all', methods=['PUT'])
@token_required
def mark_all_as_read(current_user):
    updated_count = Notification.query.filter_by(
        user_id=current_user.id,
        is_read=False
    ).update({'is_read': True})

    db.session.commit()

    return jsonify({
        'status': 'success',
        'message': f'{updated_count} notifications marked as read'
    }), 200


# ──────────────────────────────────────────────
# Delete a single notification
# ──────────────────────────────────────────────
@notifications_bp.route('/<int:notification_id>', methods=['DELETE'])
@token_required
def delete_notification(current_user, notification_id):
    notification = db.session.get(Notification, notification_id)

    if not notification:
        return jsonify({'error': 'Notification not found'}), 404

    # Only the owner can delete
    if notification.user_id != current_user.id:
        return jsonify({
            'error': 'Unauthorized. This notification does not belong to you'
        }), 403

    db.session.delete(notification)
    db.session.commit()

    return jsonify({
        'status': 'success',
        'message': 'Notification deleted'
    }), 200


# ──────────────────────────────────────────────
# Delete all read notifications
# ──────────────────────────────────────────────
@notifications_bp.route('/clear-read', methods=['DELETE'])
@token_required
def clear_read_notifications(current_user):
    deleted_count = Notification.query.filter_by(
        user_id=current_user.id,
        is_read=True
    ).delete()

    db.session.commit()

    return jsonify({
        'status': 'success',
        'message': f'{deleted_count} read notifications cleared'
    }), 200


# ──────────────────────────────────────────────
# Delete all notifications
# ──────────────────────────────────────────────
@notifications_bp.route('/clear-all', methods=['DELETE'])
@token_required
def clear_all_notifications(current_user):
    deleted_count = Notification.query.filter_by(
        user_id=current_user.id
    ).delete()

    db.session.commit()

    return jsonify({
        'status': 'success',
        'message': f'{deleted_count} notifications cleared'
    }), 200