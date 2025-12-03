import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, MapPin, Building2, Plus, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { companyAPI } from '../../services/api';
import Navbar from '../Navbar';
import Button from '../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';

function CompanyList() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewCompanyModal, setShowNewCompanyModal] = useState(false);
    const [newCompanyData, setNewCompanyData] = useState({
        companyName: '',
        industry: '',
        location: '',
        website: '',
        description: ''
    });
    const [creating, setCreating] = useState(false);
    const navigate = useNavigate();

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

    const handleCreateCompany = async (e) => {
        e.preventDefault();
        setCreating(true);

        try {
            const response = await companyAPI.create(newCompanyData);
            const createdCompany = response.data.data;
            
            toast.success('Company created successfully!');
            setShowNewCompanyModal(false);
            
            // Refresh companies list
            await fetchCompanies();
            
            // Redirect to review page for the new company
            navigate(`/companies/${createdCompany.company_id}/review`);
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to create company';
            toast.error(errorMessage);
        } finally {
            setCreating(false);
        }
    };

    const resetNewCompanyForm = () => {
        setNewCompanyData({
            companyName: '',
            industry: '',
            location: '',
            website: '',
            description: ''
        });
    };

    const renderStars = (rating) => {
        const numRating = parseFloat(rating) || 0;
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-4 w-4 ${
                            star <= Math.round(numRating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-slate-600'
                        }`}
                    />
                ))}
                <span className="ml-2 text-sm text-slate-400">
                    {numRating > 0 ? numRating.toFixed(1) : 'No ratings'}
                </span>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-950">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-100 mb-2">Browse Companies</h1>
                        <p className="text-slate-400">Explore verified company reviews from real employees</p>
                    </div>
                    <Button
                        onClick={() => setShowNewCompanyModal(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Review New Company
                    </Button>
                </div>

                {/* Search Bar */}
                <Card className="mb-8">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSearch} className="flex gap-3">
                            <div className="relative flex-grow">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-md text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Search companies by name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button type="submit" size="lg">
                                Search
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
                        <p className="mt-4 text-slate-400">Loading companies...</p>
                    </div>
                ) : companies.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Building2 className="h-12 w-12 mx-auto text-slate-600 mb-4" />
                            <p className="text-slate-400">No companies found.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {companies.map((company) => (
                            <Card
                                key={company.company_id}
                                className="hover:border-blue-500 transition-all cursor-pointer"
                                onClick={() => navigate(`/companies/${company.company_id}`)}
                            >
                                <CardHeader>
                                    <CardTitle className="text-xl">{company.company_name}</CardTitle>
                                    <CardDescription className="flex items-center gap-2 text-slate-400">
                                        <Building2 className="h-4 w-4" />
                                        {company.industry}
                                        {company.location && (
                                            <>
                                                <span>•</span>
                                                <MapPin className="h-4 w-4" />
                                                {company.location}
                                            </>
                                        )}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between mb-4">
                                        {renderStars(company.average_rating || 0)}
                                        <span className="text-sm text-slate-500">
                                            {company.total_reviews || 0} reviews
                                        </span>
                                    </div>
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/companies/${company.company_id}`);
                                        }}
                                        className="w-full"
                                    >
                                        View Details
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* New Company Modal */}
            {showNewCompanyModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <Card className="bg-slate-900 border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-2xl text-white">Add New Company</CardTitle>
                                    <CardDescription className="text-slate-400 mt-2">
                                        Can't find your company? Add it here and write your review.
                                    </CardDescription>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowNewCompanyModal(false);
                                        resetNewCompanyForm();
                                    }}
                                    className="text-slate-400 hover:text-white"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateCompany} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Company Name <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="PT Example Corporation"
                                        value={newCompanyData.companyName}
                                        onChange={(e) => setNewCompanyData({ ...newCompanyData, companyName: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Industry
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., Technology, Finance"
                                            value={newCompanyData.industry}
                                            onChange={(e) => setNewCompanyData({ ...newCompanyData, industry: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Location
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., Jakarta, Surabaya"
                                            value={newCompanyData.location}
                                            onChange={(e) => setNewCompanyData({ ...newCompanyData, location: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Website
                                    </label>
                                    <input
                                        type="url"
                                        className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="https://example.com"
                                        value={newCompanyData.website}
                                        onChange={(e) => setNewCompanyData({ ...newCompanyData, website: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        rows="4"
                                        placeholder="Brief description of the company..."
                                        value={newCompanyData.description}
                                        onChange={(e) => setNewCompanyData({ ...newCompanyData, description: e.target.value })}
                                    ></textarea>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="submit"
                                        disabled={creating || !newCompanyData.companyName}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    >
                                        {creating ? (
                                            <>Creating & Redirecting...</>
                                        ) : (
                                            <>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Company & Write Review
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            setShowNewCompanyModal(false);
                                            resetNewCompanyForm();
                                        }}
                                        variant="outline"
                                        className="border-slate-700 text-slate-300 hover:bg-slate-800"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

export default CompanyList;
