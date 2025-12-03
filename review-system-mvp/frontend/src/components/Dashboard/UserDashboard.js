import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Shield, CheckCircle, XCircle, Loader, Building2, User, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import { reviewAPI } from '../../services/api';
import useWalletStore from '../../store/walletStore';
import Navbar from '../Navbar';
import Button from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

function UserDashboard() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState({});
    const [verificationResults, setVerificationResults] = useState({});
    const navigate = useNavigate();
    const { address } = useWalletStore();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                if (!address) {
                    setReviews([]);
                    setLoading(false);
                    return;
                }

                const reviewsRes = await reviewAPI.getUserReviews(address);
                setReviews(reviewsRes.data.data || []);
            } catch (error) {
                console.error('Failed to fetch reviews:', error);
                // Don't show error toast, just show empty state
                setReviews([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [address]);

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
                <Star
                    key={i}
                    className={`h-5 w-5 ${i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`}
                />
            );
        }
        return stars;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-white mb-8">My Dashboard</h1>

                <Card className="bg-slate-900 border-slate-800 mb-8">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-6">
                            <User className="h-5 w-5 text-blue-400" />
                            <h2 className="text-xl font-semibold text-white">Wallet Info</h2>
                        </div>
                        <div className="grid gap-4">
                            <div className="flex items-center gap-3">
                                <User className="h-4 w-4 text-slate-500" />
                                <span className="text-slate-400">Wallet Address:</span>
                                <span className="text-white font-mono">{address}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <FileText className="h-4 w-4 text-slate-500" />
                                <span className="text-slate-400">Total Reviews:</span>
                                <span className="text-white font-semibold">{reviews.length}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-white">My Reviews ({reviews.length})</h2>
                    <Button
                        onClick={() => navigate('/companies')}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        Write New Review
                    </Button>
                </div>

                {reviews.length === 0 ? (
                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="pt-6 text-center">
                            <FileText className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400 mb-6">
                                You haven't written any reviews yet.
                            </p>
                            <Button
                                onClick={() => navigate('/companies')}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <Building2 className="h-4 w-4 mr-2" />
                                Browse Companies
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {reviews.map((review) => (
                            <Card key={review.review_id} className="bg-slate-900 border-slate-800">
                                <CardContent className="pt-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-5 w-5 text-blue-400" />
                                            <h3 className="text-xl font-semibold text-white">{review.company_name}</h3>
                                        </div>
                                        <div className="flex gap-1">
                                            {renderStars(review.rating)}
                                        </div>
                                    </div>

                                    {review.review_text && (
                                        <p className="text-slate-400 mb-6">
                                            {review.review_text}
                                        </p>
                                    )}

                                    {/* Blockchain Details */}
                                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg mt-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Shield className="h-4 w-4 text-blue-400" />
                                            <div className="font-semibold text-white">Blockchain Data</div>
                                        </div>
                                        <div className="space-y-2 text-sm font-mono">
                                            <div className="break-all">
                                                <span className="text-slate-400">Review ID:</span>
                                                <div className="text-slate-500 mt-1">{review.review_id}</div>
                                            </div>
                                            {review.blockchain_tx_hash && (
                                                <div className="break-all">
                                                    <span className="text-slate-400">Transaction Hash:</span>
                                                    <div className="text-blue-400 mt-1">{review.blockchain_tx_hash}</div>
                                                </div>
                                            )}
                                            {review.block_number && (
                                                <div className="break-all">
                                                    <span className="text-slate-400">Block Number:</span>
                                                    <div className="text-slate-500 mt-1">{review.block_number}</div>
                                                </div>
                                            )}
                                            <div className="break-all">
                                                <span className="text-slate-400">Company Hash:</span>
                                                <div className="text-slate-500 mt-1">{review.company_id}</div>
                                            </div>
                                            {review.reviewer_hash && (
                                                <div className="break-all">
                                                    <span className="text-slate-400">Your Reviewer Hash:</span>
                                                    <div className="text-slate-500 mt-1">{review.reviewer_hash}</div>
                                                </div>
                                            )}
                                            {review.employment_proof_hash && (
                                                <div className="break-all">
                                                    <span className="text-slate-400">Employment Proof:</span>
                                                    <div className="text-slate-500 mt-1">{review.employment_proof_hash}</div>
                                                </div>
                                            )}
                                            <div className="break-all">
                                                <span className="text-slate-400">Submitted:</span>
                                                <div className="text-slate-500 mt-1">{formatDate(review.review_date)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Verification Results */}
                                    {verificationResults[review.review_id] && (
                                        <div className={`p-4 rounded-lg mt-6 border ${
                                            verificationResults[review.review_id].isValid 
                                                ? 'bg-green-950 border-green-800' 
                                                : 'bg-red-950 border-red-800'
                                        }`}>
                                            <div className="flex items-center gap-2 mb-4">
                                                {verificationResults[review.review_id].isValid ? (
                                                    <CheckCircle className="h-5 w-5 text-green-400" />
                                                ) : (
                                                    <XCircle className="h-5 w-5 text-red-400" />
                                                )}
                                                <div className={`font-semibold ${
                                                    verificationResults[review.review_id].isValid 
                                                        ? 'text-green-400' 
                                                        : 'text-red-400'
                                                }`}>
                                                    {verificationResults[review.review_id].isValid 
                                                        ? 'Blockchain Verification Passed' 
                                                        : 'Blockchain Verification Failed'
                                                    }
                                                </div>
                                            </div>
                                            <div className="text-sm font-mono space-y-3">
                                                <div className="break-all">
                                                    <strong className="text-slate-400">Database Hash:</strong>
                                                    <div className="text-slate-500 mt-1">
                                                        {verificationResults[review.review_id].database.reviewHash}
                                                    </div>
                                                </div>
                                                <div className="break-all">
                                                    <strong className="text-slate-400">Blockchain Hash:</strong>
                                                    <div className="text-slate-500 mt-1">
                                                        {verificationResults[review.review_id].blockchain.reviewHash}
                                                    </div>
                                                </div>
                                                <div>
                                                    <strong className="text-slate-400">Blockchain Rating:</strong>
                                                    <span className="text-slate-500 ml-2">
                                                        {verificationResults[review.review_id].blockchain.rating}/5
                                                    </span>
                                                </div>
                                                <div>
                                                    <strong className="text-slate-400">Blockchain Timestamp:</strong>
                                                    <div className="text-slate-500 mt-1">
                                                        {new Date(parseInt(verificationResults[review.review_id].blockchain.timestamp) * 1000).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-6 flex gap-3 flex-wrap">
                                        <Button
                                            onClick={() => handleVerifyReview(review.review_id)}
                                            disabled={verifying[review.review_id]}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            {verifying[review.review_id] ? (
                                                <>
                                                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                                                    Verifying...
                                                </>
                                            ) : (
                                                <>
                                                    <Shield className="h-4 w-4 mr-2" />
                                                    Verify on Blockchain
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            onClick={() => navigate(`/companies/${review.company_id}`)}
                                            variant="outline"
                                            className="border-slate-700 text-slate-300 hover:bg-slate-800"
                                        >
                                            <Building2 className="h-4 w-4 mr-2" />
                                            View Company
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default UserDashboard;
