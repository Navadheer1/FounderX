'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { MessageSquare, EyeOff, Send, Check } from 'lucide-react';
import { format } from 'date-fns';

export default function InboxPage() {
  const [inbox, setInbox] = useState({ user: [], startups: [] });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    if (user) {
      fetchInbox();
    }
  }, [user]);

  const fetchInbox = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/questions/inbox/all', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          setInbox(data.data);
        }
      } else if (res.ok) {
        setInbox({ user: [], startups: [] });
      } else {
        throw new Error('Server returned non-JSON response');
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load inbox', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (id, answer) => {
    try {
      const res = await fetch(`http://localhost:5000/api/questions/${id}/answer`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ answer })
      });
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          addToast('Question answered and published!', 'success');
          fetchInbox();
        } else {
          addToast(data.error || 'Failed to submit answer', 'error');
        }
      } else if (res.ok) {
        addToast('Question answered and published!', 'success');
        fetchInbox();
      } else {
        throw new Error('Server returned non-JSON response');
      }
    } catch (err) {
      addToast('Failed to submit answer', 'error');
    }
  };

  const handleHide = async (id) => {
    if (!confirm('Are you sure you want to hide this question? It will disappear from your inbox.')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/questions/${id}/hide`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          addToast('Question hidden', 'success');
          fetchInbox();
        } else {
          addToast(data.error || 'Failed to hide question', 'error');
        }
      } else if (res.ok) {
        addToast('Question hidden', 'success');
        fetchInbox();
      } else {
        throw new Error('Server returned non-JSON response');
      }
    } catch (err) {
      addToast('Failed to hide question', 'error');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Q&A Inbox</h1>
          
        <div className="grid gap-8">
            {/* Personal Questions */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Personal Questions ({inbox.user.length})
              </h2>
              {inbox.user.length === 0 ? (
                <div className="p-8 bg-white rounded-xl border border-gray-200 text-center text-gray-500">
                  No new questions for you.
                </div>
              ) : (
                <div className="space-y-4">
                  {inbox.user.map(q => (
                    <InboxItem key={q._id} question={q} onAnswer={handleAnswer} onHide={handleHide} />
                  ))}
                </div>
              )}
            </section>

            {/* Startup Questions */}
            {inbox.startups.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Startup Questions ({inbox.startups.length})
                </h2>
                <div className="space-y-4">
                  {inbox.startups.map(q => (
                    <InboxItem key={q._id} question={q} onAnswer={handleAnswer} onHide={handleHide} isStartup />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
  );
}

function InboxItem({ question, onAnswer, onHide, isStartup }) {
  const [answer, setAnswer] = useState('');
  const [answering, setAnswering] = useState(false);

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
            {isStartup ? 'For Your Startup' : 'For You'} • {format(new Date(question.createdAt), 'MMM d')}
          </span>
          <p className="text-lg font-medium text-gray-900 mt-1">{question.content}</p>
        </div>
        <button 
          onClick={() => onHide(question._id)}
          className="text-gray-400 hover:text-red-500 transition"
          title="Hide/Delete"
        >
          <EyeOff className="h-4 w-4" />
        </button>
      </div>

      {answering ? (
        <div className="mt-4">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-2"
            placeholder="Write your public answer..."
            rows={3}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setAnswering(false)}
              className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              onClick={() => onAnswer(question._id, answer)}
              className="px-4 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
            >
              <Send className="h-3 w-3" />
              Publish Answer
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAnswering(true)}
          className="mt-2 text-sm text-blue-600 font-medium hover:underline"
        >
          Answer Publicly
        </button>
      )}
    </div>
  );
}
