import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { companyAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';

function CompanyList() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const { isAuthenticated, clearAuth } = useAuthStore();

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const response = await companyAPI.getAll();
            setCompanies(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch companies');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await companyAPI.search({ q: searchQuery });
            setCompanies(response.data.data);
        } catch (error) {
            toast.error('Search failed');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        clearAuth();
        toast.success('Logged out successfully');
        navigate('/login');
    };

    const renderStars = (rating) => {
        const stars = [];
        const roundedRating = Math.round(rating);

        for (let i = 1; i <= 5; i++) {
            stars.push(
                <span key={i} className={`star ${i <= roundedRating ? 'filled' : ''}`}>
                    ★
                </span>
            );
        }

        return stars;
    };

    return (
        <div>
            <nav className="navbar">
                <Link to="/" className="navbar-brand">Company Review System</Link>
                <div className="navbar-links">
                    <Link to="/companies">Companies</Link>
                    {isAuthenticated ? (
                        <>
                            <Link to="/dashboard">Dashboard</Link>
                            <button className="btn btn-secondary" onClick={handleLogout}>Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login">Login</Link>
                            <Link to="/register">Register</Link>
                        </>
                    )}
                </div>
            </nav>

            <div className="container">
                <h1 style={{ marginBottom: '1.5rem' }}>Browse Companies</h1>

                <form onSubmit={handleSearch} style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search companies..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary">Search</button>
                    </div>
                </form>

                {loading ? (
                    <div className="loading">Loading companies...</div>
                ) : companies.length === 0 ? (
                    <div className="card">
                        <p>No companies found.</p>
                    </div>
                ) : (
                    <div className="grid grid-2">
                        {companies.map((company) => (
                            <div key={company.company_id} className="card">
                                <h3 style={{ marginBottom: '0.5rem' }}>{company.company_name}</h3>
                                <p style={{ color: '#64748b', marginBottom: '1rem' }}>
                                    {company.industry} • {company.location}
                                </p>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <div className="rating-stars" style={{ fontSize: '1.2rem' }}>
                                        {renderStars(company.average_rating || 0)}
                                    </div>
                                    <span style={{ color: '#64748b' }}>
                                        {company.average_rating ? Number(company.average_rating).toFixed(1) : '0.0'}
                                    </span>
                                    <span style={{ color: '#94a3b8' }}>
                                        ({company.total_reviews || 0} reviews)
                                    </span>
                                </div>

                                <Link to={`/companies/${company.company_id}`} className="btn btn-primary">
                                    View Details
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default CompanyList;
