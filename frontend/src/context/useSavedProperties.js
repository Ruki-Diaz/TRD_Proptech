import { useContext } from 'react';
import { SavedPropertiesContext } from './savedPropertiesContextInstance';

export const useSavedProperties = () => {
  return useContext(SavedPropertiesContext);
};
