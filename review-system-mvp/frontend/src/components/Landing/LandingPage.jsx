import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Shield, Database, Lock, ChevronRight, Boxes } from 'lucide-react';
import Button from '../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import useWalletStore from '../../store/walletStore';
import { toast } from 'react-toastify';

export default function LandingPage() {
  const navigate = useNavigate();
  const { connectWallet, isConnected, isConnecting } = useWalletStore();

  const handleConnect = async () => {
    try {
      const address = await connectWallet();
      toast.success(`Connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
      navigate('/companies');
    } catch (error) {
      toast.error(error.message || 'Failed to connect wallet');
    }
  };

  React.useEffect(() => {
    // If already connected, redirect (no need to check authentication)
    if (isConnected) {
      navigate('/companies');
    }
  }, [isConnected, navigate]);

  const features = [
    {
      icon: Shield,
      title: 'Immutable Reviews',
      description: 'Once submitted, reviews are permanently stored on the blockchain and cannot be altered or deleted.',
    },
    {
      icon: Lock,
      title: 'Privacy First',
      description: 'Your personal data is hashed before storage. Only cryptographic proofs exist on-chain.',
    },
    {
      icon: Database,
      title: 'Verified Employment',
      description: 'Submit reviews only for companies where you\'ve verified your employment.',
    },
    {
      icon: Boxes,
      title: 'Decentralized Storage',
      description: 'Review data is distributed across the blockchain network, ensuring transparency and reliability.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Boxes className="h-8 w-8 text-blue-500" />
            <span className="text-xl font-bold">CompanyReview</span>
          </div>
          <Button onClick={handleConnect} disabled={isConnecting}>
            <Wallet className="mr-2 h-4 w-4" />
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
            Blockchain-Powered Company Reviews
          </h1>
          <p className="text-xl text-slate-400 mb-8">
            Submit and verify authentic employee reviews with the transparency and immutability of blockchain technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full sm:w-auto"
            >
              <Wallet className="mr-2 h-5 w-5" />
              {isConnecting ? 'Connecting...' : 'Get Started'}
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/companies')}
              className="w-full sm:w-auto"
            >
              Browse Companies
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Blockchain Reviews?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover:border-blue-500 transition-colors">
              <CardHeader>
                <feature.icon className="h-10 w-10 text-blue-500 mb-4" />
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-400">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="max-w-3xl mx-auto space-y-8">
          {[
            {
              step: '01',
              title: 'Connect Your Wallet',
              description: 'Use MetaMask or any Web3 wallet to authenticate securely.',
            },
            {
              step: '02',
              title: 'Verify Employment',
              description: 'Provide your employee ID to verify your connection to a company.',
            },
            {
              step: '03',
              title: 'Submit Review',
              description: 'Rate and review your experience. Your review is hashed and stored on-chain.',
            },
            {
              step: '04',
              title: 'Immutable Record',
              description: 'Your review becomes part of the permanent blockchain ledger.',
            },
          ].map((item, index) => (
            <div key={index} className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-blue-500/10 border-2 border-blue-500 flex items-center justify-center">
                  <span className="text-xl font-bold text-blue-500">{item.step}</span>
                </div>
              </div>
              <div className="flex-grow pt-2">
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-slate-400">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardContent className="text-center py-12">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
              Connect your wallet and join the future of transparent, blockchain-verified company reviews.
            </p>
            <Button
              size="lg"
              onClick={handleConnect}
              disabled={isConnecting}
            >
              <Wallet className="mr-2 h-5 w-5" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet Now'}
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="container mx-auto px-4 text-center text-slate-500">
          <p>© 2025 CompanyReview. Built on Ethereum blockchain.</p>
        </div>
      </footer>
    </div>
  );
}
