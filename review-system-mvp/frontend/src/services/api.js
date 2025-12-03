import axios from 'axios';

// Default to same-origin API to avoid CSP/cross-origin issues in production
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.error('Request requires wallet connection');
        }
        return Promise.reject(error);
    }
);

// Auth APIs
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getProfile: () => api.get('/auth/profile'),
    // Wallet authentication
    getNonce: (walletAddress) => api.get(`/auth/wallet/nonce/${walletAddress}`),
    verifySignature: (walletAddress, signature) => api.post('/auth/wallet/verify', { walletAddress, signature }),
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
    prepare: (data) => api.post('/reviews/prepare', data),
    submit: (data) => api.post('/reviews', data),
    getById: (id) => api.get(`/reviews/${id}`),
    getUserReviews: (walletAddress) => api.get(`/reviews/user/${walletAddress}`),
    verify: (id) => api.get(`/reviews/${id}/verify`),
};

// Verification APIs
export const verificationAPI = {
    submit: (data) => api.post('/verifications', data),
    check: (companyId, walletAddress) => api.get(`/verifications/${companyId}/${walletAddress}`),
};

export default api;
