'use client';

import { Briefcase, GraduationCap, Calendar, Plus, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function ExperienceTimeline({ experience, isOwner, onEdit }) {
  // Sort experience by date (newest first)
  const sortedExperience = [...(experience || [])].sort((a, b) => {
    return new Date(b.startDate) - new Date(a.startDate);
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          <Briefcase className="h-5 w-5 mr-2 text-gray-500" />
          Experience
        </h3>
        {isOwner && (
          <button 
            onClick={() => onEdit && onEdit('experience')}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition"
          >
            <Plus className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="relative border-l-2 border-gray-100 ml-3 space-y-8 pl-8 py-2">
        {sortedExperience.length > 0 ? (
          sortedExperience.map((item, index) => (
            <div key={index} className="relative">
              {/* Dot */}
              <div className={`absolute -left-[41px] h-5 w-5 rounded-full border-4 border-white ${
                item.type === 'education' ? 'bg-green-500' : 'bg-blue-500'
              }`} />
              
              <div className="flex justify-between items-start group">
                <div>
                  <h4 className="text-lg font-bold text-gray-900">{item.title}</h4>
                  <div className="text-gray-600 font-medium mb-1">{item.company}</div>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>
                      {format(new Date(item.startDate), 'MMM yyyy')} - {item.current ? 'Present' : (item.endDate ? format(new Date(item.endDate), 'MMM yyyy') : '')}
                    </span>
                    {item.location && (
                      <>
                        <span className="mx-2">•</span>
                        <span>{item.location}</span>
                      </>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-gray-600 text-sm whitespace-pre-wrap mt-2">{item.description}</p>
                  )}
                </div>
                
                {isOwner && (
                  <button 
                    onClick={() => onEdit && onEdit('edit-experience', item)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-blue-600 transition"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-500 italic">No experience listed yet.</div>
        )}
      </div>
    </div>
  );
}
