import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user from localStorage on mount
    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));

            // Verify token is still valid
            authAPI
                .getProfile()
                .then((response) => {
                    setUser(response.data.user);
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                })
                .catch(() => {
                    logout();
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const login = async (apartmentNumber, password) => {
        try {
            const response = await authAPI.login({
                apartment_number: apartmentNumber,
                password: password,
            });

            const { token: newToken, user: newUser } = response.data;

            setToken(newToken);
            setUser(newUser);

            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(newUser));

            return { success: true, user: newUser };
        } catch (error) {
            const message =
                error.response?.data?.error || 'Login failed. Please try again.';
            return { success: false, error: message };
        }
    };

    const register = async (apartmentNumber, name, password) => {
        try {
            const response = await authAPI.register({
                apartment_number: apartmentNumber,
                name: name,
                password: password,
            });

            const { token: newToken, user: newUser } = response.data;

            setToken(newToken);
            setUser(newUser);

            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(newUser));

            return { success: true, user: newUser };
        } catch (error) {
            const message =
                error.response?.data?.error || 'Registration failed. Please try again.';
            return { success: false, error: message };
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    const updateUser = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const isAuthenticated = () => {
        return token !== null && user !== null;
    };

    const value = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;