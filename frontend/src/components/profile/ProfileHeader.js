'use client';

import { useState } from 'react';
import { MapPin, Calendar, Link as LinkIcon, Edit, Camera, MessageCircle, UserPlus, Check } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function ProfileHeader({ user, isOwner, onEdit, isFollowing, onFollow, onMessage }) {
  const [coverError, setCoverError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      {/* Cover Image */}
      <div className="h-48 md:h-64 relative bg-gray-100">
        {user.coverImage && !coverError ? (
          <img
            src={user.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
            onError={() => setCoverError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-50 to-indigo-50" />
        )}
        
        {isOwner && (
          <button 
            onClick={onEdit}
            className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition shadow-sm"
          >
            <Camera className="h-5 w-5 text-gray-600" />
          </button>
        )}
      </div>

      <div className="px-6 pb-6 relative">
        {/* Profile Image & Actions */}
        <div className="flex justify-between items-end -mt-16 md:-mt-20 mb-4">
          <div className="relative">
            <div className="h-32 w-32 md:h-40 md:w-40 rounded-full border-4 border-white bg-white shadow-md overflow-hidden">
              {user.profileImage && typeof user.profileImage === 'string' && !avatarError ? (
                <img
                  src={user.profileImage}
                  alt={typeof user.name === 'string' ? user.name : 'User'}
                  className="w-full h-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-4xl font-bold">
                  {typeof user.name === 'string' ? user.name.charAt(0) : 'U'}
                </div>
              )}
            </div>
            {isOwner && (
              <button 
                onClick={onEdit}
                className="absolute bottom-2 right-2 bg-white p-1.5 rounded-full shadow-md border border-gray-100 hover:bg-gray-50"
              >
                <Camera className="h-4 w-4 text-gray-600" />
              </button>
            )}
          </div>

          <div className="flex space-x-3 mb-2">
            {isOwner ? (
              <button
                onClick={onEdit}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-full font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit profile
              </button>
            ) : (
              <>
                <button 
                  onClick={onMessage}
                  className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition"
                  title="Send Message"
                >
                  <MessageCircle className="h-5 w-5 text-gray-600" />
                </button>
                <button
                  onClick={onFollow}
                  className={`flex items-center px-6 py-2 rounded-full font-medium transition shadow-sm ${
                    isFollowing
                      ? 'bg-white border border-gray-300 text-gray-900 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
                      : 'bg-primary text-white hover:bg-blue-600'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Follow
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{typeof user.name === 'string' ? user.name : 'User'}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
              user.role === 'founder' ? 'bg-blue-100 text-blue-700' :
              user.role === 'investor' ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {user.role || 'Member'}
            </span>
          </div>
          
          <p className="text-lg text-gray-700 font-medium mb-2">
            {user.tagline || user.headline || user.currentRole || (typeof user.role === 'string' ? user.role : 'Member')}
          </p>
          
          {user.bio && (
            <p className="text-gray-500 max-w-3xl leading-relaxed text-sm line-clamp-2">
              {user.bio}
            </p>
          )}
        </div>

        {/* Action Buttons (Mobile moved here or kept in top right?) - Kept logic consistent with previous layout but enhanced styles */}
        
        {/* Details Row */}
        <div className="flex flex-wrap gap-y-2 gap-x-6 text-sm text-gray-500 mb-4">
          {user.location && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1.5" />
              {typeof user.location === 'object' 
                ? `${user.location.city || ''}${user.location.city && user.location.country ? ', ' : ''}${user.location.country || ''}`
                : String(user.location)}
            </div>
          )}
          {user.website && (
            <div className="flex items-center">
              <LinkIcon className="h-4 w-4 mr-1.5" />
              <a href={user.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                {user.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1.5" />
            Joined {user.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : 'Recently'}
          </div>
        </div>

        {/* Follow Stats */}
        <div className="flex gap-4 text-sm">
          <Link href={`/u/${user.username}/following`} className="hover:underline">
            <span className="font-bold text-gray-900">{user.following?.length || 0}</span>
            <span className="text-gray-500 ml-1">Following</span>
          </Link>
          <Link href={`/u/${user.username}/followers`} className="hover:underline">
            <span className="font-bold text-gray-900">{user.followers?.length || 0}</span>
            <span className="text-gray-500 ml-1">Followers</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
