import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth APIs
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getProfile: () => api.get('/auth/profile'),
};

// Company APIs
export const companyAPI = {
    getAll: () => api.get('/companies'),
    getById: (id) => api.get(`/companies/${id}`),
    getReviews: (id, params) => api.get(`/companies/${id}/reviews`, { params }),
    search: (params) => api.get('/companies/search', { params }),
    create: (data) => api.post('/companies', data),
};

// Review APIs
export const reviewAPI = {
    submit: (data) => api.post('/reviews', data),
    getById: (id) => api.get(`/reviews/${id}`),
    getUserReviews: () => api.get('/reviews/user'),
    verify: (id) => api.get(`/reviews/${id}/verify`),
};

// Verification APIs
export const verificationAPI = {
    submit: (data) => api.post('/verifications', data),
    getAll: () => api.get('/verifications'),
    check: (companyId) => api.get(`/verifications/${companyId}`),
};

export default api;
