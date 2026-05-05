import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Building, ShieldCheck, TrendingUp, Users, ArrowRight, Star, ArrowUpRight, CheckCircle2, PhoneCall, Key, HeartHandshake } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useTransform } from 'framer-motion';
import { fetchProperties } from '../services/api';
import PropertyCard from '../components/PropertyCard';

// --- Framer Motion Variants ---
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
};

const Home = () => {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [search, setSearch] = useState({ district: '', type: '', purpose: '', max_price: '' });
  
  const { scrollYProgress } = useScroll();
  const yHeroText = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacityHeroText = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    fetchProperties().then(res => {
      const featuredProps = res.data.filter(p => p.featured).slice(0, 6);
      if(featuredProps.length > 0) {
        setFeatured(featuredProps);
      } else {
        setFeatured(res.data.slice(0, 6));
      }
    }).catch(err => console.error(err));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.district) params.append('district', search.district);
    if (search.type) params.append('type', search.type);
    if (search.purpose) params.append('purpose', search.purpose);
    if (search.max_price) params.append('max_price', search.max_price);
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <div className="bg-[#050505] text-slate-200 overflow-hidden font-sans selection:bg-teal-500/30 selection:text-teal-200">
      <Helmet>
        <title>SquareLanka | Premium Real Estate in Sri Lanka</title>
        <meta name="description" content="Find your next property in Sri Lanka. Buy, rent, and list verified properties." />
      </Helmet>
      
      {/* -------------------- HERO SECTION -------------------- */}
      <section className="relative min-h-[90vh] flex items-center justify-center border-b border-white/5 overflow-hidden pt-20 pb-20">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[#050505] z-10 opacity-80" style={{ backgroundImage: 'radial-gradient(circle at center, transparent 0%, #050505 80%)' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/60 via-transparent to-[#050505] z-10"></div>
          
          <motion.img 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1.02, opacity: 0.4 }}
            transition={{ duration: 3, ease: "easeOut" }}
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
            alt="Luxury Villa Background" 
            className="w-full h-full object-cover"
          />
          
          {/* Animated Glow Orbs */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-teal-600/30 rounded-full blur-[120px] mix-blend-screen"
          />
          <motion.div 
            animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[150px] mix-blend-screen"
          />

          {/* Floating Abstract Cards */}
          <motion.div 
            animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[30%] left-[10%] w-64 h-32 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hidden xl:block shadow-2xl"
          >
             <div className="w-10 h-10 bg-teal-500/20 rounded-lg mb-2 flex items-center justify-center"><CheckCircle2 className="text-teal-400 w-5 h-5"/></div>
             <div className="h-3 w-3/4 bg-white/20 rounded mb-2"></div>
             <div className="h-2 w-1/2 bg-white/10 rounded"></div>
          </motion.div>

          <motion.div 
            animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[20%] right-[10%] w-72 h-40 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hidden xl:block shadow-2xl"
          >
             <div className="flex gap-4 mb-4">
                <div className="w-16 h-16 bg-white/10 rounded-xl"></div>
                <div className="flex-1 flex flex-col justify-center gap-2">
                   <div className="h-3 w-full bg-white/20 rounded"></div>
                   <div className="h-2 w-2/3 bg-white/10 rounded"></div>
                </div>
             </div>
             <div className="h-8 w-full bg-teal-500/20 rounded-lg border border-teal-500/30"></div>
          </motion.div>
        </div>
        
        <motion.div 
          style={{ y: yHeroText, opacity: opacityHeroText }}
          className="relative z-20 w-full max-w-5xl px-4 flex flex-col items-center mt-10"
        >
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="flex flex-col items-center text-center">
            
            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 tracking-tighter leading-[1.1] drop-shadow-2xl">
              Find your next <br/>
              <span className="relative">
                <span className="absolute -inset-1 blur-xl bg-gradient-to-r from-teal-400/40 via-teal-200/40 to-white/40 opacity-50"></span>
                <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-teal-100 to-white">property in Sri Lanka</span>
              </span>
            </motion.h1>
            
            <motion.p variants={fadeUp} className="text-lg md:text-xl text-slate-300 mb-10 max-w-3xl font-light leading-relaxed drop-shadow-md">
              The premier platform for buying, renting, and listing verified properties. Experience a seamless journey with TRD Proptech.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4 mb-16">
               <Link to="/properties" className="bg-teal-500 hover:bg-teal-400 text-[#050505] font-bold px-8 py-4 rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:-translate-y-1 flex items-center">
                 Browse Properties <ArrowRight className="w-5 h-5 ml-2" />
               </Link>
               <Link to="/post-property" className="bg-white/10 hover:bg-white/20 text-white border border-white/10 font-bold px-8 py-4 rounded-full transition-all duration-300 hover:-translate-y-1 flex items-center backdrop-blur-md">
                 List Your Property
               </Link>
            </motion.div>
            
            {/* Advanced Search Bar */}
            <motion.div variants={fadeUp} className="w-full bg-white/5 backdrop-blur-2xl p-4 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/10 relative z-30 group hover:border-white/20 transition-all duration-500">
              <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
                <div className="flex flex-col text-left">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">City / District</label>
                  <div className="relative bg-[#050505]/50 border border-white/10 rounded-xl px-4 py-3 hover:border-teal-500/50 transition-colors">
                    <select className="bg-transparent w-full text-white font-medium outline-none appearance-none" value={search.district} onChange={(e) => setSearch({...search, district: e.target.value})}>
                      <option value="" className="bg-[#0f0f0f]">Any Location</option>
                      <option value="Colombo" className="bg-[#0f0f0f]">Colombo</option>
                      <option value="Kandy" className="bg-[#0f0f0f]">Kandy</option>
                      <option value="Galle" className="bg-[#0f0f0f]">Galle</option>
                      <option value="Gampaha" className="bg-[#0f0f0f]">Gampaha</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col text-left">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Property Type</label>
                  <div className="relative bg-[#050505]/50 border border-white/10 rounded-xl px-4 py-3 hover:border-teal-500/50 transition-colors">
                    <select className="bg-transparent w-full text-white font-medium outline-none appearance-none" value={search.type} onChange={(e) => setSearch({...search, type: e.target.value})}>
                      <option value="" className="bg-[#0f0f0f]">Any Type</option>
                      <option value="house" className="bg-[#0f0f0f]">House</option>
                      <option value="apartment" className="bg-[#0f0f0f]">Apartment</option>
                      <option value="land" className="bg-[#0f0f0f]">Land</option>
                      <option value="commercial" className="bg-[#0f0f0f]">Commercial</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col text-left">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Purpose</label>
                  <div className="relative bg-[#050505]/50 border border-white/10 rounded-xl px-4 py-3 hover:border-teal-500/50 transition-colors">
                    <select className="bg-transparent w-full text-white font-medium outline-none appearance-none" value={search.purpose} onChange={(e) => setSearch({...search, purpose: e.target.value})}>
                      <option value="" className="bg-[#0f0f0f]">Buy or Rent</option>
                      <option value="sale" className="bg-[#0f0f0f]">For Sale</option>
                      <option value="rent" className="bg-[#0f0f0f]">For Rent</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col text-left">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Max Price</label>
                  <div className="relative bg-[#050505]/50 border border-white/10 rounded-xl px-4 py-3 hover:border-teal-500/50 transition-colors">
                    <input type="number" placeholder="No Max" className="bg-transparent w-full text-white font-medium outline-none" value={search.max_price} onChange={(e) => setSearch({...search, max_price: e.target.value})} />
                  </div>
                </div>
                
                <button type="submit" className="lg:col-span-1 bg-white hover:bg-slate-200 text-[#050505] font-bold py-3.5 px-6 rounded-xl transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center justify-center">
                  <Search className="w-5 h-5 mr-2" /> Search
                </button>
              </form>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* -------------------- STATS/TRUST SECTION -------------------- */}
      <section className="py-20 border-b border-white/5 bg-[#0a0a0a] relative z-10">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x-0 md:divide-x divide-white/5">
            {[
              { label: 'Properties Listed', value: '2.5k+' },
              { label: 'Verified Agents', value: '150+' },
              { label: 'Districts Covered', value: '25' },
              { label: 'Enquiries Sent', value: '10k+' }
            ].map((stat, idx) => (
              <motion.div 
                key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: idx * 0.1, duration: 0.6 }}
                className="text-center px-4"
              >
                <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-white mb-3 tracking-tighter">{stat.value}</div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------- FEATURED PROPERTIES -------------------- */}
      <section className="py-32 relative">
        <div className="absolute top-40 right-0 w-[500px] h-[500px] bg-teal-600/5 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="container mx-auto px-6 max-w-7xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="mb-16 text-center md:text-left flex flex-col md:flex-row justify-between items-end gap-6">
            <motion.div variants={fadeUp} className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight mb-4">Featured <span className="text-teal-400">Properties</span></h2>
              <p className="text-slate-400 text-lg">Hand-picked exclusive properties in prime locations, offering the pinnacle of lifestyle.</p>
            </motion.div>
            <motion.div variants={fadeUp}>
              <Link to="/properties" className="group flex items-center justify-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white font-semibold transition-all shadow-[0_0_15px_rgba(255,255,255,0.02)]">
                View All <ArrowUpRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
          
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featured.length > 0 ? featured.map((prop) => (
              <motion.div key={prop.id} variants={scaleIn} className="h-full">
                <PropertyCard prop={prop} />
              </motion.div>
            )) : (
              [1,2,3].map(i => (
                <div key={i} className="h-[450px] rounded-[2rem] bg-white/5 border border-white/5 animate-pulse overflow-hidden flex flex-col">
                  <div className="h-2/3 bg-white/10 w-full" />
                  <div className="p-6 flex-1 flex flex-col justify-end gap-3"><div className="h-6 bg-white/10 rounded w-3/4" /><div className="h-4 bg-white/10 rounded w-1/2" /></div>
                </div>
              ))
            )}
          </motion.div>
        </div>
      </section>

      {/* -------------------- HOW IT WORKS -------------------- */}
      <section className="bg-[#0a0a0a] py-32 border-y border-white/5 relative overflow-hidden">
        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="text-center mb-24">
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tighter">How It <span className="text-teal-400">Works</span></motion.h2>
            <motion.p variants={fadeUp} className="text-slate-400 text-lg max-w-2xl mx-auto font-light">Your journey to finding the perfect property, simplified.</motion.p>
          </motion.div>
          
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-12 left-[10%] w-[80%] h-0.5 bg-gradient-to-r from-teal-500/0 via-teal-500/50 to-teal-500/0"></div>
            
            {[
              { icon: Search, title: "1. Search", desc: "Browse our extensive portfolio of verified listings." },
              { icon: PhoneCall, title: "2. Contact Agent", desc: "Connect directly via WhatsApp, email, or phone." },
              { icon: MapPin, title: "3. Visit Property", desc: "Schedule a viewing with our professional agents." },
              { icon: Key, title: "4. Close Deal", desc: "Secure your new home with transparent processes." }
            ].map((step, idx) => (
              <motion.div key={idx} variants={fadeUp} className="relative bg-[#111] p-8 rounded-[2rem] border border-white/5 backdrop-blur-md text-center z-10 hover:border-teal-500/30 transition-colors">
                <div className="w-16 h-16 mx-auto bg-[#050505] border border-teal-500/30 text-teal-400 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(20,184,166,0.1)]">
                  <step.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-slate-400 text-sm font-light leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* -------------------- WHY CHOOSE TRD PROPTECH -------------------- */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[300px] bg-teal-500/5 blur-[150px] pointer-events-none"></div>
        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
             <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
                <h2 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tighter">Why Choose <br/><span className="text-teal-400">TRD Proptech</span></h2>
                <div className="space-y-8">
                   {[
                     { title: "Verified Agents", desc: "We ensure every agent on our platform passes strict verification checks." },
                     { title: "Secure Enquiries", desc: "Your data and communications are protected with enterprise-grade security." },
                     { title: "Sri Lanka-Focused", desc: "A curated selection tailored specifically for the Sri Lankan premium market." },
                     { title: "Fast WhatsApp Contact", desc: "Instantly connect with listing owners directly via WhatsApp." },
                     { title: "Modern Discovery", desc: "Lightning-fast search, dynamic filters, and a seamless user interface." }
                   ].map((item, i) => (
                     <div key={i} className="flex gap-4">
                        <div className="mt-1 w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0 border border-teal-500/30"><CheckCircle2 className="w-4 h-4 text-teal-400"/></div>
                        <div>
                           <h4 className="text-white font-bold text-lg mb-1">{item.title}</h4>
                           <p className="text-slate-400 font-light">{item.desc}</p>
                        </div>
                     </div>
                   ))}
                </div>
             </motion.div>
             <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="relative h-[600px] rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-teal-900/40 to-transparent z-10 mix-blend-overlay"></div>
                <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" className="w-full h-full object-cover" alt="Modern Architecture" />
             </motion.div>
          </div>
        </div>
      </section>

      {/* -------------------- FINAL CTAS -------------------- */}
      <section className="py-24 container mx-auto px-6 max-w-7xl relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-gradient-to-br from-[#111] to-[#0a0a0a] p-12 lg:p-16 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
            <h3 className="text-3xl font-black text-white mb-4">Ready to find your dream home?</h3>
            <p className="text-slate-400 mb-8 max-w-md font-light">Start browsing properties today and take the first step towards your new life.</p>
            <Link to="/properties" className="inline-flex items-center justify-center bg-white text-[#050505] font-bold px-8 py-4 rounded-full transition-all hover:scale-105">
              Start Browsing <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-teal-900/40 to-[#111] p-12 lg:p-16 rounded-[2.5rem] border border-teal-500/20 relative overflow-hidden group">
            <HeartHandshake className="w-24 h-24 absolute right-8 bottom-8 text-teal-500/10 pointer-events-none" />
            <h3 className="text-3xl font-black text-white mb-4">Are you an Agent or Owner?</h3>
            <p className="text-teal-100/70 mb-8 max-w-md font-light">Join our network to list your properties and manage leads efficiently.</p>
            <div className="flex flex-wrap gap-4">
               <Link to="/post-property" className="inline-flex items-center justify-center bg-teal-500 text-[#050505] font-bold px-6 py-4 rounded-full transition-all hover:bg-teal-400">
                 Post Property
               </Link>
               <Link to="/register" className="inline-flex items-center justify-center bg-transparent border border-teal-500 text-teal-400 hover:bg-teal-500/10 font-bold px-6 py-4 rounded-full transition-all">
                 Register as Agent
               </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
