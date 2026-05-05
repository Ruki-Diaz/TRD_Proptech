import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="bg-[#050505] min-h-screen text-slate-200 py-20 relative overflow-hidden">
      <Helmet>
        <title>Privacy Policy | SquareLanka</title>
      </Helmet>

      <div className="container mx-auto px-6 max-w-4xl relative z-10">
        <Link to="/" className="text-teal-400 hover:text-teal-300 font-bold mb-8 inline-block">&larr; Back to Home</Link>
        
        <div className="bg-[#111] p-10 md:p-16 rounded-[2.5rem] border border-white/5 shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
             <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                <ShieldAlert className="w-6 h-6 text-teal-400" />
             </div>
             <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter">Privacy Policy</h1>
          </div>
          
          <div className="prose prose-invert prose-slate max-w-none prose-p:font-light prose-p:leading-relaxed prose-headings:font-black">
            <p className="text-lg">Last updated: {new Date().toLocaleDateString()}</p>
            
            <h2 className="text-2xl text-white mt-10 mb-4">1. Introduction</h2>
            <p>
              Welcome to SquareLanka. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website (regardless of where you visit it from) and tell you about your privacy rights and how the law protects you.
            </p>

            <h2 className="text-2xl text-white mt-10 mb-4">2. The Data We Collect About You</h2>
            <p>
              Personal data, or personal information, means any information about an individual from which that person can be identified. It does not include data where the identity has been removed (anonymous data).
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-4 text-slate-400 font-light">
              <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
              <li><strong>Contact Data</strong> includes email address and telephone numbers.</li>
              <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location.</li>
            </ul>

            <h2 className="text-2xl text-white mt-10 mb-4">3. How We Use Your Personal Data</h2>
            <p>
              We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-4 text-slate-400 font-light">
              <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
              <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
              <li>Where we need to comply with a legal obligation.</li>
            </ul>

            <h2 className="text-2xl text-white mt-10 mb-4">4. Data Security</h2>
            <p>
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorised way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
