'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { 
  Search, 
  MapPin, 
  TrendingUp, 
  Rocket,
  Sparkles,
  Loader
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import SendInterestRequestModal from '../../components/SendInterestRequestModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Helper function to get safe image src
const getSafeImageSrc = (src) => {
  if (!src || typeof src !== 'string' || src.trim() === '') return null;
  return src;
};

const renderLocation = (location) => {
  if (!location) return 'Remote';
  if (typeof location === 'string') return location;
  return location.remote ? 'Remote' : `${location.city || ''}${location.city && location.country ? ', ' : ''}${location.country || ''}`;
};

// Startup Card Component
function StartupCard({ startup, onShowInterest, isInvestor }) {
  const logoSrc = getSafeImageSrc(startup.logo);
  const founderName = startup.founderId?.name || startup.founder?.name || 'Unknown Founder';

  return (
    <div className="card p-0 overflow-hidden h-full flex flex-col group hover:shadow-lg transition">
      {/* Card Header with Logo */}
      <div className="h-24 bg-gradient-to-r from-blue-50 to-indigo-50 relative">
        <div className="absolute top-4 right-4">
          <span className="px-2 py-1 bg-white/80 backdrop-blur-sm text-xs font-semibold text-gray-700 rounded-lg shadow-sm">
            {startup.stage}
          </span>
        </div>
        <div className="absolute -bottom-6 left-6">
          <div className="h-16 w-16 rounded-xl bg-white shadow-md p-1 border border-gray-50 flex items-center justify-center">
            {logoSrc ? (
              <img src={logoSrc} alt={startup.name} className="h-full w-full object-contain rounded-lg" />
            ) : (
              <div className="h-full w-full bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-xl">
                {startup.name.charAt(0)}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="pt-8 px-6 pb-6 flex-1 flex flex-col">
        <div className="mb-1">
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition line-clamp-1">{startup.name}</h3>
          <p className="text-xs font-semibold text-primary uppercase tracking-wide">{startup.industry}</p>
        </div>
        
        <p className="text-slate-500 text-sm line-clamp-2 mb-4 mt-2 flex-1">
          {startup.oneLinePitch}
        </p>

        <p className="text-xs text-slate-400 mb-2">
          Founder: <span className="font-semibold text-slate-700">{founderName}</span>
        </p>
        
        <div className="flex items-center text-xs text-slate-400 mb-4 gap-4">
          <div className="flex items-center">
            <MapPin className="h-3 w-3 mr-1 text-slate-400" />
            <span className="truncate max-w-[120px]">{renderLocation(startup.location)}</span>
          </div>
          {(startup.metrics?.investorInterest || startup.investorInterestCount) > 0 && (
            <span className="text-xs font-medium text-slate-500">
              {startup.metrics?.investorInterest || startup.investorInterestCount} interested
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs font-medium pt-4 border-t border-gray-100 mb-4">
          <div className="flex items-center text-slate-400">
            <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
            <span>{startup.metrics?.views || 0} views</span>
          </div>
          <span className="text-primary font-bold">
            {startup.fundingRequired > 0 ? `$${(startup.fundingRequired / 1000).toFixed(0)}K needed` : 'Bootstrapped'}
          </span>
        </div>

        <div className="flex gap-2 mt-auto">
          <Link href={`/startups/${startup._id}`} className="flex-1 btn-secondary text-center py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1">
            View Startup
          </Link>
          {isInvestor && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                onShowInterest(startup);
              }}
              className="flex-1 btn-primary py-2 text-xs font-bold rounded-xl"
            >
              Show Interest
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Startup Section Component
function StartupSection({ title, icon: Icon, startups, onShowInterest, isInvestor }) {
  if (startups.length === 0) return null;
  
  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-6">
        {Icon && <Icon className="h-6 w-6 text-primary" />}
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {startups.map(startup => (
          <StartupCard 
            key={startup._id} 
            startup={startup} 
            onShowInterest={onShowInterest}
            isInvestor={isInvestor}
          />
        ))}
      </div>
    </section>
  );
}

export default function StartupsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const isInvestor = user && user.role === 'investor';

  const [interestModalOpen, setInterestModalOpen] = useState(false);
  const [selectedStartup, setSelectedStartup] = useState(null);

  useEffect(() => {
    const fetchStartups = async () => {
      try {
        const res = await fetch(`${API_URL}/api/startups`);
        const data = await res.json();
        if (data.success) {
          setStartups(data.data);
        } else {
          setError(data.error || 'Failed to fetch startups');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch startups');
      } finally {
        setLoading(false);
      }
    };
    fetchStartups();
  }, []);

  const handleShowInterest = (startup) => {
    setSelectedStartup(startup);
    setInterestModalOpen(true);
  };

  const filteredStartups = startups.filter(startup => 
    startup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    startup.oneLinePitch.toLowerCase().includes(searchTerm.toLowerCase()) ||
    startup.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sorting logics:
  const trendingStartups = [...filteredStartups]
    .sort((a, b) => (b.metrics?.views || 0) - (a.metrics?.views || 0))
    .slice(0, 3);

  const newLaunches = [...filteredStartups]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  const aiRecommended = [...filteredStartups]
    .sort((a, b) => (b.metrics?.investorInterest || 0) - (a.metrics?.investorInterest || 0))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Discover the next unicorn</h1>
            <p className="text-slate-500 mt-2">Find and connect with promising startups before everyone else.</p>
          </div>
          
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search startups by name, industry, or pitch..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-card-border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-card-border">
            <h3 className="text-lg font-medium text-red-500">{error}</h3>
            <p className="text-slate-500 mt-1">Please try again later.</p>
          </div>
        ) : startups.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-card-border">
            <div className="bg-blue-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Rocket className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">
              No public startups yet. Be the first founder to launch.
            </h3>
          </div>
        ) : filteredStartups.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-card-border">
            <div className="bg-blue-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">
              No startups found matching your search
            </h3>
            <p className="text-slate-500 mt-1">Try adjusting your search terms</p>
            <button 
              onClick={() => setSearchTerm('')}
              className="mt-4 px-4 py-2 btn-secondary"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <>
            <StartupSection 
              title="Trending Startups" 
              icon={TrendingUp} 
              startups={trendingStartups} 
              onShowInterest={handleShowInterest}
              isInvestor={isInvestor}
            />

            <StartupSection 
              title="New Launches" 
              icon={Rocket} 
              startups={newLaunches} 
              onShowInterest={handleShowInterest}
              isInvestor={isInvestor}
            />

            <StartupSection 
              title="AI Recommended" 
              icon={Sparkles} 
              startups={aiRecommended} 
              onShowInterest={handleShowInterest}
              isInvestor={isInvestor}
            />
          </>
        )}
      </main>

      <SendInterestRequestModal 
        isOpen={interestModalOpen}
        onClose={() => setInterestModalOpen(false)}
        startup={selectedStartup}
      />
    </div>
  );
}
