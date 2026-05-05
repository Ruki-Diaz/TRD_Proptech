import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MapPin, Filter, Bed, Bath, Expand, Heart } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { fetchProperties } from '../services/api';
import PropertyCard from '../components/PropertyCard';
import { PropertyCardSkeleton } from '../components/Skeletons';

const Properties = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentDistrict = searchParams.get('district') || '';
  const currentType = searchParams.get('type') || '';
  const currentPurpose = searchParams.get('purpose') || '';
  const currentBeds = searchParams.get('bedrooms') || '';
  const currentMinPrice = searchParams.get('min_price') || '';
  const currentMaxPrice = searchParams.get('max_price') || '';
  const currentSort = searchParams.get('sort') || 'newest';
  const currentPage = parseInt(searchParams.get('page')) || 1;
  const ITEMS_PER_PAGE = 12;

  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetchProperties({ 
      district: currentDistrict, 
      type: currentType, 
      purpose: currentPurpose,
      bedrooms: currentBeds,
      min_price: currentMinPrice,
      max_price: currentMaxPrice,
      sort: currentSort,
      page: currentPage,
      limit: ITEMS_PER_PAGE
    })
      .then(res => {
         setProperties(res.data);
         setTotal(res.total);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [currentDistrict, currentType, currentPurpose, currentBeds, currentMinPrice, currentMaxPrice, currentSort, currentPage]);

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    
    // Reset to page 1 on any filter change
    if (key !== 'page') newParams.set('page', '1');
    
    setSearchParams(newParams);
  };

  return (
    <div className="bg-slate-950 min-h-screen pt-[120px] pb-10 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-teal-900/10 to-transparent pointer-events-none"></div>
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <Helmet>
        <title>Properties for Sale & Rent | SquareLanka</title>
        <meta name="description" content="Browse our extensive catalog of properties across Sri Lanka." />
      </Helmet>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-1/4">
            <div className="bg-slate-900/80 p-6 rounded-2xl shadow-lg border border-slate-800 sticky top-24 relative overflow-hidden backdrop-blur-xl">
               <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-teal-600 to-teal-400"></div>
              <h2 className="text-xl font-bold flex items-center mb-6 text-white">
                <Filter className="w-5 h-5 mr-2 text-teal-400" /> Filters
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Purpose</label>
                  <select 
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all text-white appearance-none"
                    value={currentPurpose}
                    onChange={(e) => updateFilter('purpose', e.target.value)}
                  >
                    <option value="" className="bg-slate-800">All</option>
                    <option value="sale" className="bg-slate-800">For Sale</option>
                    <option value="rent" className="bg-slate-800">For Rent</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-3">Property Type</label>
                  <div className="flex flex-wrap gap-2">
                     {[{v: '', l: 'Any'}, {v: 'house', l: 'House'}, {v: 'apartment', l: 'Apartment'}, {v: 'land', l: 'Land'}, {v: 'commercial', l: 'Commercial'}].map(opt => (
                        <button
                          key={opt.v}
                          onClick={() => updateFilter('type', opt.v)}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${currentType === opt.v ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white border-teal-400/50 shadow-[0_0_15px_rgba(20,184,166,0.3)]' : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-teal-500/50 hover:text-slate-200 flex-grow xl:flex-grow-0'}`}
                        >
                          {opt.l}
                        </button>
                     ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">District</label>
                  <select 
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all text-white appearance-none"
                    value={currentDistrict}
                    onChange={(e) => updateFilter('district', e.target.value)}
                  >
                    <option value="" className="bg-slate-800">All Districts</option>
                    <option value="Colombo" className="bg-slate-800">Colombo</option>
                    <option value="Kandy" className="bg-slate-800">Kandy</option>
                    <option value="Galle" className="bg-slate-800">Galle</option>
                    <option value="Gampaha" className="bg-slate-800">Gampaha</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-3">Bedrooms</label>
                  <div className="flex flex-wrap gap-2">
                     {[{v: '', l: 'Any'}, {v: '1', l: '1+'}, {v: '2', l: '2+'}, {v: '3', l: '3+'}, {v: '4', l: '4+'}, {v: '5', l: '5+'}].map(opt => (
                        <button
                          key={opt.v}
                          onClick={() => updateFilter('bedrooms', opt.v)}
                          className={`px-4 py-2 flex-grow xl:flex-grow-0 rounded-xl text-sm font-semibold transition-all border ${currentBeds === opt.v ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white border-teal-400/50 shadow-[0_0_15px_rgba(20,184,166,0.3)]' : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-teal-500/50 hover:text-slate-200'}`}
                        >
                          {opt.l}
                        </button>
                     ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">Min Price</label>
                      <div className="relative group">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs uppercase group-focus-within:text-teal-400 transition-colors">LKR</span>
                        <input type="number" placeholder="Min"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-11 pr-3 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all font-medium text-sm text-white placeholder-slate-500"
                          value={currentMinPrice}
                          onChange={(e) => updateFilter('min_price', e.target.value)}
                        />
                      </div>
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">Max Price</label>
                      <div className="relative group">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs uppercase group-focus-within:text-teal-400 transition-colors">LKR</span>
                        <input type="number" placeholder="Max"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-11 pr-3 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all font-medium text-sm text-white placeholder-slate-500"
                          value={currentMaxPrice}
                          onChange={(e) => updateFilter('max_price', e.target.value)}
                        />
                      </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => setSearchParams({})}
                  className="w-full text-center text-teal-400 font-semibold py-3 border border-slate-700 hover:border-teal-500/50 hover:bg-teal-500/10 rounded-xl transition-all"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </aside>

          <main className="lg:w-3/4">
            <div className="mb-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 border-b border-slate-800 pb-4">
              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Available Properties</h1>
                <p className="text-slate-400 font-medium">{total} results found</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-slate-400">Sort by:</label>
                <select 
                  className="bg-slate-900 border border-slate-700 rounded-xl p-2 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all font-medium text-slate-300 appearance-none pr-8"
                  value={currentSort}
                  onChange={(e) => updateFilter('sort', e.target.value)}
                >
                  <option value="newest" className="bg-slate-800">Newest First</option>
                  <option value="price_asc" className="bg-slate-800">Price: Low to High</option>
                  <option value="price_desc" className="bg-slate-800">Price: High to Low</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {[1,2,3,4].map(n => (
                  <PropertyCardSkeleton key={n} />
                ))}
              </div>
            ) : properties.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {properties.map(prop => (
                  <PropertyCard key={prop.id} prop={prop} />
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/50 p-16 rounded-2xl border border-slate-800 text-center backdrop-blur-sm">
                <Filter className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-300 mb-2">No Properties Found</h3>
                <p className="text-slate-500">Try adjusting your filters to find more properties.</p>
                <button onClick={() => setSearchParams({})} className="mt-6 text-teal-400 font-semibold hover:text-teal-300 transition-colors">Clear Filters</button>
              </div>
            )}

            {/* Pagination Controls */}
            {total > ITEMS_PER_PAGE && (
              <div className="mt-12 flex justify-center items-center gap-4">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => {
                     updateFilter('page', currentPage - 1);
                     window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl shadow-lg hover:border-teal-500/50 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-slate-300 transition-all backdrop-blur-sm"
                >
                  Previous
                </button>
                <div className="px-4 py-2 text-teal-400 font-bold bg-slate-900/80 rounded-xl border border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.1)] backdrop-blur-sm">
                  Page {currentPage} of {Math.ceil(total / ITEMS_PER_PAGE)}
                </div>
                <button 
                  disabled={currentPage >= Math.ceil(total / ITEMS_PER_PAGE)}
                  onClick={() => {
                     updateFilter('page', currentPage + 1);
                     window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl shadow-lg hover:border-teal-500/50 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-slate-300 transition-all backdrop-blur-sm"
                >
                  Next
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Properties;
