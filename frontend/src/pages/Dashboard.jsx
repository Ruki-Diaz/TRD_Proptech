import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { PlusCircle, Settings2, Home, BarChart3, Edit3, Trash2, TriangleAlert, Loader2, MessageSquare, Phone, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchMyProperties, updatePropertyStatus, deleteProperty, fetchMyEnquiries, updateEnquiryStatus } from '../services/api';
import PageShell from '../components/PageShell';
import { getPropertyImage, FALLBACK_IMAGE } from '../utils/helpers';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [activeTab, setActiveTab] = useState('properties');
  const [loading, setLoading] = useState(true);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    Promise.all([
      fetchMyProperties().catch(err => {
        console.error("Properties error", err);
        return [];
      }),
      fetchMyEnquiries().catch(err => {
        console.error("Enquiries error", err);
        return [];
      })
    ]).then(([propsData, enqData]) => {
      setProperties(propsData);
      setEnquiries(enqData);
    }).finally(() => setLoading(false));
  }, [user, authLoading, navigate]);

  const handleStatusChange = async (propertyId, newStatus) => {
    try {
       setStatusUpdatingId(propertyId);
       setFeedback({ type: '', message: '' });
       await updatePropertyStatus(propertyId, newStatus);
       setProperties(prev => prev.map(p => p.id === propertyId ? { ...p, status: newStatus } : p));
       setFeedback({ type: 'success', message: 'Listing status updated.' });
    } catch (err) {
       console.error("Failed to update status", err);
       setFeedback({ type: 'error', message: err.message || 'Failed to update status. Please try again.' });
    } finally {
       setStatusUpdatingId(null);
    }
  };

  const handleEnquiryStatusChange = async (enquiryId, newStatus) => {
    try {
       setFeedback({ type: '', message: '' });
       await updateEnquiryStatus(enquiryId, newStatus);
       setEnquiries(prev => prev.map(e => e.id === enquiryId ? { ...e, status: newStatus } : e));
    } catch (err) {
       console.error("Failed to update enquiry status", err);
       setFeedback({ type: 'error', message: err.message || 'Failed to update enquiry status. Please try again.' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleteLoading(true);
      setFeedback({ type: '', message: '' });
      await deleteProperty(deleteTarget.id);
      setProperties(prev => prev.filter(prop => prop.id !== deleteTarget.id));
      setDeleteTarget(null);
      setFeedback({ type: 'success', message: 'Listing deleted successfully.' });
    } catch (err) {
      console.error('Failed to delete listing', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to delete listing.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  if (authLoading || loading) return (
     <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
     </div>
  );

  return (
    <PageShell className="bg-slate-950 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-full h-96 bg-gradient-to-b from-teal-900/10 to-transparent pointer-events-none"></div>

      <Helmet>
        <title>Agent Dashboard | SquareLanka</title>
      </Helmet>

      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 py-8 shadow-sm relative overflow-hidden">
         <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-teal-600 to-teal-400"></div>
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md">Agent Dashboard</h1>
            <p className="text-slate-400 font-medium">Welcome back, manage your portfolio in one place.</p>
          </div>
          <Link to="/post-property" className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] flex items-center border border-teal-400/30">
             <PlusCircle className="w-5 h-5 mr-2"/> Add New Property
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-10 grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10">
         {/* Sidebar Navigation */}
         <div className="lg:col-span-1">
            <div className="bg-slate-900/80 p-4 rounded-3xl shadow-xl border border-slate-800 sticky top-28 backdrop-blur-xl">
               <div className="flex flex-col gap-2">
                  <button onClick={() => setActiveTab('properties')} className={`flex items-center w-full px-4 py-3 rounded-xl font-bold transition-all border ${activeTab === 'properties' ? 'bg-teal-500/10 text-teal-400 shadow-sm border-teal-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-transparent'}`}>
                     <Home className="w-5 h-5 mr-3"/> My Properties
                  </button>
                  <button onClick={() => setActiveTab('enquiries')} className={`flex items-center w-full px-4 py-3 rounded-xl font-bold transition-all border ${activeTab === 'enquiries' ? 'bg-teal-500/10 text-teal-400 shadow-sm border-teal-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-transparent'}`}>
                     <MessageSquare className="w-5 h-5 mr-3"/> Leads & Enquiries
                     {enquiries.length > 0 && (
                       <span className="ml-auto bg-teal-500 text-teal-950 text-xs px-2 py-0.5 rounded-full">{enquiries.length}</span>
                     )}
                  </button>
                  <Link to="/settings" className="flex items-center w-full px-4 py-3 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl font-semibold transition-all border border-transparent">
                     <Settings2 className="w-5 h-5 mr-3"/> Account Settings
                  </Link>
               </div>
            </div>
         </div>

         {/* Main Content Area */}
         <div className="lg:col-span-3">
            <div className="bg-slate-900/80 p-6 rounded-3xl shadow-xl border border-slate-800 backdrop-blur-xl">
                {activeTab === 'properties' ? (
                   <>
                     <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                        Active Listings <span className="ml-3 bg-slate-800 text-teal-400 px-3 py-1 rounded-full text-sm border border-slate-700">{properties.length}</span>
                     </h2>
                     {feedback.message && (
                        <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                          feedback.type === 'error'
                            ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                            : 'border-teal-500/30 bg-teal-500/10 text-teal-400'
                        }`}>
                          {feedback.message}
                        </div>
                     )}
                     {properties.length === 0 ? (
                        <div className="text-center py-16 px-4">
                           <div className="bg-slate-800 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-slate-700">
                              <Home className="w-10 h-10 text-slate-500"/>
                           </div>
                           <h3 className="text-2xl font-bold text-white tracking-tight mb-2">No Properties Yet</h3>
                           <p className="text-slate-400 mb-8 max-w-sm mx-auto">You haven't listed any properties. Start building your portfolio today.</p>
                           <Link to="/post-property" className="text-teal-400 font-bold bg-teal-500/10 px-8 py-3.5 rounded-xl hover:bg-teal-500/20 border border-teal-500/30 transition-all shadow-sm">
                              Create First Listing
                           </Link>
                        </div>
                     ) : (
                        <div className="overflow-x-auto">
                           <table className="w-full text-left border-collapse">
                              <thead>
                                 <tr className="border-b border-slate-800 text-slate-500 font-bold text-sm tracking-widest uppercase">
                                    <th className="pb-4">Property</th>
                                    <th className="pb-4">Status</th>
                                    <th className="pb-4">Controls</th>
                                    <th className="pb-4">Actions</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {properties.map(prop => (
                                    <tr key={prop.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/50 transition-colors">
                                       <td className="py-6 pr-4">
                                          <div className="flex items-center gap-4">
                                             <img 
                                               src={getPropertyImage(prop)} 
                                               className="w-16 h-16 rounded-xl object-cover shadow-sm bg-slate-800 border border-slate-700" 
                                               onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }}
                                             />
                                             <div>
                                                <Link to={`/properties/${prop.slug}`} className="font-bold text-white hover:text-teal-400 transition-colors truncate max-w-[200px] block">{prop.title}</Link>
                                                <div className="text-sm text-teal-400/80 font-medium mt-1">LKR {Number(prop.price).toLocaleString()}</div>
                                             </div>
                                          </div>
                                       </td>
                                       <td className="py-6 pr-4">
                                          <span className={`px-3 py-1 text-xs font-bold rounded-full border ${prop.status === 'sold' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : prop.status === 'rented' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-teal-500/10 text-teal-400 border-teal-500/30'}`}>
                                             {prop.status?.toUpperCase() || 'AVAILABLE'}
                                          </span>
                                       </td>
                                       <td className="py-6 pr-4">
                                          <select 
                                            value={prop.status || 'available'}
                                            onChange={(e) => handleStatusChange(prop.id, e.target.value)}
                                            disabled={statusUpdatingId === prop.id}
                                            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all appearance-none"
                                          >
                                             <option value="available" className="bg-slate-800">Make Available</option>
                                             <option value="sold" className="bg-slate-800">Mark Sold</option>
                                             <option value="rented" className="bg-slate-800">Mark Rented</option>
                                          </select>
                                          {statusUpdatingId === prop.id && (
                                            <div className="mt-2 inline-flex items-center text-xs font-semibold text-teal-500">
                                              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Saving...
                                            </div>
                                          )}
                                       </td>
                                       <td className="py-6">
                                          {prop.user_id === user?.id && (
                                            <div className="flex items-center gap-2">
                                               <Link
                                                 to={`/dashboard/properties/${prop.id}/edit`}
                                                 className="p-2 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-all tooltip border border-transparent hover:border-teal-500/30"
                                                 aria-label={`Edit ${prop.title}`}
                                               >
                                                  <Edit3 className="w-5 h-5"/>
                                               </Link>
                                               <button
                                                 onClick={() => setDeleteTarget(prop)}
                                                 className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all tooltip border border-transparent hover:border-rose-500/30"
                                                 aria-label={`Delete ${prop.title}`}
                                               >
                                                  <Trash2 className="w-5 h-5"/>
                                               </button>
                                            </div>
                                          )}
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     )}
                   </>
                ) : (
                   <>
                     <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                        Property Enquiries <span className="ml-3 bg-slate-800 text-teal-400 px-3 py-1 rounded-full text-sm border border-slate-700">{enquiries.length}</span>
                     </h2>
                     {enquiries.length === 0 ? (
                        <div className="text-center py-16 px-4">
                           <div className="bg-slate-800 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-slate-700">
                              <MessageSquare className="w-10 h-10 text-slate-500"/>
                           </div>
                           <h3 className="text-2xl font-bold text-white tracking-tight mb-2">No Enquiries Yet</h3>
                           <p className="text-slate-400 mb-8 max-w-sm mx-auto">When buyers show interest in your properties, their messages will appear here.</p>
                        </div>
                     ) : (
                        <div className="space-y-4">
                           {enquiries.map(enq => (
                              <div key={enq.id} className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700 hover:border-teal-500/30 transition-all flex flex-col md:flex-row gap-6">
                                 <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2 gap-4">
                                       <h4 className="font-bold text-white text-lg">{enq.name}</h4>
                                       <div className="flex items-center gap-2">
                                          <select 
                                            value={enq.status || 'new'}
                                            onChange={(e) => handleEnquiryStatusChange(enq.id, e.target.value)}
                                            className={`text-xs font-bold rounded-md px-2 py-1 outline-none border transition-colors cursor-pointer ${
                                              enq.status === 'closed' ? 'bg-slate-800 text-slate-400 border-slate-700' : 
                                              enq.status === 'replied' ? 'bg-teal-500/10 text-teal-400 border-teal-500/30' :
                                              enq.status === 'read' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' :
                                              'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                            }`}
                                          >
                                            <option value="new" className="bg-slate-800 text-slate-200">New</option>
                                            <option value="read" className="bg-slate-800 text-slate-200">Read</option>
                                            <option value="replied" className="bg-slate-800 text-slate-200">Replied</option>
                                            <option value="closed" className="bg-slate-800 text-slate-200">Closed</option>
                                          </select>
                                          <span className="text-xs text-slate-500 font-medium bg-slate-800 px-2 py-1 rounded-md border border-slate-700">
                                             {new Date(enq.created_at).toLocaleDateString()}
                                          </span>
                                       </div>
                                    </div>
                                    <div className="flex items-center gap-4 mb-4 text-sm font-semibold">
                                       <a href={`mailto:${enq.email}`} className="text-slate-400 hover:text-teal-400 flex items-center"><Mail className="w-4 h-4 mr-1.5"/> {enq.email}</a>
                                       <a href={`tel:${enq.phone}`} className="text-slate-400 hover:text-teal-400 flex items-center"><Phone className="w-4 h-4 mr-1.5"/> {enq.phone}</a>
                                    </div>
                                    {enq.message && (
                                       <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-slate-300 text-sm leading-relaxed mb-4">
                                          "{enq.message}"
                                       </div>
                                    )}
                                 </div>
                                 <div className="md:w-64 shrink-0 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                    <div className="text-xs text-slate-500 font-bold uppercase mb-2">Interested In</div>
                                    <Link to={`/properties/${enq.properties?.slug}`} className="flex items-center gap-3 group">
                                       <img 
                                         src={getPropertyImage(enq.properties)} 
                                         className="w-12 h-12 rounded-lg object-cover" 
                                         onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }}
                                       />
                                       <span className="text-sm font-bold text-slate-300 group-hover:text-teal-400 transition-colors line-clamp-2">{enq.properties?.title || 'Unknown Property'}</span>
                                    </Link>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                   </>
                )}
            </div>
         </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-[50px] pointer-events-none"></div>
            <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
              <TriangleAlert className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight text-white relative z-10">Delete this listing?</h3>
            <p className="mt-3 text-slate-400 relative z-10">
              <span className="font-semibold text-slate-200">{deleteTarget.title}</span> will be removed from your portfolio.
              This action cannot be undone.
            </p>
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end relative z-10">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
                className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-300 transition-all hover:bg-slate-800 hover:text-white disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-5 py-3 font-semibold text-white transition-all hover:from-rose-600 hover:to-rose-700 shadow-[0_0_15px_rgba(244,63,94,0.3)] border border-rose-400/30 disabled:opacity-70"
              >
                {deleteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Delete Listing
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default Dashboard;
