import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Menu, X, Heart, LogOut, LayoutDashboard, PlusCircle } from 'lucide-react';
import { useSavedProperties } from '../context/SavedPropertiesContext';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { savedProperties } = useSavedProperties();
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isAgentOrAdmin = userProfile?.role === 'agent' || userProfile?.role === 'admin';
  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch(err) {
      console.error(err);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Portfolio', path: '/properties' },
    { name: 'Estates', path: '/properties?type=land' },
    { name: 'Rentals', path: '/properties?purpose=rent' },
  ];

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-6'}`}>
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-white/5 border border-white/10 p-2 rounded-xl group-hover:bg-teal-500/10 transition-colors duration-300">
            <Home className="w-5 h-5 text-teal-400" />
          </div>
          <span className="font-black text-2xl tracking-tighter text-white">SquareLanka</span>
        </Link>
        
        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8 bg-white/5 border border-white/5 px-8 py-3 rounded-full backdrop-blur-md">
          {navLinks.map((link) => (
             <Link 
               key={link.name} 
               to={link.path} 
               className={`text-sm font-semibold tracking-wide transition-colors ${location.pathname === link.path && location.search === '' && link.path === '/' || location.pathname + location.search === link.path ? 'text-teal-400' : 'text-slate-300 hover:text-white'}`}
             >
               {link.name}
             </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-5">
          <Link to="/saved" className="relative p-2 text-slate-400 hover:text-rose-400 transition-colors group">
            <Heart className={`w-5 h-5 transition-all duration-300 ${savedProperties.length > 0 ? 'text-rose-500 fill-rose-500/20' : ''}`} />
            {savedProperties.length > 0 && (
              <span className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center translate-x-1 -translate-y-1 shadow-[0_0_10px_rgba(244,63,94,0.5)]">
                {savedProperties.length}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-3 ml-2">
              {isAgentOrAdmin && (
                <Link to="/post-property" className="text-teal-400 font-bold text-sm px-4 py-2 hover:bg-teal-500/10 rounded-full transition-colors flex items-center">
                  <PlusCircle className="w-4 h-4 mr-2"/> Post Listing
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin" className="bg-rose-500/10 text-rose-400 text-sm px-5 py-2.5 rounded-full font-bold hover:bg-rose-500/20 transition-colors">Admin Panel</Link>
              )}
              <Link to="/dashboard" className="bg-white/10 text-white px-5 py-2.5 rounded-full border border-white/5 text-sm font-bold hover:bg-white/20 transition-colors flex items-center">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="text-slate-400 hover:text-rose-400 p-2.5 rounded-full transition-colors"><LogOut className="w-5 h-5"/></button>
            </div>
          ) : (
             <div className="flex items-center gap-4 ml-2">
                <Link to="/login" className="text-slate-300 font-bold text-sm hover:text-white transition-colors">Sign in</Link>
                <Link to="/register" className="bg-teal-500 text-[#050505] px-6 py-2.5 rounded-full text-sm font-bold hover:bg-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.3)] hover:-translate-y-0.5 transition-all duration-300">Sign Up</Link>
             </div>
          )}
        </div>
        
        {/* Mobile Toggle */}
        <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden text-slate-300 p-2 hover:bg-white/5 rounded-xl transition-colors">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-[#050505]/95 backdrop-blur-2xl lg:hidden flex flex-col">
          <div className="p-6 flex justify-between items-center border-b border-white/5">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3">
              <div className="bg-white/5 border border-white/10 p-2 rounded-xl">
                <Home className="w-5 h-5 text-teal-400" />
              </div>
              <span className="font-black text-2xl tracking-tighter text-white">SquareLanka</span>
            </Link>
            <button onClick={() => setMobileMenuOpen(false)} className="text-slate-300 p-2 hover:bg-white/5 rounded-xl transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  to={link.path} 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="text-lg font-bold text-slate-300 hover:text-white py-4 border-b border-white/5"
                >
                  {link.name}
                </Link>
              ))}
              <Link to="/saved" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-rose-400 hover:text-rose-300 py-4 border-b border-white/5 flex items-center justify-between">
                Saved Properties
                {savedProperties.length > 0 && (
                  <span className="bg-rose-500 text-white text-xs px-2.5 py-1 rounded-full">{savedProperties.length}</span>
                )}
              </Link>
            </nav>

            <div className="mt-auto pt-6">
              {user ? (
                <div className="flex flex-col gap-3">
                  {isAgentOrAdmin && (
                    <Link to="/post-property" onClick={() => setMobileMenuOpen(false)} className="bg-teal-500/10 text-teal-400 font-bold px-4 py-4 rounded-xl border border-teal-500/20 flex items-center justify-center">
                      <PlusCircle className="w-5 h-5 mr-2"/> Post Listing
                    </Link>
                  )}
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="bg-rose-500/10 text-rose-400 px-4 py-4 rounded-xl border border-rose-500/20 font-bold flex items-center justify-center">Admin Panel</Link>
                  )}
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="bg-white/5 text-white px-4 py-4 rounded-xl border border-white/10 font-bold flex items-center justify-center hover:bg-white/10">
                    <LayoutDashboard className="w-5 h-5 mr-2"/> Dashboard
                  </Link>
                  <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="text-slate-400 hover:text-rose-400 px-4 py-4 rounded-xl font-bold flex items-center justify-center transition-colors">
                    <LogOut className="w-5 h-5 mr-2"/> Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="bg-white/5 text-white px-4 py-4 rounded-xl font-bold text-center border border-white/10 hover:bg-white/10 transition-colors">Sign in</Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="bg-teal-500 text-[#050505] px-4 py-4 rounded-xl font-bold text-center">Sign Up</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
