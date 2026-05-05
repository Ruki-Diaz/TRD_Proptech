import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { setupProfile } from '../services/api';

const Register = () => {
  const [role, setRole] = useState('user'); // 'user' or 'agent'
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    companyName: '',
    licenseNumber: '',
    bio: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      const authData = await register(formData.email, formData.password);
      
      if (!authData?.session) {
        setSuccess('Please verify your email, then sign in to complete setup.');
        setLoading(false);
        return;
      }

      // Setup profile
      const setupPayload = {
        role,
        full_name: formData.fullName,
        phone_number: formData.phone,
      };

      if (role === 'agent') {
        setupPayload.company_name = formData.companyName;
        setupPayload.license_number = formData.licenseNumber;
        setupPayload.bio = formData.bio;
      }

      await setupProfile(setupPayload);
      
      // Redirect based on role
      if (role === 'agent') {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Failed to create an account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-slate-950 flex flex-col justify-center py-20 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-full h-96 bg-gradient-to-b from-teal-900/10 to-transparent pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <Helmet>
         <title>Sign Up | SquareLanka Marketplace</title>
      </Helmet>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <h2 className="mt-6 text-4xl font-extrabold text-white tracking-tight drop-shadow-md">Create Account</h2>
        <p className="mt-2 text-sm text-slate-400 font-medium">
          Join SquareLanka as a Buyer or Agent.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="bg-slate-900/80 shadow-2xl border border-slate-800 rounded-3xl relative overflow-hidden backdrop-blur-xl">
           <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-teal-600 to-teal-400"></div>
          
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setRole('user')}
              className={`flex-1 py-4 text-sm font-bold text-center transition-colors ${role === 'user' ? 'bg-teal-500/10 text-teal-400 border-b-2 border-teal-500' : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'}`}
            >
              Sign Up as Buyer
            </button>
            <button
              onClick={() => setRole('agent')}
              className={`flex-1 py-4 text-sm font-bold text-center transition-colors ${role === 'agent' ? 'bg-teal-500/10 text-teal-400 border-b-2 border-teal-500' : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'}`}
            >
              Register as Agent
            </button>
          </div>

          <div className="p-8 sm:px-12">
            {success ? (
              <div className="text-center py-8">
                <div className="text-teal-400 font-bold text-lg mb-4">{success}</div>
                <Link to="/login" className="inline-block bg-teal-500 hover:bg-teal-400 text-[#050505] font-bold px-8 py-3 rounded-full transition-all">
                  Go to Login
                </Link>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Full Name <span className="text-rose-400">*</span></label>
                    <input type="text" name="fullName" required value={formData.fullName} onChange={handleInputChange} className="appearance-none block w-full px-4 py-3 border border-slate-700 rounded-xl shadow-sm placeholder-slate-500 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm bg-slate-800 text-white transition-all" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Email address <span className="text-rose-400">*</span></label>
                    <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="appearance-none block w-full px-4 py-3 border border-slate-700 rounded-xl shadow-sm placeholder-slate-500 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm bg-slate-800 text-white transition-all" placeholder="user@example.com" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">Password <span className="text-rose-400">*</span></label>
                      <input type="password" name="password" required minLength="6" value={formData.password} onChange={handleInputChange} className="appearance-none block w-full px-4 py-3 border border-slate-700 rounded-xl shadow-sm placeholder-slate-500 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm bg-slate-800 text-white transition-all" placeholder="••••••••" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">Confirm Password <span className="text-rose-400">*</span></label>
                      <input type="password" name="confirmPassword" required minLength="6" value={formData.confirmPassword} onChange={handleInputChange} className="appearance-none block w-full px-4 py-3 border border-slate-700 rounded-xl shadow-sm placeholder-slate-500 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm bg-slate-800 text-white transition-all" placeholder="••••••••" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Phone Number {role === 'agent' && <span className="text-rose-400">*</span>}</label>
                    <input type="tel" name="phone" required={role === 'agent'} value={formData.phone} onChange={handleInputChange} className="appearance-none block w-full px-4 py-3 border border-slate-700 rounded-xl shadow-sm placeholder-slate-500 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm bg-slate-800 text-white transition-all" placeholder="+94 77 123 4567" />
                  </div>

                  {role === 'agent' && (
                    <>
                      <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">Company Name <span className="text-rose-400">*</span></label>
                        <input type="text" name="companyName" required value={formData.companyName} onChange={handleInputChange} className="appearance-none block w-full px-4 py-3 border border-slate-700 rounded-xl shadow-sm placeholder-slate-500 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm bg-slate-800 text-white transition-all" placeholder="SquareLanka Properties" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">License Number (Optional)</label>
                        <input type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleInputChange} className="appearance-none block w-full px-4 py-3 border border-slate-700 rounded-xl shadow-sm placeholder-slate-500 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm bg-slate-800 text-white transition-all" placeholder="REA-12345" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">Professional Bio (Optional)</label>
                        <textarea name="bio" rows="3" value={formData.bio} onChange={handleInputChange} className="appearance-none block w-full px-4 py-3 border border-slate-700 rounded-xl shadow-sm placeholder-slate-500 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm bg-slate-800 text-white transition-all resize-none" placeholder="Tell buyers about your experience..." />
                      </div>
                    </>
                  )}
                </div>

                {error && <div className="text-rose-400 text-sm font-bold text-center bg-rose-500/10 p-3 rounded-lg border border-rose-500/30">{error}</div>}

                <div>
                  <button disabled={loading} type="submit" className="w-full flex justify-center py-3.5 px-4 border border-teal-400/30 rounded-xl shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] text-sm font-bold text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                    {loading ? 'Processing...' : 'Sign Up'}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-8 text-center">
               <p className="text-sm text-slate-400 font-medium">Already have an account? <Link to="/login" className="text-teal-400 hover:text-teal-300 font-bold transition-colors">Sign in here</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
