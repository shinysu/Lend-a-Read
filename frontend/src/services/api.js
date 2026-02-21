import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Automatically attach token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle 401 responses globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ──────────────── Auth ────────────────
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (data) => api.put('/auth/profile', data),
};

// ──────────────── Books ────────────────
export const booksAPI = {
    getAll: (params) => api.get('/books', { params }),
    getById: (id) => api.get(`/books/${id}`),
    create: (data) => api.post('/books', data),
    update: (id, data) => api.put(`/books/${id}`, data),
    delete: (id) => api.delete(`/books/${id}`),
    getMyBooks: (params) => api.get('/books/my-books', { params }),
    getMyBorrowed: () => api.get('/books/my-borrowed'),
    markReturned: (id) => api.put(`/books/${id}/return`),
    getGenres: () => api.get('/books/genres'),
};

// ──────────────── Requests ────────────────
export const requestsAPI = {
    create: (data) => api.post('/requests', data),
    getIncoming: (params) => api.get('/requests/incoming', { params }),
    getOutgoing: (params) => api.get('/requests/outgoing', { params }),
    getById: (id) => api.get(`/requests/${id}`),
    approve: (id) => api.put(`/requests/${id}/approve`),
    reject: (id) => api.put(`/requests/${id}/reject`),
    returnBook: (id) => api.put(`/requests/${id}/return`),
    cancel: (id) => api.put(`/requests/${id}/cancel`),
    getHistory: () => api.get('/requests/history'),
};

// ──────────────── Notifications ────────────────
export const notificationsAPI = {
    getAll: (params) => api.get('/notifications', { params }),
    getUnreadCount: () => api.get('/notifications/count'),
    markAsRead: (id) => api.put(`/notifications/${id}/read`),
    markAllAsRead: () => api.put('/notifications/read-all'),
    delete: (id) => api.delete(`/notifications/${id}`),
    clearRead: () => api.delete('/notifications/clear-read'),
    clearAll: () => api.delete('/notifications/clear-all'),
};

// ──────────────── Stats ────────────────
export const statsAPI = {
    getStats: () => api.get('/stats'),
    healthCheck: () => api.get('/health'),
};

// ──────────────── Google Books ────────────────
export const googleBooksAPI = {
    search: (query) => api.get('/google-books/search', { params: { q: query } }),
};

export default api;