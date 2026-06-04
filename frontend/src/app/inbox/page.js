'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  MessageSquare, 
  EyeOff, 
  Send, 
  Check, 
  Briefcase, 
  DollarSign, 
  Users, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  Loader,
  Calendar,
  MapPin,
  Clock,
  UserPlus,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function InboxPage() {
  const [inbox, setInbox] = useState({ user: [], startups: [] });
  const [applications, setApplications] = useState([]);
  const [investorRequests, setInvestorRequests] = useState([]);
  const [teamRequests, setTeamRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('messages');
  const [loading, setLoading] = useState(true);
  const [startups, setStartups] = useState([]);
  const [startupRequests, setStartupRequests] = useState([]);
  
  // Hire Modal State
  const [hireModalOpen, setHireModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [hireForm, setHireForm] = useState({
    teamRole: 'Developer',
    customRole: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    workMode: 'Remote',
    notes: ''
  });
  const [hiring, setHiring] = useState(false);

  const { user, token } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    if (user && token) {
      fetchInitialData();
    }
  }, [user, token]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch startups owned by founder to load investor requests
      const startupsRes = await fetch('http://localhost:5000/api/dashboard/founder', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const startupsData = await startupsRes.json();
      let startupsList = [];
      if (startupsData.success && startupsData.data?.startups) {
        startupsList = startupsData.data.startups;
        setStartups(startupsList);
      }

      // 2. Fetch Q&A Inbox
      await fetchQAndA();

      // 3. Fetch Job Applications
      await fetchJobApplications();

      // 4. Fetch Investor Requests
      if (startupsList.length > 0) {
        await fetchInvestorRequests(startupsList);
      }

      // 5. Fetch Team Requests
      await fetchTeamInvitations();

      // 6. Fetch Startup Custom Role Requests
      await fetchStartupRequests();

    } catch (err) {
      console.error('Error loading inbox data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQAndA = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/questions/inbox/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setInbox(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchJobApplications = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/founder/applications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setApplications(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInvestorRequests = async (startupsList) => {
    try {
      const allReqs = [];
      for (const s of startupsList) {
        const res = await fetch(`http://localhost:5000/api/startups/${s._id}/investment-requests`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && json.data) {
          allReqs.push(...json.data);
        }
      }
      setInvestorRequests(allReqs);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeamInvitations = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/team-invitations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTeamRequests(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStartupRequests = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/founder/role-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStartupRequests(data.data);
      }
    } catch (err) {
      console.error('Error fetching role requests:', err);
    }
  };

  const handleRoleRequestConnect = async (reqId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/founder/role-requests/${reqId}/connect`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        addToast('Connected with applicant! Chat is now unlocked.', 'success');
        fetchStartupRequests();
      } else {
        addToast(data.error || 'Failed to connect', 'error');
      }
    } catch (err) {
      addToast('Error connecting with applicant', 'error');
    }
  };

  const handleRoleRequestStatusUpdate = async (reqId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/founder/role-requests/${reqId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Request status updated to ${newStatus}!`, 'success');
        fetchStartupRequests();
      } else {
        addToast(data.error || 'Failed to update status', 'error');
      }
    } catch (err) {
      addToast('Error updating status', 'error');
    }
  };

  // Q&A Handlers
  const handleAnswer = async (id, answer) => {
    try {
      const res = await fetch(`http://localhost:5000/api/questions/${id}/answer`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ answer })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Question answered and published!', 'success');
        fetchQAndA();
      } else {
        addToast(data.error || 'Failed to submit answer', 'error');
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
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        addToast('Question hidden', 'success');
        fetchQAndA();
      } else {
        addToast(data.error || 'Failed to hide question', 'error');
      }
    } catch (err) {
      addToast('Failed to hide question', 'error');
    }
  };

  // Job Application Handlers
  const handleViewApplication = async (appId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/founder/applications/${appId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        // Status becomes reviewed, refresh applications to show correct status
        fetchJobApplications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConnect = async (appId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/founder/applications/${appId}/connect`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        addToast('Connected with applicant! Chat is now unlocked.', 'success');
        fetchJobApplications();
      } else {
        addToast(data.error || 'Failed to connect', 'error');
      }
    } catch (err) {
      addToast('Error connecting with applicant', 'error');
    }
  };

  const handleStatusUpdate = async (appId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/founder/applications/${appId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Application status updated to ${newStatus}!`, 'success');
        fetchJobApplications();
      } else {
        addToast(data.error || 'Failed to update status', 'error');
      }
    } catch (err) {
      addToast('Error updating status', 'error');
    }
  };

  // Investor Request Handlers
  const handleInvestorStatusUpdate = async (reqId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/startups/investment-requests/${reqId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Investment interest request ${newStatus}!`, 'success');
        if (startups.length > 0) fetchInvestorRequests(startups);
      } else {
        addToast(data.error || 'Failed to update interest request', 'error');
      }
    } catch (err) {
      addToast('Error updating interest request', 'error');
    }
  };

  // Team Request Handlers
  const handleTeamInvitationStatus = async (inviteId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/team-invitations/${inviteId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Invitation ${newStatus}!`, 'success');
        fetchTeamInvitations();
      } else {
        addToast(data.error || 'Failed to update invitation status', 'error');
      }
    } catch (err) {
      addToast('Error updating invitation status', 'error');
    }
  };

  // Hire Form Submit
  const handleHireSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;
    setHiring(true);
    try {
      const role = hireForm.teamRole === 'Custom' ? hireForm.customRole : hireForm.teamRole;
      const isRoleRequest = selectedApp.requestType !== undefined;
      const endpoint = isRoleRequest 
        ? `http://localhost:5000/api/founder/role-requests/${selectedApp._id}/hire`
        : `http://localhost:5000/api/founder/applications/${selectedApp._id}/hire`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          teamRole: role,
          startDate: hireForm.startDate,
          workMode: hireForm.workMode,
          notes: hireForm.notes
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Applicant successfully hired and added to the startup team!', 'success');
        setHireModalOpen(false);
        if (isRoleRequest) {
          fetchStartupRequests();
        } else {
          fetchJobApplications();
        }
      } else {
        addToast(data.error || 'Failed to hire applicant', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error hiring applicant', 'error');
    } finally {
      setHiring(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'reviewed': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'shortlisted': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'connected': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'accepted': return 'bg-green-50 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
      case 'hired': return 'bg-emerald-500 text-white border-emerald-500';
      case 'withdrawn': return 'bg-gray-100 text-gray-500 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex justify-center items-center">
          <Loader className="animate-spin h-8 w-8 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8 pt-24">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 font-sans">Mission Inbox</h1>

        {/* Tab navigation */}
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto scrollbar-none gap-2">
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'messages'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Messages ({inbox.user.length + inbox.startups.length})
          </button>
          
          <button
            onClick={() => setActiveTab('job_applications')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'job_applications'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            Job Applications ({applications.length})
          </button>

          <button
            onClick={() => setActiveTab('investor_requests')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'investor_requests'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <DollarSign className="h-4 w-4" />
            Investor Requests ({investorRequests.length})
          </button>

          <button
            onClick={() => setActiveTab('team_requests')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'team_requests'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="h-4 w-4" />
            Team Requests ({teamRequests.length})
          </button>

          <button
            onClick={() => setActiveTab('startup_requests')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === 'startup_requests'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Startup Requests ({startupRequests.length})
          </button>
        </div>

        {/* Tab contents */}
        <div className="space-y-6">
          {activeTab === 'messages' && (
            <div className="grid gap-8">
              {/* Personal Questions */}
              <section>
                <h2 className="text-lg font-semibold text-gray-850 mb-4 flex items-center gap-2 font-sans">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Personal Questions ({inbox.user.length})
                </h2>
                {inbox.user.length === 0 ? (
                  <div className="p-8 bg-white rounded-2xl border border-gray-200 text-center text-gray-500">
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
                  <h2 className="text-lg font-semibold text-gray-850 mb-4 flex items-center gap-2 font-sans">
                    <MessageSquare className="h-5 w-5 text-primary" />
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
          )}

          {activeTab === 'job_applications' && (
            <div className="space-y-4">
              {applications.length === 0 ? (
                <div className="p-10 bg-white rounded-2xl border border-gray-200 text-center text-gray-500">
                  <Briefcase className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                  <p className="font-semibold text-gray-700">No Job Applications yet</p>
                  <p className="text-sm text-gray-400 mt-1">Once job seekers apply for your startup roles, they will appear here.</p>
                </div>
              ) : (
                applications.map((app) => (
                  <div key={app._id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-start gap-6 hover:shadow-md transition">
                    <div className="flex-1 space-y-4">
                      {/* Top Meta info */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                        <div>
                          <span className="text-xs text-muted block">
                            Applied on {format(new Date(app.createdAt), 'MMM d, yyyy')}
                          </span>
                          <h3 className="text-lg font-bold text-gray-900 font-sans mt-0.5">
                            {app.applicantId?.fullName || app.applicantId?.name || 'Applicant'}
                          </h3>
                          <p className="text-sm font-medium text-primary">
                            Applied for <span className="underline">{app.jobId?.title || 'Job Opening'}</span> at {app.startupId?.name}
                          </p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider ${getStatusColor(app.status)}`}>
                          {app.status}
                        </span>
                      </div>

                      {/* Detail fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
                        <div>
                          <p className="font-semibold text-gray-500 text-xs uppercase">Required Skills</p>
                          <p className="mt-1 flex flex-wrap gap-1">
                            {app.jobId?.requiredSkills && app.jobId.requiredSkills.length > 0 ? (
                              app.jobId.requiredSkills.map((sk, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-700 font-medium">
                                  {sk}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-muted">No specific skills listed</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500 text-xs uppercase">Expected Salary/Stipend</p>
                          <p className="mt-1 font-semibold text-slate-900">{app.expectedSalary || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500 text-xs uppercase">Availability Date</p>
                          <p className="mt-1 text-slate-800 flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            {app.availabilityDate ? format(new Date(app.availabilityDate), 'MMM d, yyyy') : 'Immediate'}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500 text-xs uppercase">Social / Portfolio Links</p>
                          <div className="mt-1 flex flex-wrap gap-3">
                            {app.portfolioLink && (
                              <a href={app.portfolioLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-0.5">
                                Portfolio <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {app.github && (
                              <a href={app.github} target="_blank" rel="noopener noreferrer" className="text-slate-800 hover:underline text-xs flex items-center gap-0.5">
                                GitHub <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {app.linkedin && (
                              <a href={app.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs flex items-center gap-0.5">
                                LinkedIn <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {!app.portfolioLink && !app.github && !app.linkedin && (
                              <span className="text-xs text-muted">No links provided</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Why Join & Cover letter */}
                      <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100 text-sm">
                        {app.reasonToJoin && (
                          <div>
                            <p className="font-bold text-slate-800 text-xs uppercase tracking-wider">Why do you want to join Nexus AI?</p>
                            <p className="text-slate-700 mt-1 italic font-sans leading-relaxed">"{app.reasonToJoin}"</p>
                          </div>
                        )}
                        {app.coverLetter && (
                          <div className={app.reasonToJoin ? 'pt-2 border-t border-slate-200 mt-2' : ''}>
                            <p className="font-bold text-slate-800 text-xs uppercase tracking-wider">Cover Letter / Message</p>
                            <p className="text-slate-700 mt-1 whitespace-pre-line leading-relaxed">{app.coverLetter}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right / Bottom Action column */}
                    <div className="flex flex-row md:flex-col gap-2 flex-wrap min-w-[160px] md:border-l md:pl-6 border-gray-150 pt-4 md:pt-0">
                      <Link 
                        href={`/profile/${app.applicantId?.username || app.applicantId?._id}`}
                        onClick={() => handleViewApplication(app._id)}
                        className="btn-secondary text-xs text-center w-full py-2.5 font-bold flex items-center justify-center gap-1"
                      >
                        View Profile
                      </Link>

                      {app.resume && app.resume.startsWith('http') ? (
                        <a
                          href={app.resume}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleViewApplication(app._id)}
                          className="btn-secondary text-xs text-center w-full py-2.5 font-bold flex items-center justify-center gap-1"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          View Resume
                        </a>
                      ) : (
                        <button
                          onClick={() => {
                            handleViewApplication(app._id);
                            alert(`Resume Info: ${app.resume}`);
                          }}
                          className="btn-secondary text-xs text-center w-full py-2.5 font-bold flex items-center justify-center gap-1"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          View Resume Info
                        </button>
                      )}

                      {app.status === 'pending' && (
                        <button
                          onClick={() => handleConnect(app._id)}
                          className="px-4 py-2 text-xs bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-all font-bold shadow-sm"
                        >
                          Connect
                        </button>
                      )}

                      {['pending', 'reviewed', 'shortlisted', 'connected'].includes(app.status) && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(app._id, 'accepted')}
                            className="px-4 py-2 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all font-bold shadow-sm flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Accept
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(app._id, 'rejected')}
                            className="px-4 py-2 text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-all font-bold shadow-sm flex items-center justify-center gap-1"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </>
                      )}

                      {['connected', 'accepted', 'hired'].includes(app.status) && (
                        <Link
                          href={`/messages?userId=${app.applicantId?._id}`}
                          className="px-4 py-2 text-xs bg-primary hover:bg-blue-600 text-white rounded-lg text-center transition-all font-bold shadow-sm flex items-center justify-center gap-1"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          Message
                        </Link>
                      )}

                      {['accepted', 'connected'].includes(app.status) && (
                        <button
                          onClick={() => {
                            setSelectedApp(app);
                            setHireModalOpen(true);
                          }}
                          className="px-4 py-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all font-bold shadow-sm flex items-center justify-center gap-1 mt-2"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          Hire / Add to Team
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'investor_requests' && (
            <div className="space-y-4">
              {investorRequests.length === 0 ? (
                <div className="p-10 bg-white rounded-2xl border border-gray-200 text-center text-gray-500">
                  <DollarSign className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                  <p className="font-semibold text-gray-700">No Investor Requests yet</p>
                  <p className="text-sm text-gray-400 mt-1">Investment interest requests from interested investors will appear here.</p>
                </div>
              ) : (
                investorRequests.map((req) => (
                  <div key={req._id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-start gap-6 hover:shadow-md transition">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between border-b pb-3">
                        <div>
                          <h3 className="font-bold text-gray-900 text-base">{req.investorId?.name || 'Investor'}</h3>
                          <p className="text-xs text-muted">Sent on {format(new Date(req.createdAt), 'MMM d, yyyy')}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${
                          req.status === 'accepted' ? 'bg-green-50 text-green-700 border-green-200' :
                          req.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">
                        <span className="font-semibold text-slate-900 block text-xs uppercase text-gray-400">Message</span>
                        "{req.message || 'No message provided.'}"
                      </p>
                      {req.investmentRange && (
                        <p className="text-sm text-slate-800 font-bold">
                          Estimated Ticket Size: {req.investmentRange}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-row md:flex-col gap-2 min-w-[150px] md:border-l md:pl-6 border-gray-150 pt-4 md:pt-0">
                      {req.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleInvestorStatusUpdate(req._id, 'accepted')}
                            className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all font-bold shadow-sm"
                          >
                            Accept Interest
                          </button>
                          <button
                            onClick={() => handleInvestorStatusUpdate(req._id, 'rejected')}
                            className="px-3 py-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-all font-bold"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      
                      {req.status === 'accepted' && (
                        <Link
                          href={`/messages?userId=${req.investorId?._id}`}
                          className="px-3 py-1.5 text-xs bg-primary hover:bg-blue-600 text-white text-center rounded-lg transition-all font-bold"
                        >
                          Message Investor
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'team_requests' && (
            <div className="space-y-4">
              {teamRequests.length === 0 ? (
                <div className="p-10 bg-white rounded-2xl border border-gray-200 text-center text-gray-500">
                  <Users className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                  <p className="font-semibold text-gray-700">No Team Requests yet</p>
                  <p className="text-sm text-gray-400 mt-1">Pending and past invitations/requests to join startup teams will show up here.</p>
                </div>
              ) : (
                teamRequests.map((inv) => {
                  const isRecipient = inv.recipientId?._id === user._id;
                  const otherParty = isRecipient ? inv.senderId : inv.recipientId;
                  
                  return (
                    <div key={inv._id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                            {isRecipient ? 'Received Invitation' : 'Sent Invitation'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${
                            inv.status === 'accepted' ? 'bg-green-50 text-green-700 border-green-200' :
                            inv.status === 'declined' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}>
                            {inv.status}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-base mt-1 font-sans">
                          {isRecipient ? `${otherParty?.name} invited you to join ${inv.startupId?.name}` : `You invited ${otherParty?.name} to join ${inv.startupId?.name}`}
                        </h4>
                        <p className="text-xs text-muted mt-0.5">
                          Role: <span className="font-semibold text-slate-900">{inv.role}</span> • Sent on {format(new Date(inv.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>

                      {inv.status === 'pending' && isRecipient && (
                        <div className="flex gap-2 w-full md:w-auto">
                          <button
                            onClick={() => handleTeamInvitationStatus(inv._id, 'accepted')}
                            className="flex-1 md:flex-none px-4 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition shadow-sm"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleTeamInvitationStatus(inv._id, 'declined')}
                            className="flex-1 md:flex-none px-4 py-1.5 text-xs bg-red-50 hover:bg-red-150 text-red-650 rounded-lg font-bold border border-red-200 transition"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'startup_requests' && (
            <div className="space-y-4">
              {startupRequests.length === 0 ? (
                <div className="p-10 bg-white rounded-2xl border border-gray-200 text-center text-gray-500">
                  <Sparkles className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                  <p className="font-semibold text-gray-700">No Startup Requests yet</p>
                  <p className="text-sm text-gray-400 mt-1">Custom role requests from Job Seekers to join your startup will show up here.</p>
                </div>
              ) : (
                startupRequests.map((req) => (
                  <div key={req._id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4 hover:shadow-md transition">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            {req.requestType} Application
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getStatusColor(req.status)}`}>
                            {req.status}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-lg mt-1 font-sans">
                          {req.applicantId?.fullName || req.applicantId?.name || 'Applicant'} applied for <span className="text-primary">{req.roleTitle}</span>
                        </h4>
                        <p className="text-sm text-gray-500 font-medium mt-0.5">
                          Startup: {req.startupId?.name || 'Your Startup'}
                        </p>
                        <p className="text-xs text-muted mt-1">
                          Received on {format(new Date(req.createdAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        <Link 
                          href={`/profile/${req.applicantId?._id}`}
                          className="flex-1 md:flex-none px-4 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold border border-slate-200 text-center transition"
                        >
                          View Profile
                        </Link>
                        {req.status === 'pending' && (
                          <button
                            onClick={() => handleRoleRequestStatusUpdate(req._id, 'reviewed')}
                            className="flex-1 md:flex-none px-4 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold border border-blue-200 transition"
                          >
                            Mark Reviewed
                          </button>
                        )}
                        {(req.status === 'pending' || req.status === 'reviewed') && (
                          <button
                            onClick={() => handleRoleRequestConnect(req._id)}
                            className="flex-1 md:flex-none px-4 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold transition shadow-sm"
                          >
                            Connect
                          </button>
                        )}
                        {['pending', 'reviewed', 'connected'].includes(req.status) && (
                          <>
                            <button
                              onClick={() => handleRoleRequestStatusUpdate(req._id, 'accepted')}
                              className="flex-1 md:flex-none px-4 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition shadow-sm"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRoleRequestStatusUpdate(req._id, 'rejected')}
                              className="flex-1 md:flex-none px-4 py-1.5 text-xs bg-red-50 hover:bg-red-150 text-red-650 rounded-lg font-bold border border-red-200 transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {['connected', 'accepted'].includes(req.status) && (
                          <button
                            onClick={() => {
                              setSelectedApp(req);
                              setHireForm({
                                teamRole: req.roleTitle,
                                customRole: '',
                                startDate: format(new Date(), 'yyyy-MM-dd'),
                                workMode: 'Remote',
                                notes: ''
                              });
                              setHireModalOpen(true);
                            }}
                            className="flex-1 md:flex-none px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition shadow-sm"
                          >
                            Hire / Add to Team
                          </button>
                        )}
                        {['connected', 'accepted', 'hired'].includes(req.status) && (
                          <Link
                            href="/messages"
                            className="flex-1 md:flex-none px-4 py-1.5 text-xs bg-primary hover:bg-primary-dark text-white rounded-lg font-bold text-center transition shadow-sm"
                          >
                            Send Message
                          </Link>
                        )}
                      </div>
                    </div>

                    <hr className="border-gray-100" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 font-sans">
                      <div>
                        <p className="font-semibold text-slate-800 mb-1">Applicant Contact & Links:</p>
                        <div className="space-y-1 text-xs">
                          {req.resume && (
                            <a href={req.resume} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                              <FileText className="h-3 w-3" /> Resume Link
                            </a>
                          )}
                          {req.portfolioLink && (
                            <a href={req.portfolioLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                              <ExternalLink className="h-3 w-3" /> Portfolio Website
                            </a>
                          )}
                          {req.github && (
                            <a href={req.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                              <ExternalLink className="h-3 w-3" /> GitHub Profile
                            </a>
                          )}
                          {req.linkedin && (
                            <a href={req.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                              <ExternalLink className="h-3 w-3" /> LinkedIn Profile
                            </a>
                          )}
                          {!req.resume && !req.portfolioLink && !req.github && !req.linkedin && (
                            <span className="text-gray-400">No links provided</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="font-semibold text-slate-800 mb-1">Key Info:</p>
                        <p className="text-xs">
                          <strong>Skills:</strong> {req.skills?.length > 0 ? req.skills.join(', ') : 'None specified'}
                        </p>
                        {req.expectedSalary && (
                          <p className="text-xs mt-1">
                            <strong>Expected Stipend/Salary:</strong> {req.expectedSalary}
                          </p>
                        )}
                        {req.availabilityDate && (
                          <p className="text-xs mt-1">
                            <strong>Availability Date:</strong> {format(new Date(req.availabilityDate), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                    </div>

                    {req.message && (
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs font-sans">
                        <p className="font-semibold text-slate-700 mb-1">Message to Founder:</p>
                        <p className="text-muted italic">"{req.message}"</p>
                      </div>
                    )}

                    {req.reasonToJoin && (
                      <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100/50 text-xs font-sans">
                        <p className="font-semibold text-blue-800 mb-1">Why do you want to join?</p>
                        <p className="text-muted">"{req.reasonToJoin}"</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hire Modal */}
      {hireModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-sans">Hire & Add to Startup Team</h3>
                <p className="text-xs text-muted mt-0.5">Applicant: {selectedApp.applicantId?.fullName || selectedApp.applicantId?.name}</p>
              </div>
              <button 
                onClick={() => setHireModalOpen(false)} 
                className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleHireSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider font-sans">Select Startup</label>
                <select
                  disabled
                  value={selectedApp.startupId?._id}
                  className="w-full p-2.5 border rounded-xl text-sm bg-slate-50 cursor-not-allowed font-medium text-slate-700"
                >
                  <option value={selectedApp.startupId?._id}>{selectedApp.startupId?.name}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider font-sans">Role in Team</label>
                  <select
                    value={hireForm.teamRole}
                    onChange={(e) => setHireForm({...hireForm, teamRole: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="Intern">Intern</option>
                    <option value="Employee">Employee</option>
                    <option value="Developer">Developer</option>
                    <option value="Designer">Designer</option>
                    <option value="Marketer">Marketer</option>
                    <option value="Co-founder">Co-founder</option>
                    <option value="Custom">Custom Role...</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider font-sans">Work Mode</label>
                  <select
                    value={hireForm.workMode}
                    onChange={(e) => setHireForm({...hireForm, workMode: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>
              </div>

              {hireForm.teamRole === 'Custom' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider font-sans">Custom Role Title</label>
                  <input
                    type="text"
                    required
                    value={hireForm.customRole}
                    onChange={(e) => setHireForm({...hireForm, customRole: e.target.value})}
                    placeholder="e.g. Chief Growth Officer, Frontend Engineer"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider font-sans">Start Date</label>
                <input
                  type="date"
                  required
                  value={hireForm.startDate}
                  onChange={(e) => setHireForm({...hireForm, startDate: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider font-sans">Notes / Offer description</label>
                <textarea
                  value={hireForm.notes}
                  onChange={(e) => setHireForm({...hireForm, notes: e.target.value})}
                  placeholder="Welcome to the team! Details on equipment, onboarding meetings etc."
                  rows={3}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setHireModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-bold text-slate-650 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={hiring}
                  className="px-5 py-2.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {hiring ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Hiring...
                    </>
                  ) : (
                    'Add to Startup Team'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InboxItem({ question, onAnswer, onHide, isStartup }) {
  const [answer, setAnswer] = useState('');
  const [answering, setAnswering] = useState(false);

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide font-sans">
            {isStartup ? 'For Your Startup' : 'For You'} • {format(new Date(question.createdAt), 'MMM d')}
          </span>
          <p className="text-base md:text-lg font-medium text-gray-900 mt-1 font-sans">{question.content}</p>
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
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 mb-2 text-sm"
            placeholder="Write your public answer..."
            rows={3}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setAnswering(false)}
              className="px-3 py-1.5 text-xs font-bold text-gray-650 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              onClick={() => onAnswer(question._id, answer)}
              className="px-4 py-1.5 text-xs font-bold bg-primary text-white rounded-xl hover:bg-blue-600 flex items-center gap-1 transition shadow-sm"
            >
              <Send className="h-3 w-3" />
              Publish Answer
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAnswering(true)}
          className="mt-2 text-sm text-primary font-bold hover:underline"
        >
          Answer Publicly
        </button>
      )}
    </div>
  );
}
