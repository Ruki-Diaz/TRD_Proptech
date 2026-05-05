import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { FALLBACK_IMAGE } from '../utils/helpers';

const ImageGallery = ({ images = [] }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Fallback to placeholder if no images exist
  const safeImages = images.length > 0 
    ? images 
    : [FALLBACK_IMAGE];

  const handleNext = (e) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev === safeImages.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev === 0 ? safeImages.length - 1 : prev - 1));
  };

  // Keyboard Navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') handleNext(e);
      if (e.key === 'ArrowLeft') handlePrev(e);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, safeImages.length]);

  return (
    <>
      {/* Main UI Block */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-8 w-full relative group">
        
        {/* Main Hero Shot */}
        <div 
          onClick={() => setLightboxOpen(true)}
          className="w-full h-[300px] md:h-[500px] lg:h-[600px] rounded-2xl overflow-hidden bg-slate-100 cursor-zoom-in relative group"
        >
          <img 
            src={safeImages[activeIdx]} 
            alt="Property Main View" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" 
            onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }}
          />
          <div className="absolute top-4 right-4 bg-slate-900/60 backdrop-blur text-white px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center shadow-lg opacity-0 group-hover:opacity-100 transition duration-300">
            <Maximize2 className="w-4 h-4 mr-2" /> View Fullscreen
          </div>
          <div className="absolute top-4 left-4 bg-slate-900/60 backdrop-blur text-white px-3 py-1.5 rounded-lg text-sm font-bold tracking-widest uppercase">
            {activeIdx + 1} / {safeImages.length}
          </div>
          
          {/* Overlay Navigation (Desktop Hero) */}
          {safeImages.length > 1 && (
             <>
                <button onClick={handlePrev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition z-10">
                   <ChevronLeft className="w-6 h-6" />
                </button>
                <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition z-10">
                   <ChevronRight className="w-6 h-6" />
                </button>
             </>
          )}
        </div>
        
        {/* Thumbnails */}
        {safeImages.length > 1 && (
          <div className="flex gap-4 overflow-x-auto mt-4 pb-2 custom-scrollbar">
            {safeImages.map((img, idx) => (
              <button 
                key={idx} 
                onClick={() => setActiveIdx(idx)}
                className={`w-32 h-24 flex-shrink-0 rounded-xl overflow-hidden border-2 transition ${activeIdx === idx ? 'border-teal-600 ring-2 ring-teal-600/20' : 'border-transparent opacity-70 hover:opacity-100'}`}
              >
                <img 
                  src={img} 
                  className="w-full h-full object-cover" 
                  alt={`Thumbnail ${idx+1}`} 
                  onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal overlay */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-200">
           {/* Top Actions */}
           <div className="absolute top-0 w-full p-4 flex justify-between items-center z-[110]">
              <div className="text-white/80 font-semibold tracking-wider bg-slate-800/50 px-4 py-2 rounded-xl">
                 {activeIdx + 1} / {safeImages.length}
              </div>
              <button 
                onClick={() => setLightboxOpen(false)}
                className="bg-white/10 hover:bg-rose-500/80 text-white p-3 rounded-full backdrop-blur transition"
              >
                 <X className="w-6 h-6" />
              </button>
           </div>
           
           {/* Center Canvas */}
           <div className="relative w-full h-[80vh] flex items-center justify-center px-4 md:px-16" onClick={() => setLightboxOpen(false)}>
              <img 
                 src={safeImages[activeIdx]} 
                 className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-lg"
                 alt="Property Fullscreen"
                 onClick={(e) => e.stopPropagation()}
                 onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }}
              />
              
              {safeImages.length > 1 && (
                <>
                  <button onClick={handlePrev} className="absolute left-4 md:left-12 bg-white/10 hover:bg-white/20 text-white p-4 rounded-full backdrop-blur transition drop-shadow-xl z-[110]">
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                  <button onClick={handleNext} className="absolute right-4 md:right-12 bg-white/10 hover:bg-white/20 text-white p-4 rounded-full backdrop-blur transition drop-shadow-xl z-[110]">
                    <ChevronRight className="w-8 h-8" />
                  </button>
                </>
              )}
           </div>
           
           {/* Bottom Mini Thumbnails for Lightbox */}
           {safeImages.length > 1 && (
              <div className="absolute bottom-6 w-full flex justify-center gap-2 px-4 overflow-x-auto">
                 {safeImages.map((img, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setActiveIdx(idx)}
                      className={`h-16 w-24 flex-shrink-0 rounded-lg overflow-hidden transition-all duration-300 ${activeIdx === idx ? 'ring-2 ring-white scale-110 opacity-100' : 'opacity-40 hover:opacity-80'}`}
                    >
                       <img 
                         src={img} 
                         className="w-full h-full object-cover" 
                         alt="Thumb" 
                         onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }}
                       />
                    </button>
                 ))}
              </div>
           )}
        </div>
      )}
    </>
  );
};

export default ImageGallery;
