import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { reviewAPI, authAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';

function UserDashboard() {
    const [profile, setProfile] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState({});
    const [verificationResults, setVerificationResults] = useState({});
    const navigate = useNavigate();
    const { clearAuth, user } = useAuthStore();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [profileRes, reviewsRes] = await Promise.all([
                authAPI.getProfile(),
                reviewAPI.getUserReviews()
            ]);

            setProfile(profileRes.data.data);
            setReviews(reviewsRes.data.data);
        } catch (error) {
            toast.error('Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        clearAuth();
        toast.success('Logged out successfully');
        navigate('/login');
    };

    const handleVerifyReview = async (reviewId) => {
        setVerifying({ ...verifying, [reviewId]: true });

        try {
            const response = await reviewAPI.verify(reviewId);
            const result = response.data.data;

            setVerificationResults({ ...verificationResults, [reviewId]: result });

            if (result.isValid) {
                toast.success('✓ Review verified on blockchain!');
            } else {
                toast.error('✗ Review hash mismatch!');
            }
        } catch (error) {
            toast.error('Failed to verify review: ' + (error.response?.data?.message || error.message));
        } finally {
            setVerifying({ ...verifying, [reviewId]: false });
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

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    if (loading) {
        return <div className="loading">Loading dashboard...</div>;
    }

    return (
        <div>
            <nav className="navbar">
                <Link to="/" className="navbar-brand">Company Review System</Link>
                <div className="navbar-links">
                    <Link to="/companies">Companies</Link>
                    <Link to="/dashboard">Dashboard</Link>
                    <button className="btn btn-secondary" onClick={handleLogout}>Logout</button>
                </div>
            </nav>

            <div className="container">
                <h1 style={{ marginBottom: '1.5rem' }}>My Dashboard</h1>

                {profile && (
                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <h2 style={{ marginBottom: '1rem' }}>Profile</h2>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            <div>
                                <strong>Name:</strong> {profile.fullName || 'Not set'}
                            </div>
                            <div>
                                <strong>Email:</strong> {profile.email}
                            </div>
                            <div>
                                <strong>Member Since:</strong> {formatDate(profile.createdAt)}
                            </div>
                            <div>
                                <strong>Total Reviews:</strong> {profile.reviewCount}
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2>My Reviews ({reviews.length})</h2>
                    <Link to="/companies" className="btn btn-primary">
                        Write New Review
                    </Link>
                </div>

                {reviews.length === 0 ? (
                    <div className="card">
                        <p style={{ textAlign: 'center', color: '#64748b' }}>
                            You haven't written any reviews yet.
                        </p>
                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                            <Link to="/companies" className="btn btn-primary">
                                Browse Companies
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div>
                        {reviews.map((review) => (
                            <div key={review.review_id} className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <h3>{review.company_name}</h3>
                                    <div className="rating-stars" style={{ fontSize: '1.2rem' }}>
                                        {renderStars(review.rating)}
                                    </div>
                                </div>

                                {review.review_text && (
                                    <p style={{ color: '#475569', marginBottom: '1rem' }}>
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
                                        {review.blockchain_tx_hash && (
                                            <div style={{ wordBreak: 'break-all' }}>
                                                <strong>Transaction Hash:</strong> {review.blockchain_tx_hash}
                                            </div>
                                        )}
                                        {review.block_number && (
                                            <div style={{ wordBreak: 'break-all' }}>
                                                <strong>Block Number:</strong> {review.block_number}
                                            </div>
                                        )}
                                        <div style={{ wordBreak: 'break-all' }}>
                                            <strong>Company Hash:</strong> {review.company_id}
                                        </div>
                                        {review.reviewer_hash && (
                                            <div style={{ wordBreak: 'break-all' }}>
                                                <strong>Your Reviewer Hash:</strong> {review.reviewer_hash}
                                            </div>
                                        )}
                                        {review.employment_proof_hash && (
                                            <div style={{ wordBreak: 'break-all' }}>
                                                <strong>Employment Proof:</strong> {review.employment_proof_hash}
                                            </div>
                                        )}
                                        <div style={{ wordBreak: 'break-all' }}>
                                            <strong>Submitted:</strong> {formatDate(review.review_date)}
                                        </div>
                                    </div>
                                </div>

                                {/* Verification Results */}
                                {verificationResults[review.review_id] && (
                                    <div style={{
                                        background: verificationResults[review.review_id].isValid ? '#dcfce7' : '#fee2e2',
                                        padding: '0.75rem',
                                        borderRadius: '4px',
                                        marginTop: '1rem',
                                        fontSize: '0.875rem'
                                    }}>
                                        <div style={{
                                            fontWeight: 'bold',
                                            marginBottom: '0.5rem',
                                            color: verificationResults[review.review_id].isValid ? '#166534' : '#991b1b'
                                        }}>
                                            {verificationResults[review.review_id].isValid ? '✓ Blockchain Verification Passed' : '✗ Blockchain Verification Failed'}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace' }}>
                                            <div><strong>Database Hash:</strong></div>
                                            <div style={{ wordBreak: 'break-all', marginBottom: '0.5rem' }}>
                                                {verificationResults[review.review_id].database.reviewHash}
                                            </div>
                                            <div><strong>Blockchain Hash:</strong></div>
                                            <div style={{ wordBreak: 'break-all' }}>
                                                {verificationResults[review.review_id].blockchain.reviewHash}
                                            </div>
                                            <div style={{ marginTop: '0.5rem' }}>
                                                <strong>Blockchain Rating:</strong> {verificationResults[review.review_id].blockchain.rating}/5
                                            </div>
                                            <div>
                                                <strong>Blockchain Timestamp:</strong> {new Date(parseInt(verificationResults[review.review_id].blockchain.timestamp) * 1000).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleVerifyReview(review.review_id)}
                                        disabled={verifying[review.review_id]}
                                        style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                                    >
                                        {verifying[review.review_id] ? 'Verifying...' : '🔍 Verify on Blockchain'}
                                    </button>
                                    <Link
                                        to={`/companies/${review.company_id}`}
                                        className="btn btn-secondary"
                                        style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                                    >
                                        View Company
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default UserDashboard;
