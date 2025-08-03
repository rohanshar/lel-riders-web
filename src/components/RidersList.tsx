import React, { useState, useMemo } from 'react';
import { useGlobalData } from '../contexts';

const RidersList: React.FC = () => {
  const { 
    enhancedRiders,
    loading,
    errors
  } = useGlobalData();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortByLocal, setSortByLocal] = useState<'name' | 'rider_no'>('rider_no');

  // Filter and sort riders locally
  const filteredAndSortedRiders = useMemo(() => {
    let filtered = enhancedRiders.filter(rider => 
      rider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rider.rider_no.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      if (sortByLocal === 'name') {
        return a.name.localeCompare(b.name);
      }
      // Natural sort for rider numbers
      const aMatch = a.rider_no.match(/^([A-Z]+)(\d+)$/);
      const bMatch = b.rider_no.match(/^([A-Z]+)(\d+)$/);
      
      if (aMatch && bMatch) {
        const [, aPrefix, aNum] = aMatch;
        const [, bPrefix, bNum] = bMatch;
        const prefixCompare = aPrefix.localeCompare(bPrefix);
        if (prefixCompare !== 0) return prefixCompare;
        return parseInt(aNum) - parseInt(bNum);
      }
      
      return a.rider_no.localeCompare(b.rider_no);
    });
  }, [enhancedRiders, searchTerm, sortByLocal]);

  if (loading.riders) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (errors.riders) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-red-600 text-center">
        <p className="text-xl font-semibold">Error loading riders</p>
        <p className="mt-2">{errors.riders.message}</p>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">All Riders</h1>
        <p className="text-gray-600">Total riders: {enhancedRiders.length}</p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name or rider number..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={sortByLocal}
            onChange={(e) => setSortByLocal(e.target.value as 'name' | 'rider_no')}
          >
            <option value="rider_no">Sort by Rider No</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rider No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedRiders.map((rider) => (
                <tr key={rider.rider_no} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {rider.rider_no}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {rider.name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredAndSortedRiders.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No riders found matching "{searchTerm}"
        </div>
      )}
    </div>
  );
};

export default RidersList;