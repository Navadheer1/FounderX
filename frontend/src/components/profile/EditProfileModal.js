'use client';

import { useState, useRef } from 'react';
import { X, Camera, Upload, Plus, Trash2, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { uploadToCloudinary } from '../../utils/cloudinary';

export default function EditProfileModal({ user, onClose, onUpdate }) {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('basics');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(null); // 'avatar' or 'cover' or null
  
  // Form State
  const [formData, setFormData] = useState({
    name: user.name || '',
    tagline: user.tagline || '',
    bio: user.bio || '',
    about: user.about || '',
    vision: user.vision || '',
    story: user.story || '',
    location: typeof user.location === 'object' 
      ? `${user.location.city || ''}${user.location.city && user.location.country ? ', ' : ''}${user.location.country || ''}`
      : user.location || '',
    website: user.socialLinks?.website || user.website || '',
    linkedin: user.socialLinks?.linkedin || '',
    twitter: user.socialLinks?.twitter || '',
    github: user.socialLinks?.github || '',
    email: user.socialLinks?.email || '',
    currentRole: user.currentRole || '',
    industry: user.industry || '',
    skills: user.skills ? user.skills.join(', ') : '',
    lookingFor: user.lookingFor || [],
    roleProfileData: user.roleProfile || {},
    profileImage: user.profileImage,
    coverImage: user.coverImage,
    experience: user.experience || []
  });

  // Role specific form state handlers
  const handleRoleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      roleProfileData: {
        ...prev.roleProfileData,
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Parse skills string to array
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);
      
      const payload = {
        ...formData,
        skills: skillsArray,
        location: parseLocation(formData.location),
        socialLinks: {
          website: formData.website,
          linkedin: formData.linkedin,
          twitter: formData.twitter,
          github: formData.github,
          email: formData.email
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
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          onUpdate(data.data);
          onClose();
        } else {
          alert(data.error || 'Failed to update profile');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const parseLocation = (str) => {
    if (!str) return {};
    const parts = str.split(',').map(s => s.trim());
    if (parts.length === 1) return { city: parts[0], country: '' };
    if (parts.length >= 2) return { city: parts[0], country: parts[parts.length - 1] };
    return { city: str, country: '' };
  };

  // Image Upload Handlers
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const handleImageUpload = async (file, type) => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const endpoint = type === 'avatar' ? 'upload-avatar' : 'upload-cover';
      const res = await fetch(`http://localhost:5000/api/users/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          // Update local user state immediately via parent callback
          onUpdate(prev => ({ 
            ...prev, 
            [type === 'avatar' ? 'profileImage' : 'coverImage']: data.data 
          }));
        }
      }
    } catch (err) {
      console.error(err);
      alert('Image upload failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 overflow-x-auto">
          <TabButton active={activeTab === 'basics'} onClick={() => setActiveTab('basics')}>Basics</TabButton>
          <TabButton active={activeTab === 'portfolio'} onClick={() => setActiveTab('portfolio')}>Portfolio</TabButton>
          <TabButton active={activeTab === 'professional'} onClick={() => setActiveTab('professional')}>Professional</TabButton>
          <TabButton active={activeTab === 'experience'} onClick={() => setActiveTab('experience')}>Experience</TabButton>
          {user.role !== 'user' && (
             <TabButton active={activeTab === 'role'} onClick={() => setActiveTab('role')}>
               {user.role === 'founder' ? 'Startup' : 'Investor'} Info
             </TabButton>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-6">
            
            {activeTab === 'basics' && (
              <>
                {/* Images */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-gray-200 overflow-hidden">
                        {formData.profileImage ? (
                          <img src={formData.profileImage} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-400 font-bold">{formData.name?.[0]}</div>
                        )}
                      </div>
                      <button 
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition flex items-center gap-2"
                        disabled={uploadingImage === 'avatar'}
                      >
                        {uploadingImage === 'avatar' && <Loader className="h-4 w-4 animate-spin" />}
                        {uploadingImage === 'avatar' ? 'Uploading...' : 'Change Photo'}
                      </button>
                      <input 
                        ref={avatarInputRef}
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleImageUpload(e.target.files[0], 'avatar')}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cover Photo</label>
                    <div className="relative group rounded-xl overflow-hidden">
                      {formData.coverImage ? (
                        <>
                           <img src={formData.coverImage} alt="Cover" className="w-full h-32 object-cover" />
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                type="button"
                                onClick={() => coverInputRef.current?.click()}
                                className="text-white flex items-center gap-2 font-medium"
                              >
                                <Camera className="h-5 w-5" />
                                Change Cover
                              </button>
                           </div>
                        </>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => coverInputRef.current?.click()}
                          className="w-full h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-500 transition"
                        >
                          <Upload className="h-6 w-6 mb-2" />
                          <span className="text-sm font-medium">Click to upload cover image</span>
                        </button>
                      )}

                      {uploadingImage === 'cover' && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white z-10">
                          <Loader className="h-6 w-6 animate-spin mr-2" />
                          Uploading...
                        </div>
                      )}
                    </div>

                    <input 
                      ref={coverInputRef}
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleImageUpload(e.target.files[0], 'cover')}
                    />
                  </div>
                </div>

                <Input label="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <Input label="Headline / Bio" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} maxLength={160} />
                <Input label="Location (City, Country)" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                <Input label="Website" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} />
                
                <div className="grid grid-cols-2 gap-4">
                    <Input label="LinkedIn" value={formData.linkedin} onChange={e => setFormData({...formData, linkedin: e.target.value})} placeholder="https://linkedin.com/in/..." />
                    <Input label="Twitter (X)" value={formData.twitter} onChange={e => setFormData({...formData, twitter: e.target.value})} placeholder="https://twitter.com/..." />
                    <Input label="GitHub" value={formData.github} onChange={e => setFormData({...formData, github: e.target.value})} placeholder="https://github.com/..." />
                    <Input label="Email (Public)" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="contact@example.com" />
                </div>

                <TextArea label="About" value={formData.about} onChange={e => setFormData({...formData, about: e.target.value})} rows={5} />
              </>
            )}

            {activeTab === 'portfolio' && (
                <div className="space-y-4">
                    <Input label="Tagline" value={formData.tagline} onChange={e => setFormData({...formData, tagline: e.target.value})} placeholder="Building the future of..." maxLength={100} />
                    <TextArea label="Vision / Mission" value={formData.vision} onChange={e => setFormData({...formData, vision: e.target.value})} rows={3} placeholder="To democratize access to..." maxLength={500} />
                    <TextArea label="My Story" value={formData.story} onChange={e => setFormData({...formData, story: e.target.value})} rows={6} placeholder="It all started when..." />
                </div>
            )}

            {activeTab === 'professional' && (
              <>
                <Input label="Current Role" value={formData.currentRole} onChange={e => setFormData({...formData, currentRole: e.target.value})} />
                <Input label="Industry" value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} />
                <Input label="Skills (comma separated)" value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} placeholder="React, Node.js, Marketing..." />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">I'm Looking For</label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {['Co-founder', 'Investors', 'Mentors', 'Employees', 'Beta Testers', 'Partners'].map(opt => (
                      <label key={opt} className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={formData.lookingFor.includes(opt)}
                          onChange={(e) => {
                            const newLookingFor = e.target.checked 
                              ? [...formData.lookingFor, opt]
                              : formData.lookingFor.filter(i => i !== opt);
                            setFormData({...formData, lookingFor: newLookingFor});
                          }}
                          className="rounded text-primary focus:ring-primary"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'experience' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-gray-900">Experience & Education</h3>
                        <button 
                            type="button"
                            onClick={() => setFormData({
                                ...formData, 
                                experience: [
                                    { title: '', company: '', startDate: '', current: false, type: 'work' }, 
                                    ...formData.experience
                                ]
                            })}
                            className="text-sm text-primary font-medium hover:underline flex items-center"
                        >
                            <Plus className="h-4 w-4 mr-1" /> Add New
                        </button>
                    </div>

                    {formData.experience.map((exp, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative group">
                            <button 
                                type="button"
                                onClick={() => {
                                    const newExp = [...formData.experience];
                                    newExp.splice(index, 1);
                                    setFormData({...formData, experience: newExp});
                                }}
                                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                            
                            <div className="grid grid-cols-2 gap-4 mb-3">
                                <Input 
                                    label="Title / Role" 
                                    value={exp.title} 
                                    onChange={e => {
                                        const newExp = [...formData.experience];
                                        newExp[index].title = e.target.value;
                                        setFormData({...formData, experience: newExp});
                                    }}
                                />
                                <Input 
                                    label="Company / School" 
                                    value={exp.company} 
                                    onChange={e => {
                                        const newExp = [...formData.experience];
                                        newExp[index].company = e.target.value;
                                        setFormData({...formData, experience: newExp});
                                    }}
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-3">
                                <Select 
                                    label="Type"
                                    value={exp.type || 'work'}
                                    options={['work', 'education', 'project']}
                                    onChange={e => {
                                        const newExp = [...formData.experience];
                                        newExp[index].type = e.target.value;
                                        setFormData({...formData, experience: newExp});
                                    }}
                                />
                                <div className="flex items-center mt-6">
                                    <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={exp.current}
                                            onChange={e => {
                                                const newExp = [...formData.experience];
                                                newExp[index].current = e.target.checked;
                                                setFormData({...formData, experience: newExp});
                                            }}
                                            className="rounded text-primary focus:ring-primary"
                                        />
                                        <span>I currently work here</span>
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-3">
                                <Input 
                                    label="Start Date" 
                                    type="date"
                                    value={exp.startDate ? new Date(exp.startDate).toISOString().split('T')[0] : ''} 
                                    onChange={e => {
                                        const newExp = [...formData.experience];
                                        newExp[index].startDate = e.target.value;
                                        setFormData({...formData, experience: newExp});
                                    }}
                                />
                                {!exp.current && (
                                    <Input 
                                        label="End Date" 
                                        type="date"
                                        value={exp.endDate ? new Date(exp.endDate).toISOString().split('T')[0] : ''} 
                                        onChange={e => {
                                            const newExp = [...formData.experience];
                                            newExp[index].endDate = e.target.value;
                                            setFormData({...formData, experience: newExp});
                                        }}
                                    />
                                )}
                            </div>
                            
                            <TextArea 
                                label="Description" 
                                value={exp.description || ''} 
                                onChange={e => {
                                    const newExp = [...formData.experience];
                                    newExp[index].description = e.target.value;
                                    setFormData({...formData, experience: newExp});
                                }}
                                rows={2}
                            />
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'role' && user.role === 'founder' && (
              <>
                <h3 className="font-bold text-gray-900 mb-4">Startup Information</h3>
                <Input 
                  label="Pitch Deck URL" 
                  value={formData.roleProfileData.pitchDeckUrl || ''} 
                  onChange={e => handleRoleChange('pitchDeckUrl', e.target.value)} 
                  placeholder="https://docsend.com/..."
                />
                <Input 
                  label="Pitch Video URL" 
                  value={formData.roleProfileData.pitchVideoUrl || ''} 
                  onChange={e => handleRoleChange('pitchVideoUrl', e.target.value)} 
                  placeholder="https://youtube.com/..."
                />
              </>
            )}

            {activeTab === 'role' && user.role === 'investor' && (
              <>
                <h3 className="font-bold text-gray-900 mb-4">Investor Profile</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Min Ticket ($)" 
                    type="number"
                    value={formData.roleProfileData.ticketSize?.min || 0} 
                    onChange={e => handleRoleChange('ticketSize', { ...formData.roleProfileData.ticketSize, min: Number(e.target.value) })} 
                  />
                  <Input 
                    label="Max Ticket ($)" 
                    type="number"
                    value={formData.roleProfileData.ticketSize?.max || 0} 
                    onChange={e => handleRoleChange('ticketSize', { ...formData.roleProfileData.ticketSize, max: Number(e.target.value) })} 
                  />
                </div>
                <Select 
                  label="Investor Type"
                  value={formData.roleProfileData.investorType || 'Angel'}
                  onChange={e => handleRoleChange('investorType', e.target.value)}
                  options={['Angel', 'VC', 'Accelerator', 'Family Office', 'Corporate']}
                />
              </>
            )}

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="edit-profile-form"
            disabled={saving}
            className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TabButton({ children, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
        active 
          ? 'border-primary text-primary' 
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input 
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
        {...props}
      />
    </div>
  );
}

function TextArea({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea 
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition resize-y"
        {...props}
      />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select 
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition bg-white"
        {...props}
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}
