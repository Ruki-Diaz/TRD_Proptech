import React from 'react';

const Badge = ({ children, variant = 'default', className = '' }) => {
  const baseStyle = "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold tracking-tight shadow-sm";
  
  const variants = {
    default: "bg-slate-100 text-slate-800",
    verified: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    featured: "bg-amber-50 text-amber-700 border border-amber-200",
    purpose: "bg-white/95 backdrop-blur text-slate-900 border border-slate-100 uppercase tracking-widest",
    agent: "bg-blue-50 text-blue-700 border border-blue-100",
    owner: "bg-slate-100 text-slate-600 border border-slate-200",
  };

  return (
    <span className={`${baseStyle} ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
