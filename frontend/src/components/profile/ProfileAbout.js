'use client';

import { Lightbulb, BookOpen, Quote } from 'lucide-react';

export default function ProfileAbout({ about, vision, story }) {
  if (!about && !vision && !story) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 space-y-8">
      
      {/* Vision */}
      {vision && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
            Vision
          </h3>
          <div className="bg-yellow-50 p-4 rounded-xl text-gray-800 italic border border-yellow-100">
            "{vision}"
          </div>
        </div>
      )}

      {/* About / Summary */}
      {about && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <Quote className="h-5 w-5 mr-2 text-gray-400" />
            Summary
          </h3>
          <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {typeof about === 'string' ? about : ''}
          </div>
        </div>
      )}

      {/* Story */}
      {story && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-blue-500" />
            My Story
          </h3>
          <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {story}
          </div>
        </div>
      )}
    </div>
  );
}
