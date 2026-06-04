'use client';

import Link from 'next/link';
import { ExternalLink, Play, Users, TrendingUp } from 'lucide-react';

export default function StartupCard({ startup }) {
  if (!startup) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all duration-300 group overflow-hidden flex flex-col h-full">
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
              {startup.logo ? (
                <img src={startup.logo} alt={startup.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-gray-400 font-bold text-lg">
                  {startup.name?.[0]}
                </div>
              )}
            </div>
            <div>
              <h4 className="font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition">{startup.name}</h4>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                startup.stage === 'Revenue' ? 'bg-green-100 text-green-800' :
                startup.stage === 'MVP' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {startup.stage || 'Idea'}
              </span>
            </div>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {startup.oneLinePitch || startup.description || 'No description provided.'}
        </p>

        {startup.techStack && startup.techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {startup.techStack.slice(0, 3).map((tech, i) => (
              <span key={i} className="px-2 py-0.5 bg-gray-50 text-gray-600 text-xs rounded border border-gray-100">
                {tech}
              </span>
            ))}
            {startup.techStack.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-50 text-gray-500 text-xs rounded border border-gray-100">
                +{startup.techStack.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between">
        <div className="flex space-x-4 text-xs text-gray-500">
          {startup.metrics?.users > 0 && (
            <div className="flex items-center" title="Users">
              <Users className="h-3.5 w-3.5 mr-1" />
              {startup.metrics.users.toLocaleString()}
            </div>
          )}
          {startup.metrics?.growthRate > 0 && (
            <div className="flex items-center text-green-600" title="Growth Rate">
              <TrendingUp className="h-3.5 w-3.5 mr-1" />
              {startup.metrics.growthRate}%
            </div>
          )}
        </div>

        <div className="flex space-x-2 items-center">
          {startup.pitchVideo && (
            <a 
              href={startup.pitchVideo} 
              target="_blank" 
              rel="noreferrer"
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-white rounded-md transition"
              title="Watch Pitch"
            >
              <Play className="h-4 w-4" />
            </a>
          )}
          <Link 
            href={`/startups/${startup._id}`}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-white rounded-md transition"
            title="View Details"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
