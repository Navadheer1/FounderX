'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import ConfirmationModal from '../../components/ConfirmationModal';
import QuestionForm from '../../components/qa/QuestionForm';
import QAList from '../../components/qa/QAList';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  Eye, 
  User, 
  Calendar, 
  MapPin, 
  Briefcase, 
  Sparkles, 
  Edit3, 
  LogOut, 
  Video, 
  Heart, 
  MessageCircle, 
  Layers, 
  Plus, 
  Award,
  Globe,
  Loader
} from 'lucide-react';
import { format } from 'date-fns';

function formatViews(num) {
  if (!num) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export default function ProfilePage() {
  const { user, loading, logout, token, refreshUser } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  // Activity & Startups State
  const [videos, setVideos] = useState([]);
  const [startups, setStartups] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [loadingStartups, setLoadingStartups] = useState(true);
  const [views, setViews] = useState([]);
  const [loadingViews, setLoadingViews] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchLatestUser = async () => {
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!storedToken) return;
      try {
        const res = await fetch(`${API_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
            Accept: 'application/json'
          }
        });
        if (res.ok) {
          const freshUser = await res.json();
          if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(freshUser));
          }
        }
      } catch (err) {
        console.error('Failed to fetch latest user on mount:', err);
      } finally {
        // Also run the context level refresh to synchronize state globally
        await refreshUser().catch(err => console.error('Error refreshing profile:', err));
      }
    };

    fetchLatestUser();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    } else if (user) {
      fetchProfileViews();
      fetchActivityAndStartups();
    }
  }, [user, loading, router]);

  const fetchProfileViews = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/profile-views`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setViews(data.data);
      }
    } catch (err) {
      console.error('Failed to load profile views', err);
    } finally {
      setLoadingViews(false);
    }
  };

  const fetchActivityAndStartups = async () => {
    try {
      // 1. Fetch user's uploaded videos from api/videos
      const videosRes = await fetch(`${API_URL}/api/videos`);
      const videosData = await videosRes.json();
      if (videosData.success && Array.isArray(videosData.data)) {
        const userVideos = videosData.data.filter(
          v => v.creator?._id === user._id || v.creator === user._id || v.uploader?._id === user._id || v.uploader === user._id
        );
        setVideos(userVideos);
      }
    } catch (err) {
      console.error('Failed to fetch founder activity:', err);
    } finally {
      setLoadingActivity(false);
    }

    try {
      // 2. Fetch user's owned startups
      const startupsRes = await fetch(`${API_URL}/api/startups?founderId=${user._id}`);
      const startupsData = await startupsRes.json();
      if (startupsData.success && Array.isArray(startupsData.data)) {
        setStartups(startupsData.data);
      }
    } catch (err) {
      console.error('Failed to fetch founder startups:', err);
    } finally {
      setLoadingStartups(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Calculate dynamic activity metrics
  const totalPitches = videos.length;
  const totalViewsReceived = videos.reduce((sum, v) => sum + (v.views || 0), 0);
  const totalLikesReceived = videos.reduce((sum, v) => sum + (v.likes?.length || 0), 0);
  const totalCommentsReceived = videos.reduce((sum, v) => sum + (v.comments?.length || 0), 0);
  
  const hasActivity = totalPitches > 0;
  const isProfileComplete =
    user?.isProfileComplete ||
    Boolean(user?.bio || user?.headline || user?.skills?.length || user?.location);
  const isProfileIncomplete = !isProfileComplete;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-20 font-sans relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-[10%] left-[-10%] w-[35rem] h-[35rem] rounded-full bg-blue-600/[0.02] blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[35rem] h-[35rem] rounded-full bg-purple-600/[0.02] blur-[120px] pointer-events-none" />

      <Navbar />
      
      {/* Cover Header Banner */}
      <div className="bg-white border-b border-slate-200/60 relative">
        <div className="h-44 md:h-56 bg-gradient-to-r from-[#1E3A8A] via-[#312E81] to-[#4C1D95] relative overflow-hidden">
          {user.coverImage && (
            <img src={user.coverImage} alt="" className="w-full h-full object-cover opacity-80" />
          )}
          {/* subtle mesh decoration */}
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="relative -mt-16 md:-mt-20 mb-6 flex flex-col md:flex-row items-center md:items-end justify-between text-center md:text-left gap-6">
            
            {/* Avatar & Details info */}
            <div className="flex flex-col md:flex-row items-center md:items-end gap-5">
              <div className="h-32 w-32 md:h-40 md:w-40 rounded-full bg-white p-1.5 shadow-[0_8px_30px_rgba(15,23,42,0.08)] border border-slate-200/50 overflow-hidden flex-shrink-0 relative z-10">
                {user.profileImage ? (
                  <img src={user.profileImage} alt={user.name} className="h-full w-full object-cover rounded-full" />
                ) : (
                  <div className="h-full w-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-4xl rounded-full border border-blue-150">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              
              <div className="space-y-1.5 md:mb-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                  <h1 className="text-2xl sm:text-3.5xl font-black tracking-tight text-slate-900 leading-none">
                    {user.name}
                  </h1>
                  <span className={`px-3 py-1 text-[10.5px] font-black uppercase tracking-wider rounded-full border ${
                    user.role === 'founder' 
                      ? 'bg-blue-50 border-blue-100 text-blue-600' 
                      : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-500 max-w-lg">
                  {user.headline || user.bio || "No headline set. Click edit profile to add details!"}
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex flex-wrap justify-center items-center gap-3 mb-2">
              <button 
                onClick={() => router.push('/profile/edit')}
                className="px-4.5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl border border-slate-200 shadow-sm transition flex items-center gap-1.5 text-xs transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                Edit Profile Settings
              </button>
              <button 
                onClick={() => router.push(`/profile/${user.username}`)}
                className="px-4.5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-bold rounded-xl shadow-md transition flex items-center gap-1.5 text-xs transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Globe className="w-3.5 h-3.5" />
                View Public Profile
              </button>
              <button
                onClick={() => setIsLogoutModalOpen(true)}
                className="p-2.5 text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 rounded-xl shadow-sm transition"
                title="Sign out"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* PROFILE COMPLETION CTA GLASS BANNER */}
        {isProfileIncomplete && (
          <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-200/50 rounded-3xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_10px_30px_rgba(37,99,235,0.03)] backdrop-blur-md">
            <div className="space-y-1.5 text-center md:text-left">
              <h3 className="text-base font-black text-slate-900 flex items-center justify-center md:justify-start gap-2">
                <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
                Complete your Profile Setup
              </h3>
              <p className="text-xs font-semibold text-slate-500 max-w-xl">
                Make your professional profile stand out! Adding your bio, skills, and industry helps investors, co-founders, and partners find you easily.
              </p>
            </div>
            <button
              onClick={() => router.push('/profile/setup')}
              className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition transform hover:scale-[1.03]"
            >
              Setup Your Profile Now
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT SIDEBAR COLUMN: ABOUT CARD & PROFILE VIEWS */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* dynamic ABOUT SECTION CARD */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.03)] space-y-6">
              <h3 className="text-md font-black tracking-tight text-slate-950 uppercase border-b border-slate-100 pb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                About You
              </h3>
              
              <div className="space-y-4.5 text-xs font-semibold text-slate-600">
                {user.bio && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Bio / Headline</span>
                    <p className="text-slate-800 text-xs leading-relaxed font-semibold">{user.bio}</p>
                  </div>
                )}
                
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">User Handle</span>
                  <p className="text-slate-950 font-bold text-xs">@{user.username || 'unknown'}</p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Role Profile</span>
                  <p className="text-slate-950 font-bold text-xs uppercase tracking-wide">{user.role}</p>
                </div>

                {user.location && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Location</span>
                    <p className="text-slate-950 font-bold text-xs flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {typeof user.location === 'object' 
                        ? `${user.location.city || ''}${user.location.city && user.location.country ? ', ' : ''}${user.location.country || ''}`
                        : user.location}
                    </p>
                  </div>
                )}

                {/* dynamic skills pills */}
                {user.skills && user.skills.length > 0 && (
                  <div className="space-y-2 pt-1 border-t border-slate-50">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Verified Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {user.skills.map((skill, index) => (
                        <span key={index} className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[10px] rounded-lg">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* dynamic interests */}
                {user.industry && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-50">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Primary Industry</span>
                    <p className="text-slate-950 font-bold text-xs">{user.industry}</p>
                  </div>
                )}

                <div className="space-y-1.5 pt-2 border-t border-slate-50 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-[10.5px]">Joined {user.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : 'Unknown'}</span>
                </div>
              </div>
            </div>

            {/* PROFILE VIEWS SECTION */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgba(15,23,42,0.03)] overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-sm font-black text-slate-950 flex items-center gap-1.5 uppercase">
                    <Eye className="h-4.5 w-4.5 text-blue-600" />
                    Profile Views
                  </h3>
                  <p className="text-[10.5px] text-slate-500 mt-1 font-semibold">
                    Last 30 days history
                  </p>
                </div>
                <div className="text-2xl font-black text-blue-600">
                  {views.length}
                </div>
              </div>

              <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
                {loadingViews ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-semibold">Loading history...</div>
                ) : views.length > 0 ? (
                  views.map((view, index) => {
                    const viewer = view.viewerId || {};
                    const viewerName = typeof viewer.name === 'string' ? viewer.name : 'Accredited Member';
                    const viewerRole = typeof viewer.role === 'string' ? viewer.role : 'member';
                    const viewerUsername = typeof viewer.username === 'string' ? viewer.username : '';
                    const viewerImage = typeof viewer.profileImage === 'string' ? viewer.profileImage : null;
                    const viewerId = viewer._id || `unknown-${index}`;
                    
                    return (
                      <div key={index} className="p-4 hover:bg-slate-50/50 transition flex items-center justify-between gap-3">
                        <Link href={`/profile/${viewerId}`} className="flex items-center gap-2.5 flex-1 min-w-0">
                          <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {viewerImage ? (
                              <img src={viewerImage} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-xs font-black text-slate-500">{viewerName.charAt(0)?.toUpperCase()}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate leading-none mb-1">{viewerName}</p>
                            <p className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider leading-none">
                              {viewerRole} {viewerUsername && `• @${viewerUsername}`}
                            </p>
                          </div>
                        </Link>
                        <div className="text-[10px] text-slate-400 font-semibold flex-shrink-0">
                          {view.timestamp ? format(new Date(view.timestamp), 'MMM d') : ''}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs font-semibold space-y-1">
                    <p>No profile views recorded.</p>
                    <p className="text-[10px] text-slate-400 font-normal">Share your ventures to attract attention!</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT MAIN SECTION: ACTIVITY, STARTUPS & Q&A */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* dynamic FOUNDER ACTIVITY SECTION */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.03)] space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <h3 className="text-md font-black tracking-tight text-slate-955 uppercase flex items-center gap-2">
                  <Video className="w-5 h-5 text-blue-600 animate-pulse" />
                  Founder Activity Feed
                </h3>
                <span className="text-[10.5px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
                  Real Metrics
                </span>
              </div>

              {loadingActivity ? (
                <div className="flex justify-center py-10">
                  <Loader className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : !hasActivity ? (
                <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-3.5">
                  <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto">
                    <Video className="w-5 h-5 text-blue-600 ml-0.5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-900">No activity yet</p>
                    <p className="text-[10.5px] text-slate-500 font-semibold max-w-xs mx-auto">Publish your first startup pitch video on FounderTV to display real metrics and traction here!</p>
                  </div>
                  <button
                    onClick={() => router.push('/upload')}
                    className="px-4.5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-md transition"
                  >
                    Upload Pitch Video
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Dynamic Metrics Widgets Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-50/80 p-4.5 rounded-2xl border border-slate-200/50 text-center space-y-1 hover:shadow-sm transition">
                      <div className="text-2xl font-black text-slate-950">{totalPitches}</div>
                      <div className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Pitches</div>
                    </div>
                    <div className="bg-slate-50/80 p-4.5 rounded-2xl border border-slate-200/50 text-center space-y-1 hover:shadow-sm transition">
                      <div className="text-2xl font-black text-slate-950">{formatViews(totalViewsReceived)}</div>
                      <div className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Views</div>
                    </div>
                    <div className="bg-slate-50/80 p-4.5 rounded-2xl border border-slate-200/50 text-center space-y-1 hover:shadow-sm transition">
                      <div className="text-2xl font-black text-slate-950">{totalLikesReceived}</div>
                      <div className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest leading-none">Likes Gained</div>
                    </div>
                    <div className="bg-slate-50/80 p-4.5 rounded-2xl border border-slate-200/50 text-center space-y-1 hover:shadow-sm transition">
                      <div className="text-2xl font-black text-slate-950">{totalCommentsReceived}</div>
                      <div className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest leading-none">Comments</div>
                    </div>
                  </div>

                  {/* Recent uploads listing */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Recent Startup Uploads</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {videos.slice(0, 4).map(vid => (
                        <div 
                          key={vid._id}
                          onClick={() => router.push(`/foundertv/${vid._id}`)}
                          className="group border border-slate-200 rounded-2xl p-3 bg-white hover:border-blue-600/30 hover:shadow-md transition duration-200 cursor-pointer flex items-center gap-3.5"
                        >
                          <div className="w-18 h-18 sm:w-20 sm:h-13 bg-slate-900 rounded-xl overflow-hidden flex-shrink-0 relative">
                            <img src={vid.thumbnailUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                            <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                              <Plus className="w-4 h-4 text-white fill-current opacity-80 group-hover:scale-110 transition" />
                            </div>
                          </div>
                          <div className="min-w-0 space-y-1">
                            <h5 className="font-extrabold text-xs text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                              {vid.title}
                            </h5>
                            <div className="flex items-center gap-2.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{formatViews(vid.views || 0)}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{vid.likes?.length || 0}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* dynamic STARTUPS SECTION */}
            {loadingStartups ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.03)] flex justify-center py-8">
                <Loader className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : startups.length > 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.03)] space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-md font-black tracking-tight text-slate-950 uppercase flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    My Startup Ventures
                  </h3>
                  <Link 
                    href="/startups/create"
                    className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add New
                  </Link>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {startups.map(startup => (
                    <div 
                      key={startup._id}
                      className="group border border-slate-200 p-5 rounded-2.5xl bg-white hover:border-blue-600/30 hover:shadow-md transition duration-300 flex flex-col justify-between h-full"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-3.5">
                          <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center font-black text-slate-500 shadow-sm overflow-hidden">
                            {startup.logo ? (
                              <img src={startup.logo} alt="" className="h-full w-full object-cover" />
                            ) : (
                              startup.name?.charAt(0)?.toUpperCase()
                            )}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                              {startup.name}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mt-0.5">
                              {startup.industry || 'Tech Startup'}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-500 line-clamp-3 font-semibold">
                          {startup.oneLinePitch || startup.description || 'No pitch description provided.'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 mt-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-[9.5px] font-black uppercase tracking-wider text-blue-600">
                          {startup.stage || 'Pre-seed'}
                        </span>
                        <Link 
                          href={`/s/${startup.slug || startup._id}`}
                          className="text-[10px] font-black text-slate-900 hover:text-blue-600 uppercase tracking-wider transition"
                        >
                          View Showcase →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* dynamic Q&A SECTION */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <MessageCircle className="h-5.5 w-5.5 text-blue-600" />
                <h3 className="text-md font-black uppercase tracking-tight text-slate-950">
                  Interactive Q&A
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <QuestionForm targetId={user._id} targetType="User" />
                </div>
                <div className="md:col-span-2">
                  <QAList targetId={user._id} targetType="User" />
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => {
          logout();
          setIsLogoutModalOpen(false);
        }}
        title="Sign out from FounderX"
        message="Are you sure you want to log out? You will need to sign in again to access your account dashboard."
        confirmText="Sign out"
        cancelText="Cancel"
      />
    </div>
  );
}
