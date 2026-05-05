import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ShieldCheck, Users, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="bg-[#050505] min-h-screen text-slate-200 py-20 relative overflow-hidden">
      <Helmet>
        <title>About Us | SquareLanka</title>
      </Helmet>
      
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-rose-600/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="container mx-auto px-6 max-w-5xl relative z-10">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6">Redefining <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-white">Real Estate</span></h1>
          <p className="text-lg md:text-xl text-slate-400 font-light max-w-2xl mx-auto leading-relaxed">
            SquareLanka was built with a singular vision: to create the most premium, transparent, and seamless property marketplace in Sri Lanka.
          </p>
        </div>

        <div className="bg-[#111] border border-white/5 rounded-[2.5rem] p-8 md:p-16 mb-20 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px]"></div>
          <h2 className="text-3xl font-black text-white mb-6 tracking-tight">Our Mission</h2>
          <p className="text-slate-400 text-lg leading-relaxed font-light mb-6">
            We believe that finding a home or investment property should not be a hassle. It should be an inspiring journey. By combining cutting-edge technology, stunning design, and a curated network of elite agents, we bring you a platform where quality meets trust.
          </p>
          <p className="text-slate-400 text-lg leading-relaxed font-light">
            Whether you are searching for a beachfront villa in Galle, a luxury apartment in Colombo, or a serene plot of land in Kandy, SquareLanka is your definitive guide.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {[
              { icon: ShieldCheck, title: "Uncompromising Trust", desc: "Every listing is verified, ensuring you only deal with authentic properties and authorized agents." },
              { icon: Users, title: "Elite Network", desc: "We partner exclusively with top-tier real estate professionals who understand the nuances of the local market." },
              { icon: TrendingUp, title: "Modern Technology", desc: "Our platform is built for speed, aesthetics, and usability, setting a new standard for proptech in the region." }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white/5 p-8 rounded-[2rem] border border-white/5 hover:border-teal-500/30 transition-colors">
                <feature.icon className="w-10 h-10 text-teal-400 mb-6" />
                <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-slate-400 font-light leading-relaxed">{feature.desc}</p>
              </div>
            ))}
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-black text-white mb-6 tracking-tight">Ready to start your journey?</h2>
          <Link to="/properties" className="inline-flex items-center justify-center bg-teal-500 text-[#050505] hover:bg-teal-400 font-bold px-8 py-4 rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(20,184,166,0.2)] hover:-translate-y-1">
            Explore Portfolio <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default About;
