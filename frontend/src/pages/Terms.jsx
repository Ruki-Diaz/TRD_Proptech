import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const Terms = () => {
  return (
    <div className="bg-[#050505] min-h-screen text-slate-200 py-20 relative overflow-hidden">
      <Helmet>
        <title>Terms of Service | SquareLanka</title>
      </Helmet>

      <div className="container mx-auto px-6 max-w-4xl relative z-10">
        <Link to="/" className="text-teal-400 hover:text-teal-300 font-bold mb-8 inline-block">&larr; Back to Home</Link>
        
        <div className="bg-[#111] p-10 md:p-16 rounded-[2.5rem] border border-white/5 shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
             <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                <ShieldAlert className="w-6 h-6 text-white" />
             </div>
             <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter">Terms of Service</h1>
          </div>
          
          <div className="prose prose-invert prose-slate max-w-none prose-p:font-light prose-p:leading-relaxed prose-headings:font-black">
            <p className="text-lg">Last updated: {new Date().toLocaleDateString()}</p>
            
            <h2 className="text-2xl text-white mt-10 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using SquareLanka, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
            </p>

            <h2 className="text-2xl text-white mt-10 mb-4">2. Provision of Services</h2>
            <p>
              SquareLanka is constantly innovating in order to provide the best possible experience for its users. You acknowledge and agree that the form and nature of the services which SquareLanka provides may change from time to time without prior notice to you.
            </p>

            <h2 className="text-2xl text-white mt-10 mb-4">3. User Conduct</h2>
            <p>
              You understand that all information, data, text, photographs, graphics, video, messages or other materials ("Content"), whether publicly posted or privately transmitted, are the sole responsibility of the person from which such Content originated. This means that you, and not SquareLanka, are entirely responsible for all Content that you upload, post, email, transmit or otherwise make available via the Service.
            </p>

            <h2 className="text-2xl text-white mt-10 mb-4">4. Property Listings</h2>
            <p>
              When posting a property listing, you agree to provide accurate and truthful information. SquareLanka reserves the right to remove any listing that is deemed fraudulent, inaccurate, or in violation of these terms without prior notice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
