import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI, booksAPI, requestsAPI } from '../services/api';
import {
    FiUser,
    FiHome,
    FiCalendar,
    FiBook,
    FiBookOpen,
    FiEdit,
    FiLock,
    FiSave,
    FiX,
} from 'react-icons/fi';

const ProfilePage = () => {
    const { user, updateUser } = useAuth();

    const [showEditName, setShowEditName] = useState(false);
    const [showEditPassword, setShowEditPassword] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        totalListed: 0,
        totalBorrowed: 0,
        totalLent: 0,
        totalRequests: 0,
    });

    useEffect(() => {
        fetchProfileStats();
    }, []);

    const fetchProfileStats = async () => {
        try {
            const [myBooksRes, borrowedRes, historyRes] = await Promise.all([
                booksAPI.getMyBooks({}),
                booksAPI.getMyBorrowed(),
                requestsAPI.getHistory(),
            ]);

            const myBooks = myBooksRes.data.data;
            const borrowed = borrowedRes.data.data;
            const history = historyRes.data.data;

            setStats({
                totalListed: myBooks.length,
                currentlyLent: myBooks.filter((b) => b.status === 'borrowed').length,
                totalBorrowed: borrowed.length,
                totalRequests: history.length,
            });
        } catch (error) {
            console.error('Failed to fetch profile stats:', error);
        }
    };

    const handleUpdateName = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!name.trim()) {
            setError('Name cannot be empty');
            return;
        }

        setLoading(true);

        try {
            const response = await authAPI.updateProfile({
                name: name.trim(),
            });
            updateUser(response.data.user);
            setSuccess('Name updated successfully!');
            setShowEditName(false);
        } catch (error) {
            setError(
                error.response?.data?.error || 'Failed to update name'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!password.trim()) {
            setError('Password cannot be empty');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await authAPI.updateProfile({
                password: password,
            });
            setSuccess('Password updated successfully!');
            setPassword('');
            setConfirmPassword('');
            setShowEditPassword(false);
        } catch (error) {
            setError(
                error.response?.data?.error || 'Failed to update password'
            );
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="profile-page fade-in">
            {/* Page Header */}
            <div className="page-header">
                <h1>👤 My Profile</h1>
                <p>View and manage your account information</p>
            </div>

            {/* Alerts */}
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Profile Card */}
            <div className="profile-card">
                {/* Card Header */}
                <div className="profile-card-header">
                    <div className="profile-avatar">
                        {getInitials(user?.name)}
                    </div>
                    <h2>{user?.name}</h2>
                    <p>Apartment {user?.apartment_number}</p>
                </div>

                {/* Card Body */}
                <div className="profile-card-body">
                    {/* Name */}
                    <div className="profile-info-item">
                        <div className="profile-info-icon">
                            <FiUser />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div className="profile-info-label">Full Name</div>
                            <div className="profile-info-value">{user?.name}</div>
                        </div>
                        <button
                            className="btn btn-sm btn-outline"
                            onClick={() => {
                                setShowEditName(!showEditName);
                                setShowEditPassword(false);
                                setError('');
                                setSuccess('');
                            }}
                        >
                            <FiEdit />
                        </button>
                    </div>

                    {/* Apartment */}
                    <div className="profile-info-item">
                        <div className="profile-info-icon">
                            <FiHome />
                        </div>
                        <div>
                            <div className="profile-info-label">Apartment Number</div>
                            <div className="profile-info-value">
                                {user?.apartment_number}
                            </div>
                        </div>
                    </div>

                    {/* Member Since */}
                    <div className="profile-info-item">
                        <div className="profile-info-icon">
                            <FiCalendar />
                        </div>
                        <div>
                            <div className="profile-info-label">Member Since</div>
                            <div className="profile-info-value">
                                {formatDate(user?.created_at)}
                            </div>
                        </div>
                    </div>

                    {/* Books Listed */}
                    <div className="profile-info-item">
                        <div className="profile-info-icon">
                            <FiBook />
                        </div>
                        <div>
                            <div className="profile-info-label">Books Listed</div>
                            <div className="profile-info-value">
                                {stats.totalListed} books ({stats.currentlyLent} currently lent)
                            </div>
                        </div>
                    </div>

                    {/* Books Borrowed */}
                    <div className="profile-info-item">
                        <div className="profile-info-icon">
                            <FiBookOpen />
                        </div>
                        <div>
                            <div className="profile-info-label">Currently Borrowing</div>
                            <div className="profile-info-value">
                                {stats.totalBorrowed} book{stats.totalBorrowed !== 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>

                    {/* Password */}
                    <div className="profile-info-item">
                        <div className="profile-info-icon">
                            <FiLock />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div className="profile-info-label">Password</div>
                            <div className="profile-info-value">••••••••</div>
                        </div>
                        <button
                            className="btn btn-sm btn-outline"
                            onClick={() => {
                                setShowEditPassword(!showEditPassword);
                                setShowEditName(false);
                                setError('');
                                setSuccess('');
                            }}
                        >
                            <FiEdit />
                        </button>
                    </div>
                </div>

                {/* Edit Name Form */}
                {showEditName && (
                    <div className="profile-edit-form">
                        <h3>Edit Name</h3>
                        <form onSubmit={handleUpdateName}>
                            <div className="form-group">
                                <label htmlFor="editName">
                                    <FiUser style={{ marginRight: '6px' }} />
                                    Full Name
                                </label>
                                <input
                                    id="editName"
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter your full name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            <div className="btn-group">
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    <FiSave />
                                    {loading ? 'Saving...' : 'Save Name'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => {
                                        setShowEditName(false);
                                        setName(user?.name || '');
                                        setError('');
                                    }}
                                    disabled={loading}
                                >
                                    <FiX /> Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Edit Password Form */}
                {showEditPassword && (
                    <div className="profile-edit-form">
                        <h3>Change Password</h3>
                        <form onSubmit={handleUpdatePassword}>
                            <div className="form-group">
                                <label htmlFor="newPassword">
                                    <FiLock style={{ marginRight: '6px' }} />
                                    New Password
                                </label>
                                <input
                                    id="newPassword"
                                    type="password"
                                    className="form-control"
                                    placeholder="At least 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmNewPassword">
                                    <FiLock style={{ marginRight: '6px' }} />
                                    Confirm New Password
                                </label>
                                <input
                                    id="confirmNewPassword"
                                    type="password"
                                    className="form-control"
                                    placeholder="Re-enter new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            <div className="btn-group">
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    <FiSave />
                                    {loading ? 'Updating...' : 'Update Password'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => {
                                        setShowEditPassword(false);
                                        setPassword('');
                                        setConfirmPassword('');
                                        setError('');
                                    }}
                                    disabled={loading}
                                >
                                    <FiX /> Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;