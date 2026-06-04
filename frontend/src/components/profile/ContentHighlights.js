'use client';

import { useState } from 'react';
import PostCard from '../PostCard';
import { FileText, Video, PlayCircle, Grid } from 'lucide-react';

export default function ContentHighlights({ posts, videos, vtweets }) {
  const [activeTab, setActiveTab] = useState('all');

  const allContent = [
    ...(posts || []).map(p => ({ ...p, type: 'post' })),
    ...(videos || []).map(v => ({ ...v, type: 'video' })),
    ...(vtweets || []).map(v => ({ ...v, type: 'vtweet' }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const filteredContent = activeTab === 'all' 
    ? allContent 
    : allContent.filter(item => item.type === activeTab || (activeTab === 'video' && item.contentType === 'video'));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Content Highlights</h3>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-100 overflow-x-auto pb-1">
        <TabButton 
          active={activeTab === 'all'} 
          onClick={() => setActiveTab('all')} 
          icon={<Grid className="h-4 w-4" />}
          label="All"
        />
        <TabButton 
          active={activeTab === 'post'} 
          onClick={() => setActiveTab('post')} 
          icon={<FileText className="h-4 w-4" />}
          label="Posts"
        />
        <TabButton 
          active={activeTab === 'vtweet'} 
          onClick={() => setActiveTab('vtweet')} 
          icon={<PlayCircle className="h-4 w-4" />}
          label="Vtweets"
        />
        <TabButton 
          active={activeTab === 'video'} 
          onClick={() => setActiveTab('video')} 
          icon={<Video className="h-4 w-4" />}
          label="Videos"
        />
      </div>

      {/* Content Grid */}
      <div className="space-y-6">
        {filteredContent.length > 0 ? (
          filteredContent.map((item) => (
            <PostCard key={item._id} post={item} />
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
            <p className="text-gray-500">No content to show yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
        active 
          ? 'bg-gray-900 text-white' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <span className="mr-2">{icon}</span>
      {label}
    </button>
  );
}
