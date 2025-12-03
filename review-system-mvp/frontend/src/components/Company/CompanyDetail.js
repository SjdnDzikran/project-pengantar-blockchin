import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Building2, MapPin, Star, ArrowLeft, Shield, Clock, CheckCircle, XCircle, Wallet } from 'lucide-react';
import { toast } from 'react-toastify';
import { companyAPI, reviewAPI } from '../../services/api';
import useWalletStore from '../../store/walletStore';
import Navbar from '../Navbar';
import Button from '../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';

function CompanyDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [company, setCompany] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState({});
    const [verificationResults, setVerificationResults] = useState({});
    const { isConnected, connectWallet, isConnecting } = useWalletStore();

    useEffect(() => {
        fetchCompanyDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const handleConnect = async () => {
        try {
            const address = await connectWallet();
            toast.success(`Connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
        } catch (error) {
            toast.error(error.message || 'Failed to connect wallet');
        }
    };

    const renderStars = (rating) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-5 w-5 ${
                            star <= rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-slate-600'
                        }`}
                    />
                ))}
            </div>
        );
    };

    const formatDate = (timestamp) => {
        return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950">
                <Navbar />
                <div className="container mx-auto px-4 py-20 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
                    <p className="mt-4 text-slate-400">Loading company details...</p>
                </div>
            </div>
        );
    }

    if (!company) {
        return (
            <div className="min-h-screen bg-slate-950">
                <Navbar />
                <div className="container mx-auto px-4 py-20">
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Building2 className="h-12 w-12 mx-auto text-slate-600 mb-4" />
                            <p className="text-slate-400 mb-4">Company not found.</p>
                            <Button onClick={() => navigate('/companies')}>
                                Back to Companies
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                <Link 
                    to="/companies" 
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors mb-6"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Companies
                </Link>

                {/* Company Header Card */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="text-3xl flex items-center gap-3">
                            <Building2 className="h-8 w-8 text-blue-500" />
                            {company.company_name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-3 text-lg">
                            <span>{company.industry}</span>
                            {company.location && (
                                <>
                                    <span>•</span>
                                    <MapPin className="h-4 w-4" />
                                    <span>{company.location}</span>
                                </>
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {company.description && (
                            <p className="text-slate-300 mb-6">{company.description}</p>
                        )}

                        {/* Rating Display */}
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-800">
                            {renderStars(Math.round(company.average_rating || 0))}
                            <span className="text-3xl font-bold text-slate-100">
                                {company.average_rating ? Number(company.average_rating).toFixed(1) : '0.0'}
                            </span>
                            <span className="text-slate-400">
                                ({company.total_reviews || 0} reviews)
                            </span>
                        </div>

                        {/* Blockchain Data Section */}
                        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6">
                            <div className="flex items-center gap-2 font-semibold text-slate-100 mb-3">
                                <Shield className="h-5 w-5 text-blue-500" />
                                Blockchain Data
                            </div>
                            <div className="font-mono text-sm text-slate-400 break-all">
                                <div className="flex gap-2">
                                    <span className="text-slate-500">Company Hash:</span>
                                    <span>{company.company_id}</span>
                                </div>
                            </div>
                        </div>

                        {isConnected ? (
                            <Button
                                size="lg"
                                onClick={() => navigate(`/review/${company.company_id}`)}
                            >
                                Write a Review
                            </Button>
                        ) : (
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={handleConnect}
                                disabled={isConnecting}
                                className="flex items-center gap-2"
                            >
                                <Wallet className="h-5 w-5" />
                                {isConnecting ? 'Connecting...' : 'Connect Wallet to Review'}
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Reviews Section */}
                <h2 className="text-2xl font-bold text-slate-100 mb-4">
                    Reviews ({reviews.length})
                </h2>

                {reviews.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Star className="h-12 w-12 mx-auto text-slate-600 mb-4" />
                            <p className="text-slate-400">No reviews yet. Be the first to review this company!</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reviews.map((review) => (
                            <Card key={review.review_id}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        {renderStars(review.rating)}
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500 text-sm mt-2">
                                        <Clock className="h-4 w-4" />
                                        {formatDate(review.timestamp)}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {review.review_text && (
                                        <p className="text-slate-300 mb-4">{review.review_text}</p>
                                    )}

                                    {/* Verification Results */}
                                    {verificationResults[review.review_id] && (
                                        <div className={`rounded-lg p-3 mb-4 text-sm ${
                                            verificationResults[review.review_id].isValid
                                                ? 'bg-green-950 border border-green-800'
                                                : 'bg-red-950 border border-red-800'
                                        }`}>
                                            <div className={`flex items-center gap-2 font-semibold mb-2 ${
                                                verificationResults[review.review_id].isValid
                                                    ? 'text-green-400'
                                                    : 'text-red-400'
                                            }`}>
                                                {verificationResults[review.review_id].isValid ? (
                                                    <CheckCircle className="h-4 w-4" />
                                                ) : (
                                                    <XCircle className="h-4 w-4" />
                                                )}
                                                {verificationResults[review.review_id].isValid
                                                    ? 'Verified'
                                                    : 'Failed'}
                                            </div>
                                            <div className="font-mono text-xs text-slate-400 space-y-1">
                                                <div className="break-all">
                                                    <span className="text-slate-500">Hash:</span>{' '}
                                                    {verificationResults[review.review_id].blockchain.reviewHash}
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Rating:</span>{' '}
                                                    {verificationResults[review.review_id].blockchain.rating}/5
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Verify Button */}
                                    <Button
                                        variant="outline"
                                        onClick={() => handleVerifyReview(review.review_id)}
                                        disabled={verifying[review.review_id]}
                                        className="w-full"
                                    >
                                        <Shield className="h-4 w-4 mr-2" />
                                        {verifying[review.review_id] ? 'Verifying...' : 'Verify on Blockchain'}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default CompanyDetail;
