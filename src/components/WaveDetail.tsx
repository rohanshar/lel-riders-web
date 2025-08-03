import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGlobalData } from '../contexts';
import { trackWaveView } from '../hooks/useAnalytics';

const WaveDetail: React.FC = () => {
  const { wave } = useParams<{ wave: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const { 
    loading,
    errors,
    getWaveByCode
  } = useGlobalData();

  const waveData = getWaveByCode(wave || '');
  const riders = waveData?.riders || [];

  useEffect(() => {
    // Track wave view
    if (wave) {
      trackWaveView(wave);
    }
  }, [wave]);

  const filteredRiders = useMemo(() => {
    const searchFiltered = riders.filter(rider =>
      rider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rider.rider_no.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Natural sort for rider numbers
    return searchFiltered.sort((a, b) => {
      const aMatch = a.rider_no.match(/^([A-Z]+)(\d+)$/);
      const bMatch = b.rider_no.match(/^([A-Z]+)(\d+)$/);
      
      if (aMatch && bMatch) {
        const [, , aNum] = aMatch;
        const [, , bNum] = bMatch;
        return parseInt(aNum) - parseInt(bNum);
      }
      
      return a.rider_no.localeCompare(b.rider_no);
    });
  }, [riders, searchTerm]);

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
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link to="/" className="text-blue-600 hover:text-blue-800">Home</Link>
          </li>
          <li>
            <span className="mx-2 text-gray-400">/</span>
          </li>
          <li>
            <span className="text-gray-700">Wave {wave}</span>
          </li>
        </ol>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Wave {wave} Riders</h1>
        <p className="text-gray-600">Total riders in wave {wave}: {riders.length}</p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search riders in this wave..."
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
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
              {filteredRiders.map((rider) => (
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

      {filteredRiders.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No riders found {searchTerm ? `matching "${searchTerm}"` : `in wave ${wave}`}
        </div>
      )}

      <div className="mt-8 flex gap-4 justify-center">
        <Link 
          to="/" 
          className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Back to Wave Summary
        </Link>
        <Link 
          to="/all-riders" 
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          View All Riders
        </Link>
      </div>
    </div>
  );
};

export default WaveDetail;