import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, UploadCloud, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { fetchEditableProperty, updateProperty } from '../services/api';
import PageShell from '../components/PageShell';

const EditProperty = () => {
  const { propertyId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [files, setFiles] = useState([]);
  const [currentImages, setCurrentImages] = useState([]);
  const [existingProperty, setExistingProperty] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    purpose: 'sale',
    property_type: 'house',
    city: 'Colombo',
    district: 'Colombo',
    bedrooms: '0',
    bathrooms: '0',
    area_sqft: '',
    whatsapp_number: '',
    phone_number: '',
    address: '',
    land_size: '',
    land_size_unit: 'perches',
    agent_name: '',
    features: ''
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    fetchEditableProperty(propertyId)
      .then((property) => {
        setExistingProperty(property);
        setCurrentImages([property.main_image_url, ...(property.image_urls || [])].filter(Boolean));
        setFormData({
          title: property.title || '',
          description: property.description || '',
          price: property.price ?? '',
          purpose: property.purpose || 'sale',
          property_type: property.property_type || 'house',
          city: property.city || '',
          district: property.district || 'Colombo',
          bedrooms: property.bedrooms ?? 0,
          bathrooms: property.bathrooms ?? 0,
          area_sqft: property.area_sqft ?? '',
          whatsapp_number: property.whatsapp_number || '',
          phone_number: property.phone_number || '',
          address: property.address || '',
          land_size: property.land_size ?? '',
          land_size_unit: property.land_size_unit || 'perches',
          agent_name: property.agent_name || '',
          features: Array.isArray(property.features) ? property.features.join(', ') : ''
        });
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || 'Failed to load listing details.');
      })
      .finally(() => setPageLoading(false));
  }, [authLoading, user, navigate, propertyId]);

  const isLand = useMemo(() => formData.property_type === 'land', [formData.property_type]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    setFiles(Array.from(event.target.files || []));
  };

  const uploadImages = async (filesToUpload, currentUser) => {
    const uploadedUrls = [];

    for (const file of filesToUpload) {
      if (!file || file.size === 0) continue;

      const filePath = `${currentUser.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: publicUrlData } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrlData.publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (!existingProperty) {
        throw new Error('Listing details are not loaded yet');
      }

      let mainImageUrl = existingProperty.main_image_url || null;
      let imageUrls = existingProperty.image_urls || [];

      if (files.length > 0) {
        const uploaded = await uploadImages(files, user);
        mainImageUrl = uploaded[0] || null;
        imageUrls = uploaded.slice(1);
      }

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        purpose: formData.purpose,
        property_type: formData.property_type,
        city: formData.city.trim(),
        district: formData.district,
        address: formData.address.trim() || null,
        bedrooms: isLand ? null : Number(formData.bedrooms),
        bathrooms: isLand ? null : Number(formData.bathrooms),
        area_sqft: formData.area_sqft ? Number(formData.area_sqft) : null,
        land_size: isLand && formData.land_size ? Number(formData.land_size) : null,
        land_size_unit: isLand ? formData.land_size_unit : null,
        whatsapp_number: formData.whatsapp_number.trim() || null,
        phone_number: formData.phone_number.trim() || null,
        agent_name: formData.agent_name.trim() || null,
        main_image_url: mainImageUrl,
        image_urls: imageUrls,
        features: formData.features
          .split(',')
          .map((feature) => feature.trim())
          .filter(Boolean)
      };

      const updated = await updateProperty(propertyId, payload);
      setExistingProperty(updated);
      setCurrentImages([updated.main_image_url, ...(updated.image_urls || [])].filter(Boolean));
      setFiles([]);
      setSuccess('Listing updated successfully.');

      setTimeout(() => {
        navigate('/dashboard');
      }, 900);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update listing.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <PageShell className="bg-slate-950 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-full h-96 bg-gradient-to-b from-teal-900/10 to-transparent pointer-events-none"></div>

      <Helmet>
        <title>Edit Property | SquareLanka Marketplace</title>
      </Helmet>

      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        <Link to="/dashboard" className="inline-flex items-center text-slate-400 hover:text-teal-400 transition-colors mb-6 font-semibold group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </Link>

        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-teal-600 to-teal-400"></div>

          <div className="p-8 md:p-12 border-b border-slate-800">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2 drop-shadow-md">Edit Listing</h1>
            <p className="text-slate-400 font-medium text-lg">Update your property details without affecting the public browsing experience.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-12">
            <div>
              <h3 className="text-xl font-bold border-b border-slate-800 pb-4 mb-6 text-white">1. Basic Details</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Listing Title <span className="text-rose-400">*</span></label>
                  <input type="text" name="title" required value={formData.title} onChange={handleInputChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all font-medium text-white placeholder-slate-500" />
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
                  <textarea name="description" required rows="5" value={formData.description} onChange={handleInputChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all font-medium resize-none text-white placeholder-slate-500" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Price (LKR) <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">LKR</span>
                    <input type="number" name="price" required min="1000" value={formData.price} onChange={handleInputChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-4 pl-14 pr-4 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all font-extrabold text-white placeholder-slate-500" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold border-b border-slate-800 pb-4 mb-6 text-white">2. Configuration & Location</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">City <span className="text-rose-400">*</span></label>
                  <input type="text" name="city" required value={formData.city} onChange={handleInputChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all font-medium text-white placeholder-slate-500" />
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

              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-300 mb-2">Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all font-medium text-white placeholder-slate-500" />
              </div>

              {isLand ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Land Size</label>
                    <input type="number" name="land_size" min="0" value={formData.land_size} onChange={handleInputChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all text-white placeholder-slate-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Land Size Unit</label>
                    <select name="land_size_unit" value={formData.land_size_unit} onChange={handleInputChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all font-medium text-white appearance-none">
                      <option value="perches" className="bg-slate-800">Perches</option>
                      <option value="acres" className="bg-slate-800">Acres</option>
                      <option value="sqft" className="bg-slate-800">Sq Ft</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Bedrooms</label>
                    <input type="number" name="bedrooms" min="0" value={formData.bedrooms} onChange={handleInputChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Bathrooms</label>
                    <input type="number" name="bathrooms" min="0" value={formData.bathrooms} onChange={handleInputChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Square Feet</label>
                    <input type="number" name="area_sqft" min="0" value={formData.area_sqft} onChange={handleInputChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all text-white placeholder-slate-500" />
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xl font-bold border-b border-slate-800 pb-4 mb-6 text-white">3. Media & Contact</h3>

              {currentImages.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-bold text-slate-300 mb-3">Current Images</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {currentImages.map((image, index) => (
                      <div key={`${image}-${index}`} className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800">
                        <img src={image} alt={`Property ${index + 1}`} className="h-28 w-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-8">
                <label className="block text-sm font-bold text-slate-300 mb-2">Replace Property Images</label>
                <p className="text-xs text-slate-400 mb-3 font-semibold">Leave this empty to keep the current gallery.</p>
                <div className="w-full bg-slate-800/50 border-2 border-dashed border-teal-500/30 rounded-2xl p-8 hover:bg-slate-800 hover:border-teal-500/50 transition-all text-center relative cursor-pointer group">
                  <UploadCloud className="w-10 h-10 text-teal-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-teal-400 text-sm">Click to upload replacement photos</span>
                  <input type="file" multiple accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
                {files.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {files.map((file, index) => (
                      <div key={`${file.name}-${index}`} className="bg-slate-800 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 truncate max-w-[170px]">
                        {file.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Agent Name</label>
                  <input type="text" name="agent_name" value={formData.agent_name} onChange={handleInputChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all text-white placeholder-slate-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Features</label>
                  <input type="text" name="features" value={formData.features} onChange={handleInputChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all text-white placeholder-slate-500" placeholder="Pool, Garden, Parking" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Direct Contact Number</label>
                  <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleInputChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all text-white placeholder-slate-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">WhatsApp Number</label>
                  <input type="tel" name="whatsapp_number" value={formData.whatsapp_number} onChange={handleInputChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all text-white placeholder-slate-500" />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl flex items-center text-rose-400">
                <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
                <span className="font-semibold text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-teal-500/10 border border-teal-500/30 p-4 rounded-xl flex items-center text-teal-400">
                <CheckCircle2 className="w-5 h-5 mr-3 shrink-0" />
                <span className="font-semibold text-sm">{success}</span>
              </div>
            )}

            <div className="pt-6 border-t border-slate-800">
              <button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-bold text-lg py-5 rounded-2xl transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] border border-teal-400/30 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center">
                {saving ? <><Loader2 className="w-6 h-6 mr-3 animate-spin" /> Saving changes...</> : 'Save Listing Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageShell>
  );
};

export default EditProperty;
