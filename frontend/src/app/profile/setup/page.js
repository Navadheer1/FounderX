'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import Navbar from '../../../components/Navbar';
import { Sparkles, MapPin, Briefcase, Plus, X, ArrowRight, Loader, CheckCircle2 } from 'lucide-react';

export default function ProfileSetupPage() {
  const { user, setUser, token, loading, refreshUser } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    bio: '',
    location: '',
    currentRole: '',
    industry: '',
    skills: '',
    website: '',
    linkedin: '',
    twitter: ''
  });

  // Verify auth
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const parseLocation = (str) => {
    if (!str) return {};
    const parts = str.split(',').map(s => s.trim());
    if (parts.length === 1) return { city: parts[0], country: '' };
    if (parts.length >= 2) return { city: parts[0], country: parts[parts.length - 1] };
    return { city: str, country: '' };
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);
      
      const payload = {
        bio: formData.bio,
        about: formData.bio, // default about to bio initially
        location: parseLocation(formData.location),
        currentRole: formData.currentRole,
        industry: formData.industry,
        skills: skillsArray,
        socialLinks: {
          website: formData.website,
          linkedin: formData.linkedin,
          twitter: formData.twitter
        }
      };

      const res = await fetch('http://localhost:5000/api/users/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.success) {
        const updatedUser = data.user || data.data;

        // Update localStorage & AuthContext
        if (typeof window !== 'undefined') {
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
        setUser(updatedUser);

        // Refresh user
        await refreshUser();

        // Re-fetch profile from backend GET /api/users/me
        const meRes = await fetch('http://localhost:5000/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        let finalUser = updatedUser;
        if (meRes.ok) {
          finalUser = await meRes.json();
          if (typeof window !== 'undefined') {
            localStorage.setItem("user", JSON.stringify(finalUser));
          }
          setUser(finalUser);
        }

        // Debug checks temporarily as requested
        console.log('--- DEBUG PROFILE SAVE (SETUP) ---');
        console.log('updatedUser:', finalUser);
        console.log('updatedUser.isProfileComplete:', finalUser?.isProfileComplete);
        console.log('updatedUser.bio:', finalUser?.bio);
        console.log('updatedUser.location:', finalUser?.location);
        console.log('--------------------------');

        addToast('Profile setup complete! Welcome to FounderX!', 'success');
        router.push('/profile');
      } else {
        addToast(data.error || 'Failed to complete profile setup', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error during profile setup', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans relative overflow-hidden flex flex-col justify-between">
      {/* Glow Orbs */}
      <div className="absolute top-[20%] left-[-10%] w-[30rem] h-[30rem] rounded-full bg-blue-600/[0.03] blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[20%] right-[-10%] w-[30rem] h-[30rem] rounded-full bg-purple-600/[0.03] blur-[100px] pointer-events-none" />

      <Navbar />

      <main className="max-w-md w-full mx-auto px-4 pt-32 flex-1 flex flex-col justify-center relative z-10">
        
        {/* Wizard Card container */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-[0_15px_40px_rgba(15,23,42,0.04)] space-y-6">
          
          {/* Header Progress Indicators */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 animate-spin" style={{ animationDuration: '4s' }} />
              Step {step} of 3
            </span>
            <div className="flex gap-1.5">
              {[1, 2, 3].map(s => (
                <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? 'w-6 bg-blue-600' : 'w-2 bg-slate-200'}`} />
              ))}
            </div>
          </div>

          {/* STEP 1: BASICS */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h1 className="text-2xl font-black text-slate-900">Let&apos;s craft your bio</h1>
                <p className="text-slate-500 text-xs font-semibold">Introduce yourself to the FounderX community</p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">Headline / Short Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="e.g. Building Nexus AI to change early-stage fundraising | Tech enthusiast"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-650/10 focus:border-blue-600 transition text-sm text-slate-900 resize-none h-24"
                    maxLength={160}
                  />
                  <div className="text-right text-[10px] font-semibold text-slate-400 mt-1">
                    {formData.bio.length} / 160 chars
                  </div>
                </div>

                <Input 
                  label="Where are you based?" 
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. San Francisco, USA"
                  icon={<MapPin className="h-4 w-4 text-slate-400" />}
                />
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!formData.bio.trim() || !formData.location.trim()}
                className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-1.5"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: PROFESSIONAL */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h1 className="text-2xl font-black text-slate-900">Professional details</h1>
                <p className="text-slate-500 text-xs font-semibold">Help other startup members discover your skills</p>
              </div>

              <div className="space-y-4 pt-2">
                <Input 
                  label="What is your current role?" 
                  value={formData.currentRole}
                  onChange={e => setFormData({ ...formData, currentRole: e.target.value })}
                  placeholder="e.g. CEO & Co-founder"
                  icon={<Briefcase className="h-4 w-4 text-slate-400" />}
                />

                <Input 
                  label="What industry are you in?" 
                  value={formData.industry}
                  onChange={e => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="e.g. Artificial Intelligence, SaaS"
                />

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">What are your skills?</label>
                  <input
                    type="text"
                    value={formData.skills}
                    onChange={e => setFormData({ ...formData, skills: e.target.value })}
                    placeholder="e.g. React, Node.js, Fundraising (comma separated)"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-650/10 focus:border-blue-600 transition text-sm text-slate-900"
                  />
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">Separate skills with commas</p>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-xl transition"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!formData.currentRole.trim() || !formData.industry.trim() || !formData.skills.trim()}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-1.5"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SOCIALS & FINISH */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h1 className="text-2xl font-black text-slate-900">Connect your networks</h1>
                <p className="text-slate-500 text-xs font-semibold">Make it easy for investors and partners to reach you</p>
              </div>

              <div className="space-y-4 pt-2">
                <Input 
                  label="LinkedIn URL" 
                  value={formData.linkedin}
                  onChange={e => setFormData({ ...formData, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/username"
                />

                <Input 
                  label="Twitter / X URL" 
                  value={formData.twitter}
                  onChange={e => setFormData({ ...formData, twitter: e.target.value })}
                  placeholder="https://twitter.com/username"
                />

                <Input 
                  label="Personal Website" 
                  value={formData.website}
                  onChange={e => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setStep(2)}
                  disabled={saving}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-xl transition"
                >
                  Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={saving}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-1.5"
                >
                  {saving ? <Loader className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  <span>{saving ? 'Finishing...' : 'Complete Setup'}</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer Branding */}
      <footer className="text-center py-6 text-[10px] font-black tracking-widest text-slate-400 uppercase">
        FounderX Network © 2026
      </footer>

    </div>
  );
}

function Input({ label, icon, ...props }) {
  return (
    <div>
      <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">{label}</label>
      <div className="relative">
        <input 
          className={`w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-650/10 focus:border-blue-650 transition text-sm text-slate-900 ${icon ? 'pl-10' : ''}`}
          {...props}
        />
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
