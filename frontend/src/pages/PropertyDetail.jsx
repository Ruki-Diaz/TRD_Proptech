import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, ArrowLeft, Phone, Bed, Bath, Expand, CheckCircle2, Copy, Heart, ShieldCheck, Star, User, Briefcase, Clock } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { fetchPropertyBySlug, fetchSimilarProperties, submitEnquiry } from '../services/api';
import { useSavedProperties } from '../context/SavedPropertiesContext';
import PropertyCard from '../components/PropertyCard';
import { timeAgo, getPropertyImages } from '../utils/helpers';
import Badge from '../components/Badge';
import ImageGallery from '../components/ImageGallery';
import { PropertyDetailSkeleton } from '../components/Skeletons';

const PropertyDetail = () => {
  const { slug } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [copied, setCopied] = useState(false);
  const { isSaved, toggleSaveProperty } = useSavedProperties();

  const [enquiry, setEnquiry] = useState({ name: '', email: '', phone: '', message: '' });
  const [enquiryStatus, setEnquiryStatus] = useState('idle');
  const [similarProps, setSimilarProps] = useState([]);
  const [errorStatus, setErrorStatus] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLoading(true);
    setErrorStatus(false);
    console.log("Fetching property details for slug:", slug);
    
    fetchPropertyBySlug(slug)
      .then(data => {
        setProperty(data);
        
        fetchSimilarProperties(slug)
          .then(res => setSimilarProps(res))
          .catch(e => console.error("Similar fetch err:", e));
      })
      .catch(err => {
        console.error("Failed fetching property:", err);
        setErrorStatus(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    setEnquiryStatus('loading');
    
    // VERIFICATION: Logging the exact payload being sent to the backend
    const payload = { ...enquiry, property_id: property.id };
    console.log("Enquiry Payload:", payload);
    
    try {
      await submitEnquiry(payload);
      setEnquiryStatus('success');
      setEnquiry({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      console.error("Enquiry Submission Error:", err);
      setEnquiryStatus('error');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] pb-20 relative overflow-hidden">
       <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-teal-900/10 to-transparent pointer-events-none"></div>
       <PropertyDetailSkeleton />
    </div>
  );
  
  if (errorStatus || !property) return (
    <div className="min-h-screen bg-slate-950 py-32 text-center px-4 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="bg-slate-900/80 p-12 rounded-3xl shadow-2xl border border-slate-800 max-w-xl w-full relative z-10 backdrop-blur-xl">
        <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight">Property Not Found</h2>
        <p className="text-slate-400 text-lg mb-8 leading-relaxed">The property you are looking for may have been removed, sold, or the link is invalid.</p>
        <Link to="/properties" className="inline-flex items-center justify-center bg-gradient-to-r from-teal-500 to-teal-600 text-white font-bold px-8 py-3.5 rounded-xl hover:from-teal-400 hover:to-teal-500 transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)]">
          <ArrowLeft className="w-5 h-5 mr-3" /> Back to All Listings
        </Link>
      </div>
    </div>
  );

  const images = getPropertyImages(property);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppClick = () => {
    if (!property.whatsapp_number) return;
    const cleanNumber = property.whatsapp_number.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(`Hi, I'm interested in the property: "${property.title}" on SquareLanka. Can you share more details? ${window.location.href}`);
    window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="bg-slate-950 min-h-screen pb-20 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-teal-900/10 to-transparent pointer-events-none"></div>

      <Helmet>
        <title>{property.title} | SquareLanka</title>
        <meta name="description" content={property.description?.substring(0, 150)} />
      </Helmet>

      <div className="container mx-auto px-4 pt-8 relative z-10">
        <Link to="/properties" className="inline-flex items-center text-slate-400 hover:text-teal-400 transition-colors mb-6 font-medium group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Search
        </Link>
        
        {/* Gallery Section */}
        <div className="relative mb-8">
          <button 
            onClick={(e) => toggleSaveProperty(property, e)}
            className="absolute top-8 right-8 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-700 hover:scale-105 hover:bg-slate-800 transition-all z-20 group"
          >
            <Heart className={`w-8 h-8 transition duration-300 ${isSaved(property.id) ? 'fill-rose-500 text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'text-slate-400 fill-transparent group-hover:text-rose-400 group-hover:fill-rose-400/20'}`} />
          </button>
          
          <div className="rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
            <ImageGallery images={images} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-slate-900/80 p-8 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden backdrop-blur-xl">
               <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-teal-600 to-teal-400"></div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge variant="purpose">
                      FOR {property.purpose.toUpperCase()}
                    </Badge>
                    {property.is_verified && (
                      <Badge variant="verified" className="!rounded-lg px-3 py-1 shadow-[0_0_10px_rgba(16,185,129,0.2)]"><ShieldCheck className="w-4 h-4 mr-1"/> Verified Listing</Badge>
                    )}
                    {property.featured && (
                      <Badge variant="featured" className="!rounded-lg px-3 py-1 shadow-[0_0_10px_rgba(245,158,11,0.2)]"><Star className="w-4 h-4 mr-1 fill-amber-500 text-amber-500"/> Featured Property</Badge>
                    )}
                  </div>
                  
                  <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4 drop-shadow-md">{property.title}</h1>
                  
                  <div className="flex flex-wrap items-center text-slate-400 text-lg gap-3">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-800/80 text-slate-300 text-sm font-semibold border border-slate-700">
                      <MapPin className="w-4 h-4 mr-1.5 text-teal-400" />
                      {property.address ? `${property.address}, ` : ''}{property.city}, {property.district}
                    </span>
                    {property.created_at && (
                      <span className="inline-flex items-center text-slate-500 text-sm font-medium">
                        <Clock className="w-4 h-4 mr-1.5" /> {timeAgo(property.created_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 py-6 border-y border-slate-800 my-6">
                 {property.property_type !== 'land' ? (
                  <>
                     <div className="flex items-center text-slate-300 font-semibold bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/50">
                       <Bed className="w-5 h-5 mr-3 text-teal-400"/> {property.bedrooms} Bedrooms
                     </div>
                     <div className="flex items-center text-slate-300 font-semibold bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/50">
                       <Bath className="w-5 h-5 mr-3 text-teal-400"/> {property.bathrooms} Bathrooms
                     </div>
                     {property.area_sqft && (
                       <div className="flex items-center text-slate-300 font-semibold bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/50">
                         <Expand className="w-5 h-5 mr-3 text-teal-400"/> {property.area_sqft} SqFt
                       </div>
                     )}
                  </>
                 ) : (
                   <div className="flex items-center text-slate-300 font-semibold bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/50">
                      <Expand className="w-5 h-5 mr-3 text-teal-400"/> {property.land_size} {property.land_size_unit}
                   </div>
                 )}
                 <div className="flex items-center text-slate-300 font-semibold capitalize bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/50">
                   {property.property_type}
                 </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">Description</h3>
                <div className="prose prose-invert max-w-none text-slate-400 leading-relaxed text-lg" dangerouslySetInnerHTML={{__html: property.description?.replace(/\\n/g, '<br/>') || 'No description provided.'}}></div>
              </div>

              {property.features?.length > 0 && (
                <div className="mt-10">
                  <h3 className="text-2xl font-bold text-white mb-6 tracking-tight">Key Features</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {property.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-slate-300 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 hover:border-teal-500/30 transition-colors">
                        <CheckCircle2 className="w-5 h-5 mr-3 text-teal-400 shrink-0" />
                        <span className="font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Map Placeholder */}
              <div className="mt-10">
                <h3 className="text-2xl font-bold text-white mb-6 tracking-tight">Location</h3>
                <div className="bg-slate-800 w-full h-64 rounded-3xl relative overflow-hidden flex items-center justify-center group cursor-pointer border border-slate-700">
                  <div className="absolute inset-0 bg-slate-900 opacity-80 group-hover:opacity-60 transition duration-500" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\'60\\' height=\\'60\\' viewBox=\\'0 0 60 60\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'none\\' fill-rule=\\'evenodd\\'%3E%3Cg fill=\\'%23334155\\' fill-opacity=\\'0.4\\'%3E%3Cpath d=\\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.5)] mb-3 group-hover:scale-110 transition-transform">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <span className="bg-slate-900/90 backdrop-blur px-4 py-2 rounded-xl font-bold text-white shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-slate-700">View on Map</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/80 p-8 rounded-3xl shadow-xl border border-slate-800 sticky top-28 backdrop-blur-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-[50px] -z-10 pointer-events-none"></div>
              <div className="flex justify-between items-start mb-2">
                <div className="text-slate-400 font-medium">Price</div>
                {property.listed_by && (
                  <Badge variant={property.listed_by === 'owner' ? 'owner' : 'agent'} className="bg-slate-800 border-slate-700 text-slate-300">
                    {property.listed_by === 'owner' ? <User className="w-3 h-3 mr-1" /> : <Briefcase className="w-3 h-3 mr-1" />}
                    {property.listed_by === 'owner' ? 'Owner Listed' : 'Agent Listed'}
                  </Badge>
                )}
              </div>
              <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-white mb-2 tracking-tight drop-shadow-[0_0_5px_rgba(45,212,191,0.2)]">LKR {Number(property.price).toLocaleString()}</div>
              {property.purpose === 'rent' && <div className="text-slate-400 mb-8 font-medium">per month</div>}
              
              <hr className="my-8 border-slate-800" />
              
              <div className="mb-8 flex items-center gap-4 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                {property.agent?.avatar_url ? (
                  <img 
                    src={property.agent.avatar_url} 
                    alt={property.agent.full_name} 
                    className="w-16 h-16 rounded-xl object-cover shadow-md border border-slate-700 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-700 flex items-center justify-center shrink-0 border border-slate-600">
                    {property.listed_by === 'owner' ? <User className="w-8 h-8 text-slate-400" /> : <Briefcase className="w-8 h-8 text-slate-400" />}
                  </div>
                )}
                <div>
                  <div className="text-lg font-bold text-white mb-1 flex items-center">
                    {property.agent?.full_name || (property.listed_by === 'owner' ? 'Property Owner' : 'SquareLanka Agent')}
                    {property.agent?.agent_profiles?.[0]?.is_verified && (
                      <ShieldCheck className="w-5 h-5 ml-2 text-teal-400 fill-teal-400/20" title="Verified Agent" />
                    )}
                  </div>
                  <div className="text-sm text-teal-400 font-semibold mb-1">
                    {property.agent?.agent_profiles?.[0]?.company_name || (property.listed_by === 'owner' ? 'Direct Owner' : 'Independent Consultant')}
                  </div>
                  {property.agent?.agent_profiles?.[0]?.bio && (
                    <div className="text-xs text-slate-400 font-medium line-clamp-2">
                      {property.agent.agent_profiles[0].bio}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {property.whatsapp_number && property.whatsapp_number.trim() !== '' && (
                  <button onClick={handleWhatsAppClick} className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-4 px-4 rounded-2xl flex items-center justify-center transition-all shadow-[0_0_15px_rgba(37,211,102,0.3)] hover:shadow-[0_0_25px_rgba(37,211,102,0.5)]">
                    <svg className="w-6 h-6 mr-3 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.711.927 2.8.929 3.177 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.769-5.77zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.102.824z"/></svg>
                    Chat on WhatsApp
                  </button>
                )}
                {property.phone_number && property.phone_number.trim() !== '' && (
                  <button onClick={() => window.location.href = `tel:${property.phone_number}`} className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white font-bold py-4 px-4 rounded-2xl flex items-center justify-center transition-all shadow-lg">
                    <Phone className="w-5 h-5 mr-3" />
                    Call {property.phone_number}
                  </button>
                )}
                <button onClick={handleCopy} className="w-full bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-teal-500/50 hover:text-teal-400 text-slate-300 font-semibold py-4 px-4 rounded-2xl flex items-center justify-center transition-all">
                    <Copy className="w-5 h-5 mr-3" />
                    {copied ? 'Link Copied!' : 'Share Property'}
                </button>
              </div>
 
              <hr className="my-8 border-slate-800" />
              
              <h4 className="text-xl font-bold text-white mb-4">Enquire Now</h4>
              {enquiryStatus === 'success' ? (
                <div className="bg-teal-900/30 text-teal-400 p-4 rounded-2xl flex items-center border border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.1)]">
                  <CheckCircle2 className="w-5 h-5 mr-3 shrink-0" />
                  <span className="font-medium">Enquiry sent! We will contact you shortly.</span>
                </div>
              ) : (
                <form onSubmit={handleEnquirySubmit} className="space-y-4">
                  <input 
                    type="text" required placeholder="Full Name" 
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 text-sm transition-all text-white placeholder-slate-500"
                    value={enquiry.name} onChange={e => setEnquiry({...enquiry, name: e.target.value})}
                  />
                  <input 
                    type="email" required placeholder="Email Address" 
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 text-sm transition-all text-white placeholder-slate-500"
                    value={enquiry.email} onChange={e => setEnquiry({...enquiry, email: e.target.value})}
                  />
                  <input 
                    type="tel" required placeholder="Phone Number" 
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 text-sm transition-all text-white placeholder-slate-500"
                    value={enquiry.phone} onChange={e => setEnquiry({...enquiry, phone: e.target.value})}
                  />
                  <textarea 
                    placeholder="I am interested in this property..." rows="3"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 text-sm resize-none transition-all text-white placeholder-slate-500"
                    value={enquiry.message} onChange={e => setEnquiry({...enquiry, message: e.target.value})}
                  ></textarea>
                  {enquiryStatus === 'error' && <p className="text-rose-400 text-xs font-semibold">Failed to send enquiry, please try again.</p>}
                  <button 
                    type="submit" disabled={enquiryStatus === 'loading'}
                    className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center border border-teal-400/30"
                  >
                    {enquiryStatus === 'loading' ? (
                       <>
                         <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                         Sending Enquiry...
                       </>
                    ) : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
 
        {/* Similar Properties */}
        {similarProps.length > 0 && (
          <div className="mt-20 border-t border-slate-800 pt-16">
            <h2 className="text-3xl font-extrabold text-white tracking-tight mb-8">Similar Properties</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {similarProps.map(prop => (
                <div key={prop.id} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  <PropertyCard prop={prop} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyDetail;
