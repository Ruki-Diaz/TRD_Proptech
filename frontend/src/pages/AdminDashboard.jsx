import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import PageShell from '../components/PageShell';
import { supabase } from '../services/supabase';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5001';

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const res = await response.json();
      if (res.success) setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handlePromote = async (userId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${API_BASE_URL}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ role: 'agent' })
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerify = async (profileId, currentStatus) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${API_BASE_URL}/api/admin/agents/${profileId}/verification`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ is_verified: !currentStatus })
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-slate-400 p-8">Loading users...</div>;

  return (
    <PageShell className="bg-slate-950 text-slate-200">
      <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold text-white mb-8">Admin Panel</h1>
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-xs tracking-wider">
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium">Role</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {users.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-8 text-center text-slate-400">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map(u => {
                const agentProfile = u.agent_profiles?.[0];
                return (
                  <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4">{u.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${u.role === 'admin' ? 'bg-rose-500/20 text-rose-400' : u.role === 'agent' ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-700 text-slate-300'}`}>
                      {u.role}
                    </span>
                    {agentProfile && (
                       <span className="ml-2 text-xs text-slate-500">
                         {agentProfile.is_verified ? '✓ Verified' : '(Unverified)'}
                       </span>
                    )}
                  </td>
                  <td className="p-4 flex gap-2">
                    {u.role === 'user' && (
                      <button onClick={() => handlePromote(u.id)} className="bg-teal-600 hover:bg-teal-500 text-white px-3 py-1 rounded text-sm transition">Promote to Agent</button>
                    )}
                    {u.role === 'agent' && agentProfile && (
                      <button onClick={() => handleVerify(agentProfile.profile_id, agentProfile.is_verified)} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm transition">
                        {agentProfile.is_verified ? 'Unverify' : 'Verify'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })
          )}
          </tbody>
        </table>
      </div>
      </div>
    </PageShell>
  );
};

export default AdminDashboard;
