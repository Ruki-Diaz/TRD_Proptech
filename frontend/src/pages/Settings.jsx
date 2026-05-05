import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { fetchMyProfile, updateProfile, updateAgentProfile } from '../services/api';
import { Loader2, Save, User, Briefcase } from 'lucide-react';
import PageShell from '../components/PageShell';

const Settings = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAgent, setSavingAgent] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone_number: '',
    avatar_url: ''
  });
  
  const [agentData, setAgentData] = useState({
    company_name: '',
    license_number: '',
    bio: ''
  });

  const isAgentOrAdmin = userProfile?.role === 'agent' || userProfile?.role === 'admin';

  useEffect(() => {
    fetchMyProfile()
      .then(data => {
        setProfileData({
          full_name: data.full_name || '',
          phone_number: data.phone_number || '',
          avatar_url: data.avatar_url || ''
        });
        if (data.agent_profiles && data.agent_profiles.length > 0) {
          const agentProfile = data.agent_profiles[0];
          setAgentData({
            company_name: agentProfile.company_name || '',
            license_number: agentProfile.license_number || '',
            bio: agentProfile.bio || ''
          });
        }
      })
      .catch(err => {
        setFeedback({ type: 'error', message: err.message || 'Failed to load profile.' });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setFeedback({ type: '', message: '' });
    
    try {
      await updateProfile(profileData);
      setFeedback({ type: 'success', message: 'Profile updated successfully.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAgentSubmit = async (e) => {
    e.preventDefault();
    setSavingAgent(true);
    setFeedback({ type: '', message: '' });
    
    try {
      await updateAgentProfile(agentData);
      setFeedback({ type: 'success', message: 'Agent details updated successfully.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update agent details.' });
    } finally {
      setSavingAgent(false);
    }
  };

  if (loading) return (
     <div className="min-h-[85vh] bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
     </div>
  );

  return (
    <PageShell className="bg-slate-950 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-teal-900/10 to-transparent pointer-events-none"></div>
      
      <Helmet>
        <title>Account Settings | SquareLanka</title>
      </Helmet>

      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-8 drop-shadow-md">Account Settings</h1>
        
        {feedback.message && (
          <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm font-semibold ${
            feedback.type === 'error'
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
              : 'border-teal-500/30 bg-teal-500/10 text-teal-400'
          }`}>
            {feedback.message}
          </div>
        )}

        <div className="space-y-8">
          {/* Basic Profile Section */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              <User className="w-5 h-5 mr-3 text-teal-400" /> Basic Information
            </h2>
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">Phone Number</label>
                  <input
                    type="text"
                    value={profileData.phone_number}
                    onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all"
                    placeholder="+94 77 123 4567"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-400 mb-2">Avatar URL (Optional)</label>
                  <input
                    type="url"
                    value={profileData.avatar_url}
                    onChange={(e) => setProfileData({ ...profileData, avatar_url: e.target.value })}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] flex items-center border border-teal-400/30 disabled:opacity-70"
                >
                  {savingProfile ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                  Save Profile
                </button>
              </div>
            </form>
          </div>

          {/* Agent Details Section */}
          {isAgentOrAdmin && (
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <Briefcase className="w-5 h-5 mr-3 text-teal-400" /> Agent Profile
              </h2>
              <form onSubmit={handleAgentSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Company Name</label>
                    <input
                      type="text"
                      value={agentData.company_name}
                      onChange={(e) => setAgentData({ ...agentData, company_name: e.target.value })}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all"
                      placeholder="SquareLanka Properties"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">License Number</label>
                    <input
                      type="text"
                      value={agentData.license_number}
                      onChange={(e) => setAgentData({ ...agentData, license_number: e.target.value })}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all"
                      placeholder="REA-12345"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Professional Bio</label>
                    <textarea
                      rows={4}
                      value={agentData.bio}
                      onChange={(e) => setAgentData({ ...agentData, bio: e.target.value })}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all"
                      placeholder="Tell buyers about your experience..."
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingAgent}
                    className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] flex items-center border border-teal-400/30 disabled:opacity-70"
                  >
                    {savingAgent ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                    Save Agent Details
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default Settings;
