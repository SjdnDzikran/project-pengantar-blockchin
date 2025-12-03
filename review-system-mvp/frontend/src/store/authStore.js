import { create } from 'zustand';

const useAuthStore = create((set) => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),

    setAuth: (user, token) => {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
    },

    logout: () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
    },

    clearAuth: () => {
        // Alias for logout for backwards compatibility
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
    },

    updateUser: (userData) => {
        const currentUser = useAuthStore.getState().user;
        const updatedUser = { ...currentUser, ...userData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        set({ user: updatedUser });
    },
}));

export default useAuthStore;
