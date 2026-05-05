import React, { createContext, useContext, useState, useEffect } from 'react';

const SavedPropertiesContext = createContext();

export const useSavedProperties = () => {
  return useContext(SavedPropertiesContext);
};

export const SavedPropertiesProvider = ({ children }) => {
  const [savedProperties, setSavedProperties] = useState(() => {
    try {
      const db = localStorage.getItem('saved_properties');
      return db ? JSON.parse(db) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('saved_properties', JSON.stringify(savedProperties));
  }, [savedProperties]);

  const isSaved = (propertyId) => {
    return savedProperties.some(p => p.id === propertyId);
  };

  const toggleSaveProperty = (property, e = null) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSavedProperties(prev => {
      const exists = prev.some(p => p.id === property.id);
      if (exists) {
        return prev.filter(p => p.id !== property.id);
      } else {
        // Enforce max 50 saves to avoid excessive localStorage
        const newArr = [property, ...prev];
        if (newArr.length > 50) newArr.pop();
        return newArr;
      }
    });
  };

  return (
    <SavedPropertiesContext.Provider value={{ savedProperties, toggleSaveProperty, isSaved }}>
      {children}
    </SavedPropertiesContext.Provider>
  );
};
