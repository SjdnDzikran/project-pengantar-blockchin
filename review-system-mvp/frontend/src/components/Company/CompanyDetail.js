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

                    {/* Blockchain Data Section */}
                    <div style={{
                        background: '#f8fafc',
                        padding: '1rem',
                        borderRadius: '6px',
                        marginBottom: '1.5rem',
                        fontSize: '0.875rem'
                    }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#1e293b' }}>
                            🔗 Blockchain Data
                        </div>
                        <div style={{ fontFamily: 'monospace', color: '#475569', wordBreak: 'break-all' }}>
                            <div style={{ marginBottom: '0.25rem' }}>
                                <strong>Company Hash:</strong> {company.company_id}
                            </div>
                        </div>
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
                                    <p style={{ color: '#475569', marginTop: '0.5rem', marginBottom: '1rem' }}>
                                        {review.review_text}
                                    </p>
                                )}

                                {/* Blockchain Details */}
                                <div style={{
                                    background: '#f8fafc',
                                    padding: '0.75rem',
                                    borderRadius: '4px',
                                    marginTop: '1rem',
                                    fontSize: '0.8rem',
                                    fontFamily: 'monospace'
                                }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontFamily: 'sans-serif', color: '#1e293b' }}>
                                        🔗 Blockchain Data
                                    </div>
                                    <div style={{ color: '#64748b', display: 'grid', gap: '0.25rem' }}>
                                        <div style={{ wordBreak: 'break-all' }}>
                                            <strong>Review ID:</strong> {review.review_id}
                                        </div>
                                        <div style={{ wordBreak: 'break-all' }}>
                                            <strong>Company Hash:</strong> {review.company_id}
                                        </div>
                                        <div style={{ wordBreak: 'break-all' }}>
                                            <strong>Reviewer Hash:</strong> {review.reviewer_hash}
                                        </div>
                                        {review.employment_proof_hash && (
                                            <div style={{ wordBreak: 'break-all' }}>
                                                <strong>Employment Proof:</strong> {review.employment_proof_hash}
                                            </div>
                                        )}
                                        <div style={{ wordBreak: 'break-all' }}>
                                            <strong>Timestamp:</strong> {review.timestamp} ({formatDate(review.timestamp)})
                                        </div>
                                    </div>
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
