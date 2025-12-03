import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Star, MapPin, Building2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { companyAPI } from '../../services/api';
import Navbar from '../Navbar';
import Button from '../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';

function CompanyList() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
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

    const handleLogout = () => {
        // Removed - handled by Navbar
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
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-slate-100 mb-2">Browse Companies</h1>
                    <p className="text-slate-400">Explore verified company reviews from real employees</p>
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
        </div>
    );
}

export default CompanyList;
