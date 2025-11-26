import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { companyAPI, reviewAPI, verificationAPI } from '../../services/api';

function ReviewForm() {
    const { companyId } = useParams();
    const navigate = useNavigate();
    const [company, setCompany] = useState(null);
    const [isVerified, setIsVerified] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submissionResult, setSubmissionResult] = useState(null);
    const [formData, setFormData] = useState({
        rating: 5,
        reviewText: '',
        employeeId: ''
    });
    const [showVerification, setShowVerification] = useState(false);

    useEffect(() => {
        checkVerificationAndFetchCompany();
    }, [companyId]);

    const checkVerificationAndFetchCompany = async () => {
        try {
            const [companyRes, verificationRes] = await Promise.all([
                companyAPI.getById(companyId),
                verificationAPI.check(companyId)
            ]);

            setCompany(companyRes.data.data);
            setIsVerified(verificationRes.data.data.isVerified);

            if (!verificationRes.data.data.isVerified) {
                setShowVerification(true);
            }
        } catch (error) {
            toast.error('Failed to load company information');
        } finally {
            setLoading(false);
        }
    };

    const handleVerification = async (e) => {
        e.preventDefault();

        if (!formData.employeeId) {
            toast.error('Employee ID is required');
            return;
        }

        try {
            await verificationAPI.submit({
                companyId,
                employeeId: formData.employeeId
            });

            toast.success('Employment verified successfully!');
            setIsVerified(true);
            setShowVerification(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Verification failed');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isVerified) {
            toast.error('Please verify your employment first');
            return;
        }

        setSubmitting(true);

        try {
            const response = await reviewAPI.submit({
                companyId,
                rating: formData.rating,
                reviewText: formData.reviewText,
                employeeId: formData.employeeId
            });

            toast.success('Review submitted successfully to blockchain!');
            setSubmissionResult(response.data.data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit review');
            setSubmitting(false);
        }
    };

    const renderStars = () => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <span
                    key={i}
                    className={`star ${i <= formData.rating ? 'filled' : ''}`}
                    onClick={() => setFormData({ ...formData, rating: i })}
                >
                    ★
                </span>
            );
        }
        return stars;
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
                    <Link to="/dashboard">Dashboard</Link>
                </div>
            </nav>

            <div className="container" style={{ maxWidth: '600px' }}>
                <div style={{ marginBottom: '1rem' }}>
                    <Link to={`/companies/${companyId}`}>← Back to {company.company_name}</Link>
                </div>

                <h1 style={{ marginBottom: '1.5rem' }}>
                    {submissionResult ? 'Review Submitted!' : 'Write a Review'}
                </h1>

                {submissionResult ? (
                    <div className="card">
                        <div style={{ padding: '1rem', background: '#dcfce7', borderRadius: '6px', marginBottom: '1.5rem' }}>
                            <p style={{ color: '#166534', margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>
                                ✓ Review successfully stored on blockchain!
                            </p>
                        </div>

                        <h2 style={{ marginBottom: '1rem' }}>🔗 Blockchain Transaction Details</h2>

                        <div style={{
                            background: '#f8fafc',
                            padding: '1rem',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontFamily: 'monospace',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{ display: 'grid', gap: '0.75rem', color: '#475569' }}>
                                <div style={{ wordBreak: 'break-all' }}>
                                    <strong style={{ fontFamily: 'sans-serif' }}>Review ID:</strong>
                                    <div style={{ marginTop: '0.25rem', color: '#64748b' }}>
                                        {submissionResult.reviewId}
                                    </div>
                                </div>

                                <div style={{ wordBreak: 'break-all' }}>
                                    <strong style={{ fontFamily: 'sans-serif' }}>Transaction Hash:</strong>
                                    <div style={{ marginTop: '0.25rem', color: '#2563eb' }}>
                                        {submissionResult.transactionHash}
                                    </div>
                                </div>

                                <div style={{ wordBreak: 'break-all' }}>
                                    <strong style={{ fontFamily: 'sans-serif' }}>Block Number:</strong>
                                    <div style={{ marginTop: '0.25rem', color: '#64748b' }}>
                                        {submissionResult.blockNumber}
                                    </div>
                                </div>

                                <div style={{ wordBreak: 'break-all' }}>
                                    <strong style={{ fontFamily: 'sans-serif' }}>Gas Used:</strong>
                                    <div style={{ marginTop: '0.25rem', color: '#64748b' }}>
                                        {submissionResult.gasUsed}
                                    </div>
                                </div>

                                <div style={{ wordBreak: 'break-all' }}>
                                    <strong style={{ fontFamily: 'sans-serif' }}>Review Hash:</strong>
                                    <div style={{ marginTop: '0.25rem', color: '#64748b' }}>
                                        {submissionResult.reviewHash}
                                    </div>
                                </div>

                                <div style={{ wordBreak: 'break-all' }}>
                                    <strong style={{ fontFamily: 'sans-serif' }}>Company Hash:</strong>
                                    <div style={{ marginTop: '0.25rem', color: '#64748b' }}>
                                        {companyId}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem' }}>
                            <p style={{ color: '#92400e', margin: 0, fontSize: '0.875rem' }}>
                                <strong>📋 How to verify manually:</strong><br/>
                                Use these hashes to query the blockchain directly using the smart contract's getReview() function with your Review ID.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Link
                                to={`/companies/${companyId}`}
                                className="btn btn-primary"
                            >
                                View Company Reviews
                            </Link>
                            <Link
                                to="/dashboard"
                                className="btn btn-secondary"
                            >
                                Go to Dashboard
                            </Link>
                        </div>
                    </div>
                ) : showVerification ? (
                    <div className="card">
                        <h2 style={{ marginBottom: '1rem' }}>Verify Employment</h2>
                        <p style={{ marginBottom: '1rem', color: '#64748b' }}>
                            You must verify your employment with {company.company_name} before submitting a review.
                        </p>

                        <form onSubmit={handleVerification}>
                            <div className="form-group">
                                <label>Employee ID</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter your employee ID"
                                    value={formData.employeeId}
                                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                    required
                                />
                                <small style={{ color: '#64748b' }}>
                                    Your employee ID will be hashed for privacy
                                </small>
                            </div>

                            <button type="submit" className="btn btn-primary">
                                Verify Employment
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="card">
                        <div style={{ padding: '0.5rem', background: '#dcfce7', borderRadius: '6px', marginBottom: '1rem' }}>
                            <p style={{ color: '#166534', margin: 0 }}>
                                ✓ Employment verified
                            </p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Rating</label>
                                <div className="rating-stars" style={{ fontSize: '2rem' }}>
                                    {renderStars()}
                                </div>
                                <small style={{ color: '#64748b' }}>
                                    Selected: {formData.rating} / 5 stars
                                </small>
                            </div>

                            <div className="form-group">
                                <label>Review (Optional)</label>
                                <textarea
                                    className="form-control"
                                    rows="6"
                                    placeholder="Share your experience working at this company..."
                                    value={formData.reviewText}
                                    onChange={(e) => setFormData({ ...formData, reviewText: e.target.value })}
                                ></textarea>
                                <small style={{ color: '#64748b' }}>
                                    Your review will be stored on the blockchain as a hash for immutability
                                </small>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ width: '100%' }}
                                disabled={submitting}
                            >
                                {submitting ? 'Submitting to Blockchain...' : 'Submit Review'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ReviewForm;
