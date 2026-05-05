import React from 'react';

export const PropertyCardSkeleton = () => {
  return (
    <div className="h-[450px] rounded-[2rem] bg-[#111] border border-white/5 animate-pulse overflow-hidden flex flex-col">
      <div className="h-2/3 bg-white/5 w-full relative">
         <div className="absolute top-5 left-5 w-20 h-6 bg-white/10 rounded-md"></div>
      </div>
      <div className="p-6 flex-1 flex flex-col justify-end gap-4">
        <div className="flex justify-between items-center">
           <div className="h-8 bg-white/10 rounded-md w-1/3"></div>
           <div className="h-5 bg-white/10 rounded-md w-1/4"></div>
        </div>
        <div className="h-6 bg-white/10 rounded-md w-3/4"></div>
        <div className="h-4 bg-white/10 rounded-md w-1/2"></div>
      </div>
    </div>
  );
};

export const PropertyDetailSkeleton = () => {
  return (
    <div className="container mx-auto px-4 pt-8 animate-pulse">
       <div className="w-32 h-4 bg-white/5 rounded mb-6"></div>
       <div className="w-full h-[60vh] bg-[#111] rounded-[2rem] mb-8 border border-white/5"></div>
       
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
             <div className="bg-[#111] p-8 rounded-[2rem] border border-white/5">
                <div className="flex gap-2 mb-4">
                   <div className="w-20 h-6 bg-white/10 rounded"></div>
                   <div className="w-24 h-6 bg-white/10 rounded"></div>
                </div>
                <div className="w-3/4 h-10 bg-white/10 rounded mb-4"></div>
                <div className="w-1/2 h-6 bg-white/10 rounded"></div>
                <div className="flex gap-4 mt-8 border-t border-white/5 pt-8">
                   <div className="w-24 h-10 bg-white/10 rounded-xl"></div>
                   <div className="w-24 h-10 bg-white/10 rounded-xl"></div>
                   <div className="w-24 h-10 bg-white/10 rounded-xl"></div>
                </div>
             </div>
             
             <div className="bg-[#111] p-8 rounded-[2rem] border border-white/5">
                <div className="w-40 h-8 bg-white/10 rounded mb-6"></div>
                <div className="space-y-3">
                   <div className="w-full h-4 bg-white/5 rounded"></div>
                   <div className="w-full h-4 bg-white/5 rounded"></div>
                   <div className="w-5/6 h-4 bg-white/5 rounded"></div>
                   <div className="w-full h-4 bg-white/5 rounded"></div>
                   <div className="w-4/5 h-4 bg-white/5 rounded"></div>
                </div>
             </div>
          </div>
          
          <div className="lg:col-span-1">
             <div className="bg-[#111] p-8 rounded-[2rem] border border-white/5">
                <div className="w-20 h-4 bg-white/5 rounded mb-2"></div>
                <div className="w-48 h-10 bg-white/10 rounded mb-8"></div>
                <div className="w-full h-16 bg-white/5 rounded-2xl mb-8"></div>
                <div className="space-y-4">
                   <div className="w-full h-14 bg-white/10 rounded-2xl"></div>
                   <div className="w-full h-14 bg-white/10 rounded-2xl"></div>
                   <div className="w-full h-14 bg-white/10 rounded-2xl"></div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};
