import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { financeService } from '../services';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const FinanceContext = createContext();

export const FinanceProvider = ({ children }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [taxonomies, setTaxonomies] = useState({
    sections: [],
    categories: [],
    channels: [],
    units: [],
    loaded: false,
    loading: false
  });

  const fetchTaxonomies = useCallback(async () => {
    if (!user) return;
    
    setTaxonomies(prev => ({ ...prev, loading: true }));
    try {
      const data = await financeService.getTaxonomies();
      setTaxonomies({
        ...data,
        loaded: true,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching taxonomies:', error);
      addToast('Error loading dynamic taxonomies', 'error');
      setTaxonomies(prev => ({ ...prev, loading: false }));
    }
  }, [user, addToast]);

  useEffect(() => {
    if (user && !taxonomies.loaded) {
      fetchTaxonomies();
    }
  }, [user, taxonomies.loaded, fetchTaxonomies]);

  const getSection = (sectionId) => taxonomies.sections.find(s => s.id === sectionId);
  const getCategory = (categoryId) => taxonomies.categories.find(c => c.id === categoryId);
  
  const getCategoriesBySection = (sectionId) => 
    taxonomies.categories.filter(c => c.section_id === sectionId);

  const value = {
    ...taxonomies,
    fetchTaxonomies,
    getSection,
    getCategory,
    getCategoriesBySection
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
