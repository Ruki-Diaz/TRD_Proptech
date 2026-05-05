import { Link } from 'react-router-dom';
import { MapPin, Bed, Bath, Expand, Heart, ShieldCheck, Star, User, Briefcase, Clock } from 'lucide-react';
import { useSavedProperties } from '../context/SavedPropertiesContext';
import Badge from './Badge';
import { timeAgo, getPropertyImage, FALLBACK_IMAGE } from '../utils/helpers';

const PropertyCard = ({ prop }) => {
  const { isSaved, toggleSaveProperty } = useSavedProperties();

  const handleNavigation = (e) => {
    if (!prop || !prop.slug) {
      e.preventDefault();
      console.warn("Property slug missing, navigation prevented.");
    }
  };

  return (
    <div className="group bg-[#0a0a0a] rounded-[2rem] overflow-hidden shadow-2xl border border-white/5 hover:border-teal-500/30 hover:shadow-[0_20px_40px_rgba(20,184,166,0.1)] transition-all duration-500 flex flex-col h-full relative backdrop-blur-md">
      
      {/* Premium Glow effect on hover */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-teal-500/10 rounded-full blur-[60px] group-hover:bg-teal-500/20 transition-all duration-700 pointer-events-none"></div>

      <Link 
        to={prop?.slug ? `/properties/${prop.slug}` : '#'} 
        onClick={handleNavigation}
        className="relative h-72 overflow-hidden bg-[#111] block"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/40 opacity-90 z-10 pointer-events-none"></div>
        <img 
          src={getPropertyImage(prop)} 
          alt={prop.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-[0.22,1,0.36,1]"
          loading="lazy"
          onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }}
        />
        <div className="absolute top-5 left-5 flex flex-col items-start gap-2 z-20">
          <Badge variant="purpose" className="backdrop-blur-md bg-slate-950/70 border border-teal-400/30 text-teal-200 shadow-lg shadow-teal-500/10 font-bold tracking-widest text-[10px]">
            {prop.purpose === 'sale' ? 'FOR SALE' : 'FOR RENT'}
          </Badge>
          
          {/* Trust Layer: Featured */}
          {prop.featured && (
            <Badge variant="featured" className="backdrop-blur-md bg-amber-500/20 border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Star className="w-3 h-3 mr-1 fill-amber-400 text-amber-400" /> Premium
            </Badge>
          )}
          
          {/* Trust Layer: Verified */}
          {prop.is_verified && (
            <Badge variant="verified" className="backdrop-blur-md bg-teal-500/20 border-teal-500/30 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.2)]">
              <ShieldCheck className="w-3 h-3 mr-1" /> Verified
            </Badge>
          )}
        </div>
      </Link>
      
      {/* Heart Toggle */}
      <button 
        onClick={(e) => toggleSaveProperty(prop, e)}
        className="absolute top-5 right-5 bg-black/40 backdrop-blur-xl p-3 rounded-2xl shadow-sm border border-white/10 hover:bg-black/60 hover:border-white/20 transition-all duration-300 z-20"
      >
        <Heart className={`w-5 h-5 transition-all duration-300 ${isSaved(prop.id) ? 'fill-rose-500 text-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]' : 'text-slate-300 fill-transparent hover:text-rose-400 hover:fill-rose-400/20'}`} />
      </button>

      <Link 
        to={prop?.slug ? `/properties/${prop.slug}` : '#'} 
        onClick={handleNavigation}
        className="block p-6 flex flex-col flex-grow cursor-pointer relative z-10"
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-white font-black text-3xl tracking-tighter drop-shadow-sm">LKR {Number(prop.price).toLocaleString()}</span>
            {prop.purpose === 'rent' && <span className="text-slate-500 font-medium text-sm ml-1">/ mo</span>}
          </div>
          
          {/* Trust Layer: Listed By Agent/Owner */}
          {prop.listed_by && (
             <Badge variant={prop.listed_by === 'owner' ? 'owner' : 'agent'} className="mt-1 bg-white/5 border-white/10">
               {prop.listed_by === 'owner' ? <User className="w-3 h-3 mr-1 text-slate-400" /> : <Briefcase className="w-3 h-3 mr-1 text-slate-400" />}
               <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{prop.listed_by === 'owner' ? 'Owner' : 'Agent'}</span>
             </Badge>
          )}
        </div>

        <h3 className="font-extrabold text-xl text-white mb-4 line-clamp-2 leading-tight group-hover:text-teal-400 transition-colors duration-300">{prop.title}</h3>
        
        {/* Trust Layer: Location Chip & Time Ago */}
        <div className="flex flex-wrap items-center gap-3 mb-5 mt-auto">
          <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-white/5 text-slate-300 text-xs font-bold uppercase tracking-wider border border-white/5">
            <MapPin className="w-3.5 h-3.5 mr-1.5 text-teal-400" />
            {prop.city}, {prop.district}
          </span>
          {prop.created_at && (
             <span className="inline-flex items-center text-slate-500 text-xs font-semibold">
               <Clock className="w-3.5 h-3.5 mr-1.5" /> {timeAgo(prop.created_at)}
             </span>
          )}
        </div>
        
        <div className="flex items-center gap-5 text-sm text-slate-300 border-t border-white/5 pt-5 mt-2">
          {prop.property_type !== 'land' ? (
            <>
              <span className="flex items-center font-semibold" title="Bedrooms">
                 <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mr-2 border border-white/5">
                    <Bed className="w-4 h-4 text-teal-400"/>
                 </div>
                 {prop.bedrooms || 1}
              </span>
              <span className="flex items-center font-semibold" title="Bathrooms">
                 <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mr-2 border border-white/5">
                    <Bath className="w-4 h-4 text-teal-400"/>
                 </div>
                 {prop.bathrooms || 1}
              </span>
              {prop.area_sqft && (
                 <span className="flex items-center font-semibold ml-auto text-slate-400">
                    <Expand className="w-4 h-4 mr-1.5 text-teal-400/50"/> {prop.area_sqft} sqft
                 </span>
              )}
            </>
          ) : (
            <span className="flex items-center font-semibold text-slate-400">
               <Expand className="w-4 h-4 mr-2 text-teal-400/50"/> {prop.land_size} {prop.land_size_unit}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
};

export default PropertyCard;
