import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import useWalletStore from './store/walletStore';
import LandingPage from './components/Landing/LandingPage';
import CompanyList from './components/Company/CompanyList';
import CompanyDetail from './components/Company/CompanyDetail';
import ReviewForm from './components/Review/ReviewForm';
import UserDashboard from './components/Dashboard/UserDashboard';
import './App.css';

// Protected Route Component - requires wallet connection
function ProtectedRoute({ children }) {
    const isConnected = useWalletStore((state) => state.isConnected);
    return isConnected ? children : <Navigate to="/" />;
}

function App() {
    const setupListeners = useWalletStore((state) => state.setupListeners);

    useEffect(() => {
        // Setup wallet event listeners on mount
        setupListeners();
    }, [setupListeners]);

    return (
        <Router>
            <div className="App">
                <ToastContainer
                    position="bottom-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="dark"
                    limit={1}
                />

                <Routes>
                    {/* Landing Page with wallet connection */}
                    <Route path="/" element={<LandingPage />} />

                    {/* Public Routes */}
                    <Route path="/companies" element={<CompanyList />} />
                    <Route path="/companies/:id" element={<CompanyDetail />} />

                    {/* Protected Routes - require wallet connection */}
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
                </Routes>
            </div>
        </Router>
    );
}

export default App;
