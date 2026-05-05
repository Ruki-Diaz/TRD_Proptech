import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="bg-[#050505] min-h-screen text-slate-200 flex items-center justify-center relative overflow-hidden">
      <Helmet>
        <title>Page Not Found | SquareLanka</title>
      </Helmet>

      {/* Abstract Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-rose-600/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="relative z-10 text-center px-6">
        <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-800 tracking-tighter mb-4">
          404
        </h1>
        <h2 className="text-3xl md:text-4xl font-black text-white mb-6 tracking-tight">
          Destination Unknown
        </h2>
        <p className="text-lg text-slate-400 font-light max-w-md mx-auto mb-10 leading-relaxed">
          The property or page you are looking for has been moved, deleted, or possibly never existed.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/" className="w-full sm:w-auto inline-flex items-center justify-center bg-white text-[#050505] hover:bg-slate-200 font-bold px-8 py-4 rounded-full transition-all duration-300">
            <Home className="w-5 h-5 mr-2" /> Return Home
          </Link>
          <Link to="/properties" className="w-full sm:w-auto inline-flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold px-8 py-4 rounded-full transition-all duration-300">
            <ArrowLeft className="w-5 h-5 mr-2" /> Browse Portfolio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
