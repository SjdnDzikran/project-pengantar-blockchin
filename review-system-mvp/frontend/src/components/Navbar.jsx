import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Boxes, LogOut, LayoutDashboard, Wallet } from 'lucide-react';
import Button from './ui/Button';
import useWalletStore from '../store/walletStore';
import { toast } from 'react-toastify';

export default function Navbar() {
  const navigate = useNavigate();
  const { isConnected, address, connectWallet, disconnectWallet, isConnecting } = useWalletStore();

  const handleConnect = async () => {
    try {
      const address = await connectWallet();
      toast.success(`Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
    } catch (error) {
      toast.error(error.message || 'Failed to connect wallet');
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    toast.info('Wallet disconnected');
    navigate('/');
  };

  const shortenAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Boxes className="h-8 w-8 text-blue-500" />
            <span className="text-xl font-bold text-slate-100">CompanyReview</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/companies"
              className="text-slate-300 hover:text-slate-100 transition-colors font-medium"
            >
              Companies
            </Link>
            {isConnected && (
              <Link
                to="/dashboard"
                className="text-slate-300 hover:text-slate-100 transition-colors font-medium flex items-center gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            )}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-md border border-slate-700">
                  <Wallet className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-slate-300">{shortenAddress(address)}</span>
                </div>
                <Button
                  variant="ghost"
                  onClick={handleDisconnect}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="flex items-center gap-2"
              >
                <Wallet className="h-4 w-4" />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
