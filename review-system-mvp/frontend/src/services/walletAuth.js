import axios from 'axios';

// Default to same-origin API to avoid CSP/cross-origin issues in production
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Wallet Authentication API
export const walletAuthAPI = {
    getNonce: (walletAddress) => 
        apiClient.get(`/auth/wallet/nonce/${walletAddress}`),
    
    verifySignature: (walletAddress, signature) =>
        apiClient.post('/auth/wallet/verify', { walletAddress, signature }),
    
    getCurrentUser: () =>
        apiClient.get('/auth/me'),
};

// Legacy Auth API (keep for now)
export const authAPI = {
    register: (data) => apiClient.post('/auth/register', data),
    login: (data) => apiClient.post('/auth/login', data),
    getProfile: () => apiClient.get('/auth/profile'),
};

// Company API
export const companyAPI = {
    getAll: () => apiClient.get('/companies'),
    getById: (id) => apiClient.get(`/companies/${id}`),
    search: (params) => apiClient.get('/companies/search', { params }),
    create: (data) => apiClient.post('/companies', data),
};

// Verification API
export const verificationAPI = {
    submit: (data) => apiClient.post('/verifications', data),
    getUserVerifications: () => apiClient.get('/verifications/user'),
    checkVerification: (companyId) => apiClient.get(`/verifications/check/${companyId}`),
};

// Review API
export const reviewAPI = {
    submit: (data) => apiClient.post('/reviews', data),
    getByCompany: (companyId) => apiClient.get(`/reviews/company/${companyId}`),
    getUserReviews: () => apiClient.get('/reviews/user'),
    verify: (reviewId) => apiClient.get(`/reviews/verify/${reviewId}`),
};

export default apiClient;
