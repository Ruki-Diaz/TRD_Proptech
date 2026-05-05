import React from 'react';

const PageShell = ({ children, className = '' }) => {
  return (
    <div className={`pt-24 pb-20 min-h-screen ${className}`}>
      {children}
    </div>
  );
};

export default PageShell;
