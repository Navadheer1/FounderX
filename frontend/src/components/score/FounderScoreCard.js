'use client';

import { TrendingUp, Award, Zap, ChevronRight } from 'lucide-react';

export default function FounderScoreCard({ score = 0, tips = [] }) {
  // Determine level/color based on score
  let color = 'text-gray-600';
  let bg = 'bg-gray-100';
  let label = 'Beginner';

  if (score >= 80) {
    color = 'text-purple-600';
    bg = 'bg-purple-100';
    label = 'Legendary';
  } else if (score >= 60) {
    color = 'text-green-600';
    bg = 'bg-green-100';
    label = 'Expert';
  } else if (score >= 40) {
    color = 'text-blue-600';
    bg = 'bg-blue-100';
    label = 'Rising Star';
  }

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-500" />
          Founder Score
        </h3>
        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${bg} ${color}`}>
          {label}
        </span>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-6">
          {/* Circular Progress */}
          <div className="relative h-24 w-24 flex items-center justify-center">
            <svg className="transform -rotate-90 w-24 h-24">
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-100"
              />
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className={color}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className={`text-2xl font-bold ${color}`}>{score}</span>
              <span className="text-[10px] text-gray-400 uppercase font-bold">Points</span>
            </div>
          </div>

          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-2">
              Your score reflects your profile quality and community impact.
            </p>
            <div className="text-xs text-gray-400">
              Top 10% of founders have a score of 80+
            </div>
          </div>
        </div>

        {tips.length > 0 && (
          <div className="mt-6">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Ways to Improve
            </h4>
            <div className="space-y-2">
              {tips.slice(0, 3).map((tip, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 text-sm text-gray-700 hover:bg-gray-100 transition cursor-pointer">
                  <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  <span>{tip}</span>
                  <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
