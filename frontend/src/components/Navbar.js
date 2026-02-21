import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../services/api';
import {
    FiHome,
    FiBook,
    FiPlusCircle,
    FiList,
    FiBookOpen,
    FiInbox,
    FiBell,
    FiUser,
    FiLogOut,
    FiMenu,
    FiX,
} from 'react-icons/fi';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);
    const [mobileOpen, setMobileOpen] = useState(false);

    // Fetch unread notification count
    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000); // every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const response = await notificationsAPI.getUnreadCount();
            setUnreadCount(response.data.unread_count);
        } catch (error) {
            console.error('Failed to fetch notification count');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const closeMobile = () => {
        setMobileOpen(false);
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

    return (
        <>
            {/* Mobile Top Bar */}
            <div className="mobile-navbar">
                <span className="logo">Lend-a-Read</span>
                <button className="hamburger-btn" onClick={() => setMobileOpen(!mobileOpen)}>
                    {mobileOpen ? <FiX /> : <FiMenu />}
                </button>
            </div>

            {/* Overlay for mobile */}
            <div
                className={`sidebar-overlay ${mobileOpen ? 'open' : ''}`}
                onClick={closeMobile}
            />

            {/* Sidebar */}
            <nav className={`sidebar ${mobileOpen ? 'open' : ''}`}>
                {/* Header */}
                <div className="sidebar-header">
                    <div className="logo">Lend-a-Read</div>
                    <div className="tagline">Share a Story</div>
                </div>

                {/* Navigation Links */}
                <div className="sidebar-nav">
                    {/* Main */}
                    <div className="nav-section">
                        <div className="nav-section-title">Main</div>
                        <NavLink
                            to="/dashboard"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            onClick={closeMobile}
                        >
                            <FiHome className="nav-icon" />
                            Dashboard
                        </NavLink>
                        <NavLink
                            to="/books"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            onClick={closeMobile}
                        >
                            <FiBook className="nav-icon" />
                            Browse Books
                        </NavLink>
                    </div>

                    {/* Lender */}
                    <div className="nav-section">
                        <div className="nav-section-title">Lender</div>
                        <NavLink
                            to="/books/add"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            onClick={closeMobile}
                        >
                            <FiPlusCircle className="nav-icon" />
                            Add Book
                        </NavLink>
                        <NavLink
                            to="/my-books"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            onClick={closeMobile}
                        >
                            <FiList className="nav-icon" />
                            My Books
                        </NavLink>
                    </div>

                    {/* Borrower */}
                    <div className="nav-section">
                        <div className="nav-section-title">Borrower</div>
                        <NavLink
                            to="/my-borrowed"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            onClick={closeMobile}
                        >
                            <FiBookOpen className="nav-icon" />
                            Borrowed Books
                        </NavLink>
                    </div>

                    {/* Activity */}
                    <div className="nav-section">
                        <div className="nav-section-title">Activity</div>
                        <NavLink
                            to="/requests"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            onClick={closeMobile}
                        >
                            <FiInbox className="nav-icon" />
                            Requests
                        </NavLink>
                        <NavLink
                            to="/notifications"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            onClick={closeMobile}
                        >
                            <FiBell className="nav-icon" />
                            Notifications
                            {unreadCount > 0 && (
                                <span className="nav-badge">{unreadCount}</span>
                            )}
                        </NavLink>
                    </div>
                </div>

                {/* Footer */}
                <div className="sidebar-footer">
                    <NavLink
                        to="/profile"
                        className="sidebar-user"
                        onClick={closeMobile}
                    >
                        <div className="sidebar-user-avatar">
                            {getInitials(user?.name)}
                        </div>
                        <div className="sidebar-user-info">
                            <div className="user-name">{user?.name}</div>
                            <div className="user-apt">Apt {user?.apartment_number}</div>
                        </div>
                    </NavLink>
                    <button className="logout-btn" onClick={handleLogout}>
                        <FiLogOut />
                        Logout
                    </button>
                </div>
            </nav>
        </>
    );
};

export default Navbar;