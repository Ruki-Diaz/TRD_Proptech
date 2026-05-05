import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { fetchMyProfile } from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      try {
        const profile = await fetchMyProfile();
        if (profile?.role === 'admin') {
          navigate('/admin');
        } else if (profile?.role === 'agent') {
          navigate('/dashboard');
        } else {
          navigate('/');
        }
      } catch (profileErr) {
        // Fallback
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-teal-900/10 to-transparent pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <Helmet>
         <title>Login | SquareLanka Marketplace</title>
      </Helmet>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <h2 className="mt-6 text-center text-4xl font-extrabold text-white tracking-tight drop-shadow-md">Access Dashboard</h2>
        <p className="mt-2 text-center text-sm text-slate-400 font-medium">
          Manage your listings and view enquiries.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/80 py-10 px-8 shadow-2xl border border-slate-800 rounded-3xl sm:px-12 relative overflow-hidden backdrop-blur-xl">
           <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-teal-600 to-teal-400"></div>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Email address</label>
              <div className="mt-1">
                <input type="email" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-slate-700 rounded-xl shadow-sm placeholder-slate-500 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm bg-slate-800 text-white transition-all"
                  placeholder="agent@squarelanka.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Password</label>
              <div className="mt-1">
                <input type="password" required
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-slate-700 rounded-xl shadow-sm placeholder-slate-500 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm bg-slate-800 text-white transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && <div className="text-rose-400 text-sm font-bold text-center bg-rose-500/10 p-3 rounded-lg border border-rose-500/30">{error}</div>}

            <div>
              <button disabled={loading} type="submit" className="w-full flex justify-center py-3.5 px-4 border border-teal-400/30 rounded-xl shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] text-sm font-bold text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? 'Authenticating...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center flex flex-col gap-2">
             <p className="text-sm text-slate-400 font-medium">Don't have an account?</p>
             <div className="flex justify-center gap-4">
               <Link to="/register" className="text-teal-400 hover:text-teal-300 font-bold transition-colors">Create Buyer Account</Link>
               <span className="text-slate-600">|</span>
               <Link to="/register" className="text-teal-400 hover:text-teal-300 font-bold transition-colors">Register as Agent</Link>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
