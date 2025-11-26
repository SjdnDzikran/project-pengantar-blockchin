import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import useAuthStore from './store/authStore';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import CompanyList from './components/Company/CompanyList';
import CompanyDetail from './components/Company/CompanyDetail';
import ReviewForm from './components/Review/ReviewForm';
import UserDashboard from './components/Dashboard/UserDashboard';
import './App.css';

// Protected Route Component
function ProtectedRoute({ children }) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
    return (
        <Router>
            <div className="App">
                <ToastContainer
                    position="top-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                />

                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/companies" element={<CompanyList />} />
                    <Route path="/companies/:id" element={<CompanyDetail />} />

                    {/* Protected Routes */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <UserDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/review/:companyId"
                        element={
                            <ProtectedRoute>
                                <ReviewForm />
                            </ProtectedRoute>
                        }
                    />

                    {/* Default Route */}
                    <Route path="/" element={<Navigate to="/companies" />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
