import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Heart, Search } from 'lucide-react';
import { useSavedProperties } from '../context/SavedPropertiesContext';
import PropertyCard from '../components/PropertyCard';
import PageShell from '../components/PageShell';

const SavedProperties = () => {
  const { savedProperties, toggleSaveProperty } = useSavedProperties();

  return (
    <PageShell className="bg-slate-950 relative overflow-hidden text-slate-200 pt-[120px] pb-10">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-full h-96 bg-gradient-to-b from-teal-900/10 to-transparent pointer-events-none"></div>

      <Helmet>
        <title>Saved Properties | SquareLanka</title>
      </Helmet>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="mb-8 border-b border-slate-800 pb-4">
          <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md">Your Saved Properties</h1>
          <p className="text-slate-400 font-medium">You have {savedProperties.length} saved {savedProperties.length === 1 ? 'listing' : 'listings'} to review later.</p>
        </div>

        {savedProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {savedProperties.map(prop => (
              <PropertyCard key={prop.id} prop={prop} />
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/80 p-16 rounded-3xl border border-slate-800 text-center shadow-2xl max-w-2xl mx-auto mt-12 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-teal-600 to-teal-400"></div>
            <Heart className="w-16 h-16 text-slate-700 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">You haven't saved any properties yet</h3>
            <p className="text-slate-400 mb-8 text-lg">Click the heart icon on any interesting property to add it to this list and review it later!</p>
            <Link to="/properties" className="inline-flex items-center justify-center bg-gradient-to-r from-teal-500 to-teal-600 text-white font-bold px-8 py-3.5 rounded-xl hover:from-teal-400 hover:to-teal-500 transition-all shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] border border-teal-400/30">
              <Search className="w-5 h-5 mr-3" /> Start Browsing Homes
            </Link>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default SavedProperties;
