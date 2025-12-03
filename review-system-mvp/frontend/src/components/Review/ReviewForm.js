import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ArrowLeft, CheckCircle, Shield, Hash, Loader, Building2, AlertTriangle, Wallet } from 'lucide-react';
import { toast } from 'react-toastify';
import { companyAPI, reviewAPI, verificationAPI } from '../../services/api';
import { submitReviewToBlockchain } from '../../services/blockchain';
import useWalletStore from '../../store/walletStore';
import useAuthStore from '../../store/authStore';
import Navbar from '../Navbar';
import Button from '../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';

function ReviewForm() {
    const { companyId } = useParams();
    const navigate = useNavigate();
    const { isConnected, address, connectWallet, authenticateWallet } = useWalletStore();
    const { isAuthenticated } = useAuthStore();
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [companyId, isAuthenticated]);

    const checkVerificationAndFetchCompany = async () => {
        try {
            // Always fetch company info first (doesn't require auth)
            const companyRes = await companyAPI.getById(companyId);
            setCompany(companyRes.data.data);

            // Only check verification if user is authenticated
            if (isAuthenticated) {
                try {
                    const verificationRes = await verificationAPI.check(companyId);
                    setIsVerified(verificationRes.data.data.isVerified);

                    if (!verificationRes.data.data.isVerified) {
                        setShowVerification(true);
                    }
                } catch (verificationError) {
                    // If verification check fails, assume not verified
                    console.warn('Verification check failed:', verificationError);
                    setIsVerified(false);
                    setShowVerification(true);
                }
            } else {
                // Not authenticated, show verification form
                setIsVerified(false);
                setShowVerification(true);
            }
        } catch (error) {
            console.error('Error fetching company:', error);
            toast.error('Failed to load company information');
        } finally {
            setLoading(false);
        }
    };

    const handleVerification = async (e) => {
        e.preventDefault();

        if (!isConnected) {
            toast.error('Please connect your wallet first');
            return;
        }

        // Auto-authenticate if connected but not authenticated
        if (!isAuthenticated) {
            try {
                toast.info('Please sign the message to authenticate...');
                await authenticateWallet();
                toast.success('Authentication successful!');
            } catch (error) {
                toast.error(error.message || 'Authentication failed');
                return;
            }
        }

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

        if (!isConnected) {
            toast.error('Please connect your wallet first');
            return;
        }

        // Auto-authenticate if connected but not authenticated
        if (!isAuthenticated) {
            try {
                toast.info('Please sign the message to authenticate...');
                await authenticateWallet();
                toast.success('Authentication successful!');
            } catch (error) {
                toast.error(error.message || 'Authentication failed');
                return;
            }
        }

        if (!isVerified) {
            toast.error('Please verify your employment first');
            return;
        }

        setSubmitting(true);

        try {
            // Step 1: Prepare review data (get hashes from backend)
            toast.info('Preparing review data...');
            const prepareResponse = await reviewAPI.prepare({
                companyId,
                rating: formData.rating,
                reviewText: formData.reviewText,
                employeeId: formData.employeeId
            });

            const reviewData = prepareResponse.data.data;
            console.log('Review data prepared:', reviewData);

            // Step 2: Submit to blockchain with user's wallet
            toast.info('Please confirm the transaction in your wallet...');
            const blockchainResult = await submitReviewToBlockchain(reviewData);
            
            console.log('Blockchain transaction confirmed:', blockchainResult);
            toast.success('Review submitted to blockchain!');

            // Step 3: Store metadata in backend database
            toast.info('Saving review data...');
            const response = await reviewAPI.submit({
                companyId,
                rating: formData.rating,
                reviewText: formData.reviewText,
                employeeId: formData.employeeId,
                blockchainData: {
                    reviewId: reviewData.reviewId,
                    transactionHash: blockchainResult.transactionHash,
                    blockNumber: blockchainResult.blockNumber,
                    gasUsed: blockchainResult.gasUsed,
                    reviewHash: reviewData.reviewHash
                }
            });

            toast.success('Review saved successfully!');
            setSubmissionResult(response.data.data);
        } catch (error) {
            console.error('Submit error:', error);
            toast.error(error.message || 'Failed to submit review');
            setSubmitting(false);
        }
    };

    const renderStars = () => {
        return (
            <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: star })}
                        className="focus:outline-none transition-transform hover:scale-110"
                    >
                        <Star
                            className={`h-12 w-12 cursor-pointer transition-colors ${
                                star <= formData.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-slate-600 hover:text-slate-500'
                            }`}
                        />
                    </button>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950">
                <Navbar />
                <div className="container mx-auto px-4 py-20 text-center">
                    <Loader className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                    <p className="mt-4 text-slate-400">Loading...</p>
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

            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <button 
                    onClick={() => navigate(`/companies/${companyId}`)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to {company.company_name}
                </button>

                <h1 className="text-3xl font-bold text-white mb-8">
                    {submissionResult ? 'Review Submitted!' : 'Write a Review'}
                </h1>

                {submissionResult ? (
                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-3 p-4 bg-green-950 border border-green-800 rounded-lg mb-6">
                                <CheckCircle className="h-6 w-6 text-green-400 mt-0.5 shrink-0" />
                                <p className="text-green-400 text-lg font-semibold">
                                    Review successfully stored on blockchain!
                                </p>
                            </div>

                            <div className="flex items-center gap-2 mb-4">
                                <Shield className="h-5 w-5 text-blue-400" />
                                <h2 className="text-xl font-semibold text-white">Blockchain Transaction Details</h2>
                            </div>

                            <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg font-mono text-sm space-y-4">
                                <div className="break-all">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Hash className="h-4 w-4 text-slate-500" />
                                        <strong className="text-slate-400 font-sans">Review ID:</strong>
                                    </div>
                                    <div className="text-slate-500 pl-6">
                                        {submissionResult.reviewId}
                                    </div>
                                </div>

                                <div className="break-all">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Hash className="h-4 w-4 text-slate-500" />
                                        <strong className="text-slate-400 font-sans">Transaction Hash:</strong>
                                    </div>
                                    <div className="text-blue-400 pl-6">
                                        {submissionResult.transactionHash}
                                    </div>
                                </div>

                                <div className="break-all">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Hash className="h-4 w-4 text-slate-500" />
                                        <strong className="text-slate-400 font-sans">Block Number:</strong>
                                    </div>
                                    <div className="text-slate-500 pl-6">
                                        {submissionResult.blockNumber}
                                    </div>
                                </div>

                                <div className="break-all">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Hash className="h-4 w-4 text-slate-500" />
                                        <strong className="text-slate-400 font-sans">Gas Used:</strong>
                                    </div>
                                    <div className="text-slate-500 pl-6">
                                        {submissionResult.gasUsed}
                                    </div>
                                </div>

                                <div className="break-all">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Hash className="h-4 w-4 text-slate-500" />
                                        <strong className="text-slate-400 font-sans">Review Hash:</strong>
                                    </div>
                                    <div className="text-slate-500 pl-6">
                                        {submissionResult.reviewHash}
                                    </div>
                                </div>

                                <div className="break-all">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Hash className="h-4 w-4 text-slate-500" />
                                        <strong className="text-slate-400 font-sans">Company Hash:</strong>
                                    </div>
                                    <div className="text-slate-500 pl-6">
                                        {companyId}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-4 bg-yellow-950 border border-yellow-800 rounded-lg mt-6 mb-6">
                                <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 shrink-0" />
                                <div className="text-yellow-200 text-sm">
                                    <strong className="block mb-1">How to verify manually:</strong>
                                    Use these hashes to query the blockchain directly using the smart contract's getReview() function with your Review ID.
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => navigate(`/companies/${companyId}`)}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                >
                                    View Company Reviews
                                </Button>
                                <Button
                                    onClick={() => navigate('/dashboard')}
                                    variant="outline"
                                    className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                                >
                                    Go to Dashboard
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : showVerification ? (
                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Shield className="h-5 w-5 text-blue-400" />
                                <h2 className="text-xl font-semibold text-white">Verify Employment</h2>
                            </div>
                            <p className="text-slate-400 mb-6">
                                You must verify your employment with {company.company_name} before submitting a review.
                            </p>

                            {!isConnected ? (
                                <div className="bg-yellow-950 border border-yellow-800 rounded-lg p-4 mb-6">
                                    <div className="flex items-start gap-3">
                                        <Wallet className="h-5 w-5 text-yellow-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-yellow-200 font-semibold mb-2">Wallet Connection Required</p>
                                            <p className="text-yellow-200 text-sm mb-4">
                                                You need to connect your wallet to verify employment and submit reviews.
                                            </p>
                                            <Button
                                                onClick={async () => {
                                                    try {
                                                        await connectWallet();
                                                        toast.success('Wallet connected!');
                                                    } catch (error) {
                                                        toast.error(error.message || 'Failed to connect wallet');
                                                    }
                                                }}
                                                className="bg-yellow-600 hover:bg-yellow-700"
                                            >
                                                <Wallet className="h-4 w-4 mr-2" />
                                                Connect Wallet
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            <form onSubmit={handleVerification} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Employee ID
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter your employee ID"
                                        value={formData.employeeId}
                                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                        required
                                    />
                                    <small className="text-slate-500 text-xs mt-1 block">
                                        Your employee ID will be hashed for privacy
                                    </small>
                                </div>

                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={!isConnected}>
                                    <Shield className="h-4 w-4 mr-2" />
                                    Verify Employment
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="pt-6">
                            {!isConnected ? (
                                <div className="bg-yellow-950 border border-yellow-800 rounded-lg p-4 mb-6">
                                    <div className="flex items-start gap-3">
                                        <Wallet className="h-5 w-5 text-yellow-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-yellow-200 font-semibold mb-2">Wallet Connection Required</p>
                                            <p className="text-yellow-200 text-sm mb-4">
                                                You need to connect your wallet to submit reviews to the blockchain.
                                            </p>
                                            <Button
                                                onClick={async () => {
                                                    try {
                                                        await connectWallet();
                                                        toast.success('Wallet connected!');
                                                    } catch (error) {
                                                        toast.error(error.message || 'Failed to connect wallet');
                                                    }
                                                }}
                                                className="bg-yellow-600 hover:bg-yellow-700"
                                            >
                                                <Wallet className="h-4 w-4 mr-2" />
                                                Connect Wallet
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            <div className="flex items-center gap-3 p-3 bg-green-950 border border-green-800 rounded-lg mb-6">
                                <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
                                <p className="text-green-400 font-medium">
                                    Employment verified
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-3">
                                        Rating
                                    </label>
                                    <div className="flex gap-2 mb-2">
                                        {renderStars()}
                                    </div>
                                    <small className="text-slate-500 text-sm">
                                        Selected: {formData.rating} / 5 stars
                                    </small>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Review (Optional)
                                    </label>
                                    <textarea
                                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        rows="6"
                                        placeholder="Share your experience working at this company..."
                                        value={formData.reviewText}
                                        onChange={(e) => setFormData({ ...formData, reviewText: e.target.value })}
                                    ></textarea>
                                    <small className="text-slate-500 text-xs mt-1 block">
                                        Your review will be stored on the blockchain as a hash for immutability
                                    </small>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                    disabled={submitting || !isConnected}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader className="h-4 w-4 mr-2 animate-spin" />
                                            Submitting to Blockchain...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Submit Review
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

export default ReviewForm;
