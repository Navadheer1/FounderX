'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, User, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import FollowButton from './FollowButton';

export default function GlobalSearch() {
  const { user: currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true);
        try {
          const res = await fetch(`http://localhost:5000/api/users/search?q=${encodeURIComponent(query)}`);
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            setResults(data.data);
            setIsOpen(true);
          } else {
            setResults([]);
          }
        } catch (error) {
          console.error('Search error:', error);
          setResults([]);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        router.push(`/profile/${results[selectedIndex].username}`);
        clearSearch();
      }
    }
  };

  const clearSearch = () => {
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {loading ? (
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if(results.length > 0) setIsOpen(true); }}
          placeholder="Search @username..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-full leading-5 bg-section placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition duration-150 ease-in-out"
          suppressHydrationWarning
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 sm:left-auto sm:right-0 md:left-0 md:right-auto mt-3 w-full sm:w-[450px] bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-[80vh] overflow-y-auto z-50 ring-1 ring-black ring-opacity-5">
          {results.length > 0 ? (
            <div className="py-2">
              <div className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50 border-b border-gray-100">
                Accounts
              </div>
              {results.map((user, index) => {
                 const isFollowing = currentUser && user.followers ? user.followers.includes(currentUser._id) : false;
                 
                 return (
                  <div 
                    key={user._id}
                    className={`flex items-center justify-between p-4 transition border-b border-gray-50 last:border-0 ${index === selectedIndex ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                  >
                    <Link 
                      href={`/profile/${user.username}`}
                      className="flex items-center flex-1 min-w-0 gap-4 mr-4"
                      onClick={clearSearch}
                    >
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200">
                        {user.profileImage ? (
                          <img src={user.profileImage} alt={user.name} className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <h4 className="text-sm font-bold text-gray-900 truncate">{user.name}</h4>
                          {user.role === 'founder' && (
                            <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase leading-none">
                              Founder
                            </span>
                          )}
                          {user.role === 'investor' && (
                            <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase leading-none">
                              Investor
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                        {user.headline && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">{user.headline}</p>
                        )}
                      </div>
                    </Link>
                    
                    <div className="flex-shrink-0">
                      {currentUser && currentUser._id !== user._id && (
                          <FollowButton 
                              userId={user._id} 
                              initialIsFollowing={isFollowing} 
                              className="px-4 py-1.5 text-xs font-semibold h-9"
                          />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              <p className="text-sm font-medium">No results found for "{query}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
