'use client';

import { Briefcase, MapPin, Globe, ExternalLink, Mail, Users, Eye, Activity } from 'lucide-react';

// Inline SVG components to replace missing lucide-react brand icons
const Linkedin = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Twitter = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const Github = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default function ProfileSidebar({ user }) {
  const socialLinks = user.socialLinks || {};
  const followersCount = user.followers ? user.followers.length : 0;
  // Mock engagement for now or calculate from posts if available in parent
  const engagementRate = "High"; 

  return (
    <div className="space-y-6">
      {/* Metrics Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Metrics</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex justify-center mb-1"><Users className="h-5 w-5 text-blue-500" /></div>
            <div className="font-bold text-gray-900">{followersCount}</div>
            <div className="text-xs text-gray-500">Followers</div>
          </div>
          <div>
            <div className="flex justify-center mb-1"><Eye className="h-5 w-5 text-green-500" /></div>
            <div className="font-bold text-gray-900">{user.profileViews?.length || 0}</div>
            <div className="text-xs text-gray-500">Views</div>
          </div>
          <div>
            <div className="flex justify-center mb-1"><Activity className="h-5 w-5 text-orange-500" /></div>
            <div className="font-bold text-gray-900">{engagementRate}</div>
            <div className="text-xs text-gray-500">Engage</div>
          </div>
        </div>
      </div>

      {/* Intro Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Intro</h3>
        
        <div className="space-y-4 text-sm">
          {user.currentRole && (
            <div className="flex items-start text-gray-700">
              <Briefcase className="h-5 w-5 mr-3 text-gray-400 mt-0.5" />
              <div>
                <span className="font-medium">{typeof user.currentRole === 'string' ? user.currentRole : 'Member'}</span>
                {user.industry && <span className="text-gray-500 block">{typeof user.industry === 'string' ? user.industry : 'Industry'}</span>}
              </div>
            </div>
          )}
          
          {user.location && (
            <div className="flex items-center text-gray-700">
              <MapPin className="h-5 w-5 mr-3 text-gray-400" />
              {typeof user.location === 'object' 
                ? `${user.location.city || ''}${user.location.city && user.location.country ? ', ' : ''}${user.location.country || ''}`
                : String(user.location)}
            </div>
          )}

          {/* Social Links */}
          {(socialLinks.linkedin || socialLinks.twitter || socialLinks.website || socialLinks.github || socialLinks.email) && (
            <div className="pt-4 border-t border-gray-100 space-y-3">
              {socialLinks.website && (
                <a 
                  href={socialLinks.website} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center text-gray-600 hover:text-primary transition"
                >
                  <Globe className="h-5 w-5 mr-3 text-gray-400" />
                  <span className="truncate">Website</span>
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              )}
              {socialLinks.email && (
                <a 
                  href={`mailto:${socialLinks.email}`}
                  className="flex items-center text-gray-600 hover:text-red-500 transition"
                >
                  <Mail className="h-5 w-5 mr-3 text-gray-400" />
                  <span className="truncate">Email</span>
                </a>
              )}
              {socialLinks.linkedin && (
                <a 
                  href={socialLinks.linkedin} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center text-gray-600 hover:text-blue-700 transition"
                >
                  <Linkedin className="h-5 w-5 mr-3 text-gray-400" />
                  <span className="truncate">LinkedIn</span>
                </a>
              )}
              {socialLinks.twitter && (
                <a 
                  href={socialLinks.twitter} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center text-gray-600 hover:text-blue-400 transition"
                >
                  <Twitter className="h-5 w-5 mr-3 text-gray-400" />
                  <span className="truncate">Twitter</span>
                </a>
              )}
              {socialLinks.github && (
                <a 
                  href={socialLinks.github} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center text-gray-600 hover:text-gray-900 transition"
                >
                  <Github className="h-5 w-5 mr-3 text-gray-400" />
                  <span className="truncate">GitHub</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Skills */}
      {user.skills && user.skills.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {user.skills.map((skill, index) => (
              <span 
                key={index} 
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
              >
                {typeof skill === 'string' ? skill : String(skill)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Looking For */}
      {user.lookingFor && user.lookingFor.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Looking For</h3>
          <ul className="space-y-2">
            {user.lookingFor.map((item, index) => (
              <li key={index} className="flex items-start text-sm text-gray-700">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 mr-2 flex-shrink-0" />
                {typeof item === 'string' ? item : String(item)}
              </li>
            ))}
          </ul>
          {user.lookingForDescription && (
            <p className="mt-4 text-sm text-gray-500 italic">
              "{user.lookingForDescription}"
            </p>
          )}
        </div>
      )}
    </div>
  );
}
