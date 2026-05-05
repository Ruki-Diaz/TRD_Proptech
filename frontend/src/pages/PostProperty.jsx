import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { createProperty } from '../services/api';
import PageShell from '../components/PageShell';

const PostProperty = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [files, setFiles] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    purpose: 'sale',
    property_type: 'house',
    city: 'Colombo',
    district: 'Colombo',
    bedrooms: '3',
    bathrooms: '2',
    area_sqft: '',
    whatsapp_number: '',
    phone_number: ''
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate('/login');
  }, [user, authLoading, navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const uploadImages = async (filesToUpload, currentUser) => {
    console.log("Selected files:", filesToUpload);
    const uploadedUrls = [];

    for (const file of filesToUpload) {
      if (!file || file.size === 0) {
        continue;
      }

      const filePath = `${currentUser.id}/${Date.now()}-${file.name}`;
      console.log("Upload path:", filePath);

      const { data, error } = await supabase.storage
        .from("property-images")
        .upload(filePath, file);

      console.log("Upload result - Data:", data, "Error:", error);

      if (error) {
        console.error("Upload error:", error);
        alert(error.message);
        throw new Error(error.message);
      }

      const { data: publicUrlData } = supabase.storage
        .from("property-images")
        .getPublicUrl(filePath);
        
      console.log("Generated URL:", publicUrlData.publicUrl);
      uploadedUrls.push(publicUrlData.publicUrl);
    }

    console.log("All Uploaded URLs:", uploadedUrls);
    return uploadedUrls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (!user) throw new Error("Authentication required");
      
      let main_image_url = null;
      let image_urls = [];
      
      if (files.length > 0) {
         const urls = await uploadImages(files, user);
         main_image_url = urls[0] || null;
         image_urls = urls.slice(1);
      }
      
      const payload = {
         ...formData,
         price: Number(formData.price),
         bedrooms: Number(formData.bedrooms),
         bathrooms: Number(formData.bathrooms),
         area_sqft: formData.area_sqft ? Number(formData.area_sqft) : null,
         main_image_url,
         image_urls,
         is_published: true, // Auto-publish for MVP
         status: 'available'
      };
      
      await createProperty(payload);
      setSuccess(true);
      window.scrollTo(0, 0);
      
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create listing.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  if (success) return (
     <div className="min-h-screen bg-slate-50 py-32 text-center px-4 flex flex-col items-center">
       <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200 max-w-xl w-full">
         <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
         </div>
         <h2 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Listing Published!</h2>
         <p className="text-slate-500 text-lg mb-8 leading-relaxed">Your property is now live and actively receiving enquiries.</p>
         <Link to="/dashboard" className="inline-flex items-center justify-center bg-teal-600 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-teal-700 transition shadow-lg shadow-teal-600/30">
           Go to Dashboard
         </Link>
       </div>
     </div>
  );

  return (
    <PageShell className="bg-slate-950 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-full h-96 bg-gradient-to-b from-teal-900/10 to-transparent pointer-events-none"></div>

      <Helmet>
        <title>Post Property | SquareLanka Marketplace</title>
      </Helmet>
      
      <div className="container mx-auto px-4 max-w-4xl relative z-10">
         <Link to="/dashboard" className="inline-flex items-center text-slate-400 hover:text-teal-400 transition-colors mb-6 font-semibold group">
           <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
         </Link>
         
         <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-teal-600 to-teal-400"></div>
            
            <div className="p-8 md:p-12 border-b border-slate-800">
               <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2 drop-shadow-md">Create New Listing</h1>
               <p className="text-slate-400 font-medium text-lg">Detailed listings generate up to 50% more active enquiries.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-12">
               
               {/* Section 1: Core Details */}
               <div>
                  <h3 className="text-xl font-bold border-b border-slate-800 pb-4 mb-6 text-white">1. Basic Details</h3>
                  <div className="space-y-6">
                     <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">Listing Title <span className="text-rose-400">*</span></label>
                        <input type="text" name="title" required value={formData.title} onChange={handleInputChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all font-medium text-white placeholder-slate-500" placeholder="E.g. Beautiful Luxury Villa in Colombo 7" />
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                           <label className="block text-sm font-bold text-slate-300 mb-2">Purpose</label>
                           <select name="purpose" value={formData.purpose} onChange={handleInputChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all font-medium text-white appearance-none">
                              <option value="sale" className="bg-slate-800">For Sale</option>
                              <option value="rent" className="bg-slate-800">For Rent</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-sm font-bold text-slate-300 mb-2">Property Type</label>
                           <select name="property_type" value={formData.property_type} onChange={handleInputChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all font-medium text-white appearance-none">
                              <option value="house" className="bg-slate-800">House</option>
                              <option value="apartment" className="bg-slate-800">Apartment</option>
                              <option value="land" className="bg-slate-800">Land</option>
                              <option value="commercial" className="bg-slate-800">Commercial</option>
                           </select>
                        </div>
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">Property Description <span className="text-rose-400">*</span></label>
                        <textarea name="description" required rows="5" value={formData.description} onChange={handleInputChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all font-medium resize-none text-white placeholder-slate-500" placeholder="Highlight key features, neighborhood details, and amenities..."></textarea>
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">Price (LKR) <span className="text-rose-400">*</span></label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">LKR</span>
                          <input type="number" name="price" required min="1000" value={formData.price} onChange={handleInputChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-4 pl-14 pr-4 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all font-extrabold text-white placeholder-slate-500" placeholder="0.00" />
                        </div>
                     </div>
                  </div>
               </div>

               {/* Section 2: Features */}
               <div>
                  <h3 className="text-xl font-bold border-b border-slate-800 pb-4 mb-6 text-white">2. Configuration & Location</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                     <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">Bedrooms</label>
                        <input type="number" name="bedrooms" min="0" value={formData.bedrooms} onChange={handleInputChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all text-white" />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">Bathrooms</label>
                        <input type="number" name="bathrooms" min="0" value={formData.bathrooms} onChange={handleInputChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all text-white" />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">Square Feet (Optional)</label>
                        <input type="number" name="area_sqft" min="0" value={formData.area_sqft} onChange={handleInputChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all text-white placeholder-slate-500" placeholder="e.g. 2500" />
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">City <span className="text-rose-400">*</span></label>
                        <input type="text" name="city" required value={formData.city} onChange={handleInputChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all font-medium text-white placeholder-slate-500" placeholder="E.g. Dehiwala" />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">District <span className="text-rose-400">*</span></label>
                        <select name="district" value={formData.district} onChange={handleInputChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all font-medium text-white appearance-none">
                           <option value="Colombo" className="bg-slate-800">Colombo</option>
                           <option value="Gampaha" className="bg-slate-800">Gampaha</option>
                           <option value="Kandy" className="bg-slate-800">Kandy</option>
                           <option value="Galle" className="bg-slate-800">Galle</option>
                        </select>
                     </div>
                  </div>
               </div>

               {/* Section 3: Media & Contact */}
               <div>
                  <h3 className="text-xl font-bold border-b border-slate-800 pb-4 mb-6 text-white">3. Media & Contact</h3>
                  
                  <div className="mb-8">
                     <label className="block text-sm font-bold text-slate-300 mb-2">Property Images</label>
                     <p className="text-xs text-slate-400 mb-3 font-semibold">First image will be used as the main Hero display.</p>
                     
                     <div className="w-full bg-slate-800/50 border-2 border-dashed border-teal-500/30 rounded-2xl p-8 hover:bg-slate-800 hover:border-teal-500/50 transition-all text-center relative cursor-pointer group">
                        <UploadCloud className="w-10 h-10 text-teal-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-teal-400 text-sm">Click to upload photos</span>
                        <input type="file" multiple accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                     </div>
                     {files.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                           {files.map((f, i) => (
                              <div key={i} className="bg-slate-800 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 truncate max-w-[150px]">
                                 {f.name}
                              </div>
                           ))}
                        </div>
                     )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">Direct Contact Number</label>
                        <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleInputChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all text-white placeholder-slate-500" placeholder="+94 77 123 4567" />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">WhatsApp Number</label>
                        <input type="tel" name="whatsapp_number" value={formData.whatsapp_number} onChange={handleInputChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all text-white placeholder-slate-500" placeholder="+94 77 123 4567" />
                     </div>
                  </div>
               </div>
               
               {error && (
                  <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl flex items-center text-rose-400">
                     <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
                     <span className="font-semibold text-sm">{error}</span>
                  </div>
               )}

               <div className="pt-6 border-t border-slate-800">
                  <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-bold text-lg py-5 rounded-2xl transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] border border-teal-400/30 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center">
                     {loading ? (
                        <><Loader2 className="w-6 h-6 mr-3 animate-spin" /> Processing Upload, please don't close...</>
                     ) : 'Publish Property to Marketplace'}
                  </button>
               </div>
            </form>
         </div>
      </div>
    </PageShell>
  );
};

export default PostProperty;
