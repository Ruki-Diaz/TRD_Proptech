import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#050505] text-slate-300 py-20 mt-auto border-t border-white/5">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-16">
        <div className="col-span-1 md:col-span-1">
          <Link to="/" className="flex items-center gap-3 mb-6">
            <div className="bg-white/5 border border-white/10 p-2 rounded-xl">
              <Home className="w-5 h-5 text-teal-400" />
            </div>
            <span className="font-black text-2xl tracking-tighter text-white">SquareLanka</span>
          </Link>
          <p className="text-sm font-light leading-relaxed text-slate-400 max-w-xs">
            The premium real estate platform for purchasing, selling, and renting properties across Sri Lanka without hassle. Elevate your living standard.
          </p>
        </div>
        
        <div>
          <h4 className="text-white font-bold mb-6 tracking-wide text-sm">Navigation</h4>
          <ul className="space-y-4 text-sm font-medium">
            <li><Link to="/" className="text-slate-400 hover:text-teal-400 transition-colors">Home</Link></li>
            <li><Link to="/properties" className="text-slate-400 hover:text-teal-400 transition-colors">Premium Portfolio</Link></li>
            <li><Link to="/about" className="text-slate-400 hover:text-teal-400 transition-colors">About Us</Link></li>
            <li><Link to="/contact" className="text-slate-400 hover:text-teal-400 transition-colors">Contact</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-white font-bold mb-6 tracking-wide text-sm">Popular Locations</h4>
          <ul className="space-y-4 text-sm font-medium">
            <li><Link to="/properties?district=Colombo" className="text-slate-400 hover:text-teal-400 transition-colors">Colombo Residences</Link></li>
            <li><Link to="/properties?district=Kandy" className="text-slate-400 hover:text-teal-400 transition-colors">Kandy Estates</Link></li>
            <li><Link to="/properties?district=Galle" className="text-slate-400 hover:text-teal-400 transition-colors">Galle Villas</Link></li>
            <li><Link to="/properties?district=Gampaha" className="text-slate-400 hover:text-teal-400 transition-colors">Gampaha Lands</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-white font-bold mb-6 tracking-wide text-sm">Legal & Connect</h4>
          <ul className="space-y-4 text-sm font-medium mb-6">
            <li><Link to="/privacy" className="text-slate-400 hover:text-teal-400 transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="text-slate-400 hover:text-teal-400 transition-colors">Terms of Service</Link></li>
          </ul>
          <div className="space-y-3 text-sm font-light text-slate-400">
            <p className="flex items-center gap-2"><span className="text-teal-400 font-bold">E:</span> hello@squarelanka.lk</p>
            <p className="flex items-center gap-2"><span className="text-teal-400 font-bold">P:</span> +94 11 234 5678</p>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-6 mt-16 pt-8 border-t border-white/5 text-sm font-medium flex flex-col md:flex-row justify-between items-center text-slate-500">
        <p>&copy; {new Date().getFullYear()} SquareLanka. All rights reserved.</p>
        <p className="mt-2 md:mt-0">Designed for Premium Real Estate.</p>
      </div>
    </footer>
  );
};

export default Footer;
