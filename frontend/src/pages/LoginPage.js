import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiLock } from 'react-icons/fi';

const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [apartmentNumber, setApartmentNumber] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!apartmentNumber.trim() || !password.trim()) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);

        const result = await login(apartmentNumber.trim(), password);

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    return (
        <div className="auth-page">
            <div className="auth-container fade-in">
                <div className="auth-header">
                    <h1 className="logo">Lend-a-Read</h1>
                    <p className="tagline">Share a Story</p>
                    <p className="subtitle">
                        Welcome back! Log in with your apartment number.
                    </p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="apartment">
                            <FiHome style={{ marginRight: '6px' }} />
                            Apartment Number
                        </label>
                        <input
                            id="apartment"
                            type="text"
                            className="form-control"
                            placeholder="e.g. 101"
                            value={apartmentNumber}
                            onChange={(e) => setApartmentNumber(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">
                            <FiLock style={{ marginRight: '6px' }} />
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            className="form-control"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-block btn-lg"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Log In'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Don't have an account?{' '}
                        <Link to="/register">Register here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;