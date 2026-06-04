'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { Bell, Heart, MessageCircle, Repeat, UserPlus, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    } else if (user) {
      fetchNotifications();
    }
  }, [user, loading, router]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/notifications/read-all', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
         // Optionally parse if needed, but we just check ok
         // const data = await res.json();
         setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      } else if (res.ok) {
        // If ok but not json (e.g. 204 or empty), still success
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      setNotifications(prev => prev.map(n => n._id === id ? ({ ...n, isRead: true }) : n));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'like': return <Heart className="w-5 h-5 text-red-500 fill-current" />;
      case 'repost': return <Repeat className="w-5 h-5 text-green-500" />;
      case 'reply':
      case 'mention': return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'follow': return <UserPlus className="w-5 h-5 text-purple-500" />;
      case 'investor_interest': return <Bell className="w-5 h-5 text-yellow-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getLink = (notification) => {
    switch (notification.type) {
      case 'follow': return `/profile/${notification.sender._id}`;
      case 'post': 
      case 'like':
      case 'repost':
      case 'reply':
      case 'mention':
        return `/post/${notification.entityId?._id || notification.entityId}`; // Handle populated or ID
      default: return '#';
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto pt-20 px-4">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-white rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-20 pb-10 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {notifications.some(n => !n.isRead) && (
              <button 
                onClick={markAllAsRead}
                className="text-sm text-primary hover:text-blue-700 font-medium flex items-center"
              >
                <Check className="w-4 h-4 mr-1" /> Mark all as read
              </button>
            )}
          </div>

          <div className="space-y-2">
            {notifications.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-gray-100">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <Link 
                  href={getLink(notification)} 
                  key={notification._id}
                  onClick={() => !notification.isRead && markAsRead(notification._id)}
                  className={`block bg-white p-4 rounded-xl border transition-colors ${
                    !notification.isRead ? 'border-blue-100 bg-blue-50/30' : 'border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <img 
                          src={notification.sender.profileImage || 'https://via.placeholder.com/40'} 
                          alt={notification.sender.name}
                          className="w-8 h-8 rounded-full object-cover" 
                        />
                        <span className="font-semibold text-gray-900">{notification.sender.name}</span>
                        <span className="text-gray-500 text-sm">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-gray-600">
                        {notification.type === 'follow' && 'followed you'}
                        {notification.type === 'like' && 'liked your post'}
                        {notification.type === 'repost' && 'reposted your post'}
                        {notification.type === 'reply' && `replied: "${notification.content}"`}
                        {notification.type === 'mention' && `mentioned you: "${notification.content}"`}
                        {notification.type === 'investor_interest' && 'is interested in your startup'}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
