import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ShieldCheck, Mail, Phone, Briefcase, MapPin, ArrowLeft } from 'lucide-react';
import { fetchAgentProfile, fetchProperties } from '../services/api';
import PropertyCard from '../components/PropertyCard';
import { PropertyCardSkeleton } from '../components/Skeletons';

const AgentProfile = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState(null);
  const [properties, setProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLoading(true);
    setError(null);

    fetchAgentProfile(id)
      .then(data => {
        setAgent(data);
        
        // Fetch properties for this agent
        fetchProperties({ user_id: id })
          .then(res => setProperties(res.data))
          .catch(e => console.error("Failed fetching agent properties", e))
          .finally(() => setPropertiesLoading(false));
      })
      .catch(err => {
        console.error(err);
        setError("Agent not found or unavailable");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-400 rounded-full animate-spin"></div>
    </div>
  );

  if (error || !agent) return (
    <div className="min-h-screen bg-slate-950 py-32 text-center px-4 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="bg-slate-900/80 p-12 rounded-3xl shadow-2xl border border-slate-800 max-w-xl w-full relative z-10 backdrop-blur-xl">
        <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight">Agent Not Found</h2>
        <p className="text-slate-400 text-lg mb-8 leading-relaxed">{error || "The agent profile you are looking for does not exist."}</p>
        <Link to="/properties" className="inline-flex items-center justify-center bg-gradient-to-r from-teal-500 to-teal-600 text-white font-bold px-8 py-3.5 rounded-xl hover:from-teal-400 hover:to-teal-500 transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)]">
          <ArrowLeft className="w-5 h-5 mr-3" /> Back to Properties
        </Link>
      </div>
    </div>
  );

  const agentDetails = agent.agent_profiles?.[0] || {};

  return (
    <div className="bg-[#050505] min-h-screen text-slate-200 pt-[120px] pb-10 relative overflow-hidden">
      <Helmet>
        <title>{agent.full_name} | Agent Profile</title>
      </Helmet>

      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="container mx-auto px-6 max-w-5xl relative z-10">
        <Link to="/properties" className="inline-flex items-center text-slate-400 hover:text-white font-bold mb-8 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Properties
        </Link>
        
        <div className="bg-[#111] p-10 md:p-16 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden mb-12">
           <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-teal-900/40 to-[#111]"></div>
           
           <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
              <img 
                src={agent.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'} 
                alt={agent.full_name} 
                className="w-40 h-40 rounded-[2rem] object-cover border-4 border-[#111] shadow-2xl"
              />
              
              <div className="flex-1 text-center md:text-left mt-4 md:mt-0">
                 <div className="flex flex-col md:flex-row items-center gap-4 mb-2">
                    <h1 className="text-4xl font-black text-white tracking-tighter">{agent.full_name}</h1>
                    {agentDetails.is_verified && (
                       <span className="inline-flex items-center px-3 py-1 bg-teal-500/10 text-teal-400 text-xs font-bold uppercase tracking-widest rounded-full border border-teal-500/20">
                          <ShieldCheck className="w-4 h-4 mr-1" /> Verified Elite
                       </span>
                    )}
                 </div>
                 {agentDetails.company_name && (
                   <h2 className="text-xl text-teal-400 font-bold mb-6 flex items-center justify-center md:justify-start">
                      <Briefcase className="w-5 h-5 mr-2" /> {agentDetails.company_name}
                   </h2>
                 )}
                 
                 {agentDetails.bio && (
                   <p className="text-slate-400 font-light leading-relaxed max-w-2xl mb-8">
                      {agentDetails.bio}
                   </p>
                 )}
                 
                 <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                    <a href={`mailto:${agent.email}`} className="flex items-center px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-colors border border-white/5">
                       <Mail className="w-5 h-5 mr-2 text-slate-400" /> Email Agent
                    </a>
                    {agent.phone_number && (
                      <a href={`tel:${agent.phone_number}`} className="flex items-center px-6 py-3 bg-white text-[#050505] hover:bg-slate-200 rounded-xl font-bold transition-colors">
                         <Phone className="w-5 h-5 mr-2" /> {agent.phone_number}
                      </a>
                    )}
                 </div>
              </div>
           </div>
        </div>

        <div>
           <h3 className="text-3xl font-black text-white mb-8 tracking-tighter">
             Active Portfolio 
             {!propertiesLoading && <span className="text-teal-400 ml-2">({properties.length})</span>}
           </h3>
           
           {propertiesLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {[1, 2, 3].map(n => <PropertyCardSkeleton key={n} />)}
             </div>
           ) : properties.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {properties.map(prop => (
                 <PropertyCard key={prop.id} prop={prop} />
               ))}
             </div>
           ) : (
             <div className="bg-white/5 border border-white/5 rounded-[2rem] p-12 text-center">
                <MapPin className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400 font-light text-lg">Agent currently has no active property listings.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default AgentProfile;
