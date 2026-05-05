import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Mail, Phone, MapPin, CheckCircle2 } from 'lucide-react';

const Contact = () => {
  const [status, setStatus] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('success');
    setTimeout(() => setStatus(''), 3000);
  };

  return (
    <div className="bg-[#050505] min-h-screen text-slate-200 py-20 relative overflow-hidden">
      <Helmet>
        <title>Contact Us | SquareLanka</title>
      </Helmet>

      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6">Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-white">Touch</span></h1>
          <p className="text-lg text-slate-400 font-light max-w-2xl mx-auto">
            Have a question about a property, or want to partner with us? Our team is ready to assist you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <div>
            <div className="bg-[#111] p-10 rounded-[2rem] border border-white/5 h-full relative overflow-hidden">
              <div className="absolute -top-32 -left-32 w-64 h-64 bg-teal-500/10 rounded-full blur-[60px] pointer-events-none"></div>
              
              <h3 className="text-2xl font-black text-white mb-8">Contact Information</h3>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                    <Mail className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Email</h4>
                    <p className="text-slate-400 font-light">hello@squarelanka.lk</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                    <Phone className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Phone</h4>
                    <p className="text-slate-400 font-light">+94 11 234 5678</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                    <MapPin className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Office</h4>
                    <p className="text-slate-400 font-light leading-relaxed">
                      123 Premium Avenue,<br/>
                      Colombo 07,<br/>
                      Sri Lanka
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-[#111] p-10 rounded-[2rem] border border-white/5">
              <h3 className="text-2xl font-black text-white mb-8">Send a Message</h3>
              
              {status === 'success' ? (
                <div className="bg-teal-500/10 text-teal-400 p-6 rounded-2xl border border-teal-500/20 flex items-center">
                  <CheckCircle2 className="w-6 h-6 mr-3 shrink-0" />
                  <span className="font-bold">Message sent! We'll get back to you shortly.</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Name</label>
                    <input type="text" required className="w-full bg-[#050505] border border-white/10 rounded-xl p-4 outline-none focus:border-teal-500 transition-colors text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Email</label>
                    <input type="email" required className="w-full bg-[#050505] border border-white/10 rounded-xl p-4 outline-none focus:border-teal-500 transition-colors text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Message</label>
                    <textarea required rows="4" className="w-full bg-[#050505] border border-white/10 rounded-xl p-4 outline-none focus:border-teal-500 transition-colors text-white resize-none"></textarea>
                  </div>
                  <button type="submit" className="w-full bg-white text-[#050505] hover:bg-slate-200 font-bold py-4 rounded-xl transition-colors">
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
