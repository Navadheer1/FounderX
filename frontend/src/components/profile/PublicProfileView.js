'use client';

import { useState, useEffect } from 'react';
import Navbar from '../Navbar';
import ShareButton from '../ShareButton';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, Briefcase, CheckCircle, ShieldCheck, ExternalLink, MessageCircle, Award, Users } from 'lucide-react';
import { format } from 'date-fns';
import QuestionForm from '../qa/QuestionForm';
import QAList from '../qa/QAList';
import { useAuth } from '../../context/AuthContext';
import FollowButton from '../FollowButton';

export default function PublicProfileView({ user }) {
  const { user: currentUser, token } = useAuth();
  const router = useRouter();
  const profileUrl = typeof window !== 'undefined' ? window.location.href : '';
  const [mutuals, setMutuals] = useState([]);
  const [loadingMutuals, setLoadingMutuals] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Check if current user is following this profile
  const [localIsFollowing, setLocalIsFollowing] = useState(
    currentUser && user.followers ? user.followers.includes(currentUser._id) : false
  );
  const [localFollowersCount, setLocalFollowersCount] = useState(user.followers?.length || 0);

  // Sync state when user/currentUser changes
  useEffect(() => {
    const isFollowing = currentUser && user.followers ? user.followers.includes(currentUser._id) : false;
    const count = user.followers?.length || 0;
    const timer = setTimeout(() => {
      setLocalIsFollowing(isFollowing);
      setLocalFollowersCount(count);
    }, 0);
    return () => clearTimeout(timer);
  }, [user, currentUser]);

  const handleFollowToggle = (newState) => {
    setLocalIsFollowing(newState);
    setLocalFollowersCount(prev => newState ? prev + 1 : prev - 1);
  };

  // Fetch mutual connections
  useEffect(() => {
    if (currentUser && token && user._id !== currentUser._id) {
      const timer = setTimeout(() => {
        setLoadingMutuals(true);
      }, 0);
      
      fetch(`http://localhost:5000/api/users/${user._id}/mutuals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMutuals(data.data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => {
        setLoadingMutuals(false);
      });
      
      return () => clearTimeout(timer);
    }
  }, [currentUser, token, user._id]);

  const handleMessage = () => {
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }
    // Navigate to messages with this user selected
    // We can pass userId via query param to auto-start chat
    router.push(`/messages?userId=${user._id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          {/* Cover */}
          <div className="h-48 md:h-64 bg-gradient-to-r from-blue-900 to-indigo-900 relative">
            {user.coverImage && (
              <img 
                src={user.coverImage} 
                alt="Cover" 
                className="w-full h-full object-cover opacity-90"
              />
            )}
          </div>

          <div className="px-8 pb-8">
            <div className="flex flex-col md:flex-row items-start justify-between">
              {/* Avatar & Info */}
              <div className="flex flex-col md:flex-row gap-6 -mt-16 md:-mt-20 relative z-10">
                <div className="h-32 w-32 md:h-40 md:w-40 rounded-full border-4 border-white bg-white shadow-md overflow-hidden flex-shrink-0">
                  {user.profileImage ? (
                    <img 
                      src={user.profileImage} 
                      alt={user.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-5xl">
                      {user.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="mt-4 md:mt-24 space-y-2">
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                    {user.isVerified && (
                      <div className="text-blue-500" title="Verified Founder">
                        <ShieldCheck className="h-6 w-6 fill-blue-50" />
                      </div>
                    )}
                    {(user.founderScore > 0) && (
                       <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-100 ml-2" title="Founder Score">
                         <Award className="h-4 w-4 text-yellow-600" />
                         <span className="text-sm font-bold text-yellow-700">{user.founderScore}</span>
                       </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 items-center text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                      user.role === 'founder' ? 'bg-blue-100 text-blue-700' : 
                      user.role === 'investor' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.role}
                    </span>
                    {user.location && (
                      <span className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        {typeof user.location === 'object' ? user.location.city : user.location}
                      </span>
                    )}
                  </div>

                  {/* Follow Counts & Mutuals */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                    <div className="flex items-center gap-1 hover:text-primary cursor-pointer transition">
                        <span className="font-bold text-gray-900">{user.following?.length || 0}</span> Following
                    </div>
                    <div className="flex items-center gap-1 hover:text-primary cursor-pointer transition">
                        <span className="font-bold text-gray-900">{localFollowersCount}</span> Followers
                    </div>
                    
                    {mutuals.length > 0 && (
                        <div className="flex items-center gap-1 text-gray-500 ml-2 pl-4 border-l border-gray-200">
                            <Users className="h-3 w-3" />
                            <span className="font-medium text-gray-900">{mutuals.length}</span> mutual connections
                        </div>
                    )}
                  </div>

                  <p className="text-lg text-gray-700 font-medium max-w-2xl mt-2">
                    {user.headline || user.currentRole || user.bio}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 md:mt-4 flex items-center gap-3">
                <ShareButton title={`Check out ${user.name} on FounderX`} url={profileUrl} />
                
                {mounted && (
                  <>
                    {currentUser && currentUser._id !== user._id ? (
                        <>
                          <button 
                            onClick={handleMessage}
                            disabled={!localIsFollowing}
                            className={`p-2.5 border rounded-lg transition ${localIsFollowing ? 'border-gray-300 hover:bg-gray-50 text-gray-650' : 'border-gray-200 text-gray-300 cursor-not-allowed'}`}
                            title={localIsFollowing ? "Send Message" : "Follow to message"}
                          >
                            <MessageCircle className="h-5 w-5" />
                          </button>
                          <FollowButton 
                            userId={user._id} 
                            initialIsFollowing={localIsFollowing} 
                            onToggle={handleFollowToggle}
                            className="px-6 py-2.5 rounded-lg"
                          />
                        </>
                    ) : (
                       !currentUser && (
                        <Link 
                            href="/auth/register"
                            className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-sm"
                        >
                            Connect
                        </Link>
                       )
                    )}
                    
                    {currentUser && currentUser._id === user._id && (
                         <button 
                            onClick={() => router.push("/profile/edit")}
                            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition shadow-sm"
                         >
                            Edit Profile
                         </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Extended Bio */}
            {user.about && (
              <div className="mt-8 pt-8 border-t border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {user.about}
                </p>
              </div>
            )}

            {/* Experience / Details */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {user.experience && user.experience.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Briefcase className="h-5 w-5 mr-2 text-gray-400" />
                    Experience
                  </h3>
                  <div className="space-y-6">
                    {user.experience.map((exp, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="mt-1 h-2 w-2 rounded-full bg-gray-300 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-gray-900">{exp.title}</h4>
                          <div className="text-sm text-gray-500">{exp.company}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {exp.startDate ? format(new Date(exp.startDate), 'MMM yyyy') : ''} - 
                            {exp.current ? ' Present' : (exp.endDate ? format(new Date(exp.endDate), 'MMM yyyy') : '')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sidebar Info */}
              <div className="space-y-6">
                 {/* Founder Startups */}
                 {(user.startups || (user.roleProfile && user.roleProfile.startups)) && (user.startups || user.roleProfile.startups).length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Startups</h3>
                      <div className="space-y-3">
                        {(user.startups || user.roleProfile.startups).map(startup => (
                           <Link key={startup._id} href={`/s/${startup.slug || startup._id}`} className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded-lg transition">
                              {startup.logo ? (
                                <img src={startup.logo} alt={startup.name} className="h-10 w-10 rounded-md object-cover" />
                              ) : (
                                <div className="h-10 w-10 rounded-md bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-500">
                                  {startup.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-gray-900">{startup.name}</div>
                                <div className="text-xs text-gray-500">{startup.oneLinePitch}</div>
                              </div>
                           </Link>
                        ))}
                      </div>
                    </div>
                 )}

                 {/* Investor Portfolio/Interests - Placeholder if needed */}
                 {user.role === 'investor' && user.roleProfile && (
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Investment Focus</h3>
                      <div className="space-y-2">
                        {user.roleProfile.investmentStage && (
                          <div className="flex justify-between text-sm">
                             <span className="text-gray-500">Stage</span>
                             <span className="font-medium text-gray-900">{user.roleProfile.investmentStage.join(', ')}</span>
                          </div>
                        )}
                        {user.roleProfile.ticketSize && (
                          <div className="flex justify-between text-sm">
                             <span className="text-gray-500">Ticket Size</span>
                             <span className="font-medium text-gray-900">{user.roleProfile.ticketSize}</span>
                          </div>
                        )}
                      </div>
                    </div>
                 )}
              </div>
            </div>
          </div>
        </div>

        {/* Q&A Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <MessageCircle className="h-6 w-6 text-gray-900" />
            <h2 className="text-2xl font-bold text-gray-900">Q&A</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
               <QuestionForm targetId={user._id} targetType="User" />
            </div>
            <div className="lg:col-span-2">
               <QAList targetId={user._id} targetType="User" />
            </div>
          </div>
        </div>

        {/* CTA */}
        {mounted && (!currentUser || (currentUser && (!currentUser.bio || !currentUser.skills?.length))) && (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {!currentUser ? `Join FounderX to connect with ${user.name}` : "Complete your profile to build your network"}
            </h2>
            <p className="text-gray-500 mb-6 max-w-lg mx-auto text-sm">
              {!currentUser 
                ? "FounderX is the premier community for founders, investors, and startup enthusiasts to share knowledge and build relationships."
                : "Introduce yourself to other startup founders, investors, and community members on FounderX."}
            </p>
            <button 
              onClick={() => router.push(!currentUser ? "/register" : "/profile/setup")}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-bold rounded-xl hover:shadow-md transition duration-200"
            >
              {!currentUser ? "Create your profile" : "Complete profile setup"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
