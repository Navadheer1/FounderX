'use client';

import { Rocket, DollarSign, TrendingUp, Briefcase, FileText, Video } from 'lucide-react';
import Link from 'next/link';
import StartupCard from './StartupCard';

export default function RoleSpecificSection({ user }) {
  const { role, roleProfile } = user;
  
  if (!roleProfile) return null;

  if (role === 'founder') {
    return (
      <div className="space-y-6 mb-6">
        {/* Startup Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <Rocket className="h-6 w-6 mr-2 text-blue-500" />
              Startup Details
            </h3>
          </div>
          
          {roleProfile.startups && roleProfile.startups.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {roleProfile.startups.filter(s => s).map((startup) => (
                <StartupCard key={startup._id} startup={startup} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No linked startups yet.</p>
          )}
          
          {/* Traction Stats */}
          {roleProfile.traction && (roleProfile.traction.revenue > 0 || roleProfile.traction.users > 0) && (
            <div className="mt-6 grid grid-cols-2 gap-4">
               {roleProfile.traction.revenue > 0 && (
                 <div className="bg-green-50 p-4 rounded-xl">
                   <div className="text-sm text-green-600 font-medium mb-1">Monthly Revenue</div>
                   <div className="text-2xl font-bold text-green-700">${roleProfile.traction.revenue.toLocaleString()}</div>
                 </div>
               )}
               {roleProfile.traction.users > 0 && (
                 <div className="bg-blue-50 p-4 rounded-xl">
                   <div className="text-sm text-blue-600 font-medium mb-1">Users</div>
                   <div className="text-2xl font-bold text-blue-700">{roleProfile.traction.users.toLocaleString()}</div>
                 </div>
               )}
            </div>
          )}

          {/* Links */}
          <div className="mt-6 flex flex-wrap gap-4">
            {roleProfile.pitchDeckUrl && (
              <a 
                href={roleProfile.pitchDeckUrl} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
              >
                <FileText className="h-4 w-4 mr-2" />
                Pitch Deck
              </a>
            )}
            {roleProfile.pitchVideoUrl && (
              <a 
                href={roleProfile.pitchVideoUrl} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
              >
                <Video className="h-4 w-4 mr-2" />
                Pitch Video
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (role === 'investor') {
    return (
      <div className="space-y-6 mb-6">
        {/* Investment Thesis / Prefs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <DollarSign className="h-6 w-6 mr-2 text-green-600" />
            Investment Profile
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-gray-500 font-medium mb-2">Investor Type</div>
              <div className="text-gray-900 font-semibold bg-gray-50 px-3 py-1.5 rounded-lg inline-block">
                {typeof roleProfile.investorType === 'string' ? roleProfile.investorType : 'Investor'}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500 font-medium mb-2">Ticket Size</div>
              <div className="text-gray-900 font-semibold">
                ${roleProfile.ticketSize?.min?.toLocaleString() || '0'} - ${roleProfile.ticketSize?.max?.toLocaleString() || '0'}
              </div>
            </div>

            <div>
               <div className="text-sm text-gray-500 font-medium mb-2">Preferred Stages</div>
               <div className="flex flex-wrap gap-2">
                 {Array.isArray(roleProfile.preferredStages) && roleProfile.preferredStages.map((stage, i) => (
                   <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md">
                     {typeof stage === 'string' ? stage : String(stage)}
                   </span>
                 ))}
               </div>
            </div>

            <div>
               <div className="text-sm text-gray-500 font-medium mb-2">Focus Industries</div>
               <div className="flex flex-wrap gap-2">
                 {Array.isArray(roleProfile.preferredIndustries) && roleProfile.preferredIndustries.map((ind, i) => (
                   <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-md">
                     {typeof ind === 'string' ? ind : String(ind)}
                   </span>
                 ))}
               </div>
            </div>
          </div>
        </div>

        {/* Portfolio */}
        {roleProfile.portfolio && roleProfile.portfolio.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Briefcase className="h-6 w-6 mr-2 text-gray-600" />
              Portfolio
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {roleProfile.portfolio.map((item, i) => (
                <a 
                  key={i} 
                  href={item.website} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition"
                >
                  <div className="h-10 w-10 bg-gray-200 rounded-lg mr-3 overflow-hidden flex-shrink-0">
                    {item.logo ? (
                      <img src={item.logo} alt={String(item.name || 'Portfolio Item')} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400 font-bold text-xs">
                        {typeof item.name === 'string' ? item.name[0] : '?'}
                      </div>
                    )}
                  </div>
                  <span className="font-medium text-gray-900 truncate">{typeof item.name === 'string' ? item.name : 'Unknown'}</span>
                  <ExternalLink className="h-3 w-3 ml-auto text-gray-400" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

// Helper component for Portfolio links
function ExternalLink({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
      <polyline points="15 3 21 3 21 9"></polyline>
      <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
  );
}
