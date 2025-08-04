import { useState, useMemo } from 'react';
import type { Rider } from '../types';
import { calculateRiderDistance } from '../utils/riderCalculations';

interface UseRiderSearchReturn {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredRiders: Rider[];
}

export const useRiderSearch = (riders: Rider[]): UseRiderSearchReturn => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredRiders = useMemo(() => {
    let filtered = riders;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((rider: Rider) => 
        rider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rider.rider_no.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort riders by distance (descending)
    filtered = [...filtered].sort((a: Rider, b: Rider) => {
      return calculateRiderDistance(b) - calculateRiderDistance(a);
    });
    
    return filtered;
  }, [riders, searchTerm]);
  
  return {
    searchTerm,
    setSearchTerm,
    filteredRiders
  };
};