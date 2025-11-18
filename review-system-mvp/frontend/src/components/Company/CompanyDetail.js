import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { companyAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';

function CompanyDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [company, setCompany] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    useEffect(() => {
        fetchCompanyDetails();
    }, [id]);

    const fetchCompanyDetails = async () => {
        try {
            const [companyRes, reviewsRes] = await Promise.all([
                companyAPI.getById(id),
                companyAPI.getReviews(id, { limit: 20 })
            ]);

            setCompany(companyRes.data.data);
            setReviews(reviewsRes.data.data.reviews);
        } catch (error) {
            toast.error('Failed to fetch company details');
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <span key={i} className={`star ${i <= rating ? 'filled' : ''}`}>
                    ★
                </span>
            );
        }
        return stars;
    };

    const formatDate = (timestamp) => {
        return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (!company) {
        return (
            <div className="container">
                <div className="card">
                    <p>Company not found.</p>
                    <Link to="/companies" className="btn btn-primary">Back to Companies</Link>
                </div>
            </div>
        );
    }

    return (
        <div>
            <nav className="navbar">
                <Link to="/" className="navbar-brand">Company Review System</Link>
                <div className="navbar-links">
                    <Link to="/companies">Companies</Link>
                    {isAuthenticated && <Link to="/dashboard">Dashboard</Link>}
                </div>
            </nav>

            <div className="container">
                <div style={{ marginBottom: '1rem' }}>
                    <Link to="/companies">← Back to Companies</Link>
                </div>

                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h1>{company.company_name}</h1>
                    <p style={{ color: '#64748b', marginBottom: '1rem' }}>
                        {company.industry} • {company.location}
                    </p>

                    {company.description && (
                        <p style={{ marginBottom: '1rem' }}>{company.description}</p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div className="rating-stars">
                            {renderStars(Math.round(company.average_rating || 0))}
                        </div>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                            {company.average_rating ? Number(company.average_rating).toFixed(1) : '0.0'}
                        </span>
                        <span style={{ color: '#64748b' }}>
                            ({company.total_reviews || 0} reviews)
                        </span>
                    </div>

                    {isAuthenticated ? (
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate(`/review/${company.company_id}`)}
                        >
                            Write a Review
                        </button>
                    ) : (
                        <p style={{ color: '#64748b' }}>
                            <Link to="/login">Login</Link> to write a review
                        </p>
                    )}
                </div>

                <h2 style={{ marginBottom: '1rem' }}>Reviews ({reviews.length})</h2>

                {reviews.length === 0 ? (
                    <div className="card">
                        <p>No reviews yet. Be the first to review this company!</p>
                    </div>
                ) : (
                    <div>
                        {reviews.map((review) => (
                            <div key={review.review_id} className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <div className="rating-stars" style={{ fontSize: '1.2rem' }}>
                                        {renderStars(review.rating)}
                                    </div>
                                    <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                                        {formatDate(review.timestamp)}
                                    </span>
                                </div>

                                {review.review_text && (
                                    <p style={{ color: '#475569', marginTop: '0.5rem' }}>
                                        {review.review_text}
                                    </p>
                                )}

                                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#94a3b8' }}>
                                    Review ID: {review.review_id}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default CompanyDetail;
