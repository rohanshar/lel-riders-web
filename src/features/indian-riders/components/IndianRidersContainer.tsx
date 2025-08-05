import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Search, Loader2, ChevronDown, ChevronUp, BarChart3, RefreshCw, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
// Progress view moved to separate route

// Local components
import { StatisticsPanel } from './statistics/StatisticsPanel';
import { TimeDisplay } from './shared/TimeDisplay';
import { RefreshButton } from './shared/RefreshButton';
import { LatestUpdatesCard } from './latest-updates/LatestUpdatesCard';
import { TimelineView } from './timeline/TimelineView';
import { RiderDetailDialog } from './rider-detail/RiderDetailDialog';

// Hooks
import { useIndianRidersData } from '../hooks/useIndianRidersData';
import { useRiderSearch } from '../hooks/useRiderSearch';
import { useLatestUpdates } from '../hooks/useLatestUpdates';
import { getCurrentUKTime } from '../utils/timeFormatters';

export const IndianRidersContainer: React.FC = () => {
  const { 
    riders, 
    statistics, 
    loading, 
    error, 
    lastUpdateTime, 
    refreshData 
  } = useIndianRidersData();
  
  const { searchTerm, setSearchTerm, filteredRiders } = useRiderSearch(riders);
  const latestUpdates = useLatestUpdates(riders);
  
  const [selectedRider, setSelectedRider] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [londonTime, setLondonTime] = useState(getCurrentUKTime());
  // Removed tabs - progress view moved to separate route
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  
  // Update London time every second
  useEffect(() => {
    const updateLondonTime = () => {
      setLondonTime(getCurrentUKTime());
    };
    
    updateLondonTime();
    const interval = setInterval(updateLondonTime, 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Dynamic time since last update
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>('Never');
  
  useEffect(() => {
    const updateTimer = () => {
      if (!lastUpdateTime) {
        setTimeSinceUpdate('Never');
        return;
      }
      
      const now = new Date();
      const diff = now.getTime() - lastUpdateTime.getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      
      if (seconds < 60) {
        setTimeSinceUpdate(`just now`);
      } else if (minutes < 60) {
        if (minutes === 1) {
          setTimeSinceUpdate(`1 min ago`);
        } else {
          setTimeSinceUpdate(`${minutes} mins ago`);
        }
      } else if (minutes < 24 * 60) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (mins === 0) {
          setTimeSinceUpdate(`${hours}h ago`);
        } else {
          setTimeSinceUpdate(`${hours}h ${mins}m ago`);
        }
      } else {
        const days = Math.floor(minutes / (24 * 60));
        setTimeSinceUpdate(`${days} day${days === 1 ? '' : 's'} ago`);
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lastUpdateTime]);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    console.log('[Manual Refresh] Starting refresh at', new Date().toISOString());
    try {
      await refreshData();
      console.log('[Manual Refresh] Completed successfully');
    } catch (error) {
      console.error('[Manual Refresh] Failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const handleSelectRider = (riderId: string | null) => {
    if (riderId) {
      const rider = riders.find(r => r.rider_no === riderId);
      setSelectedRider(rider || null);
    } else {
      setSelectedRider(null);
    }
  };
  
  // Check if data is stale (more than 10 minutes old)
  const isDataStale = lastUpdateTime && (new Date().getTime() - lastUpdateTime.getTime()) > 600000;
  
  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
  
  if (error) return (
    <div className="flex justify-center items-center min-h-screen">
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error loading data</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
  
  return (
    <div className={`space-y-6 ${isDataStale ? 'bg-orange-50' : ''}`}>
      {/* Floating Refresh Overlay */}
      {isDataStale && !isRefreshing && (
        <div 
          className="fixed inset-0 z-40 pointer-events-none"
          style={{ 
            background: 'linear-gradient(to bottom, transparent 0%, transparent 70%, rgba(251, 146, 60, 0.05) 100%)'
          }}
        >
          <button
            onClick={handleRefresh}
            className="fixed inset-0 w-full h-full cursor-pointer pointer-events-auto group"
            aria-label="Refresh data"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-orange-500 text-white px-8 py-4 rounded-lg shadow-lg flex items-center gap-3 transform transition-all duration-200 group-hover:scale-105 group-hover:bg-orange-600">
                <RefreshCw className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold text-lg">Data is stale</div>
                  <div className="text-sm opacity-90">Click anywhere to refresh</div>
                </div>
              </div>
            </div>
          </button>
        </div>
      )}
      
      {/* Loading Overlay */}
      {isRefreshing && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
          <div className="bg-white px-8 py-6 rounded-lg shadow-xl flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            <span className="text-lg font-medium">Refreshing data...</span>
          </div>
        </div>
      )}
      
      {/* Navigation to Progress View */}
      <div className="flex justify-end mb-4">
        <Link to="/indian-riders/progress">
          <Button variant="outline" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            View Progress Chart
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
          {/* Event Cancellation Notice */}
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-900">Event Cancelled</h3>
                <p className="mt-1 text-sm text-red-800">
                  The London-Edinburgh-London 2025 event has been called off. All riders have been notified to stop and make arrangements to return safely.
                </p>
                <p className="mt-2 text-sm text-gray-700">
                  <strong>Note:</strong> We will continue tracking southbound riders until they safely reach London.
                </p>
              </div>
            </div>
          </div>
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-primary">🇮🇳 Indian Riders</h1>
              <p className="text-sm sm:text-base text-muted-foreground">LEL 2025 - London-Edinburgh-London</p>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              <span className="font-medium">All times UK</span>
            </div>
          </div>
          
          {/* Statistics Panel - Collapsible */}
          {(
            <Card>
              <CardHeader 
                className="cursor-pointer"
                onClick={() => setIsStatsExpanded(!isStatsExpanded)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <CardTitle className="text-lg">Statistics</CardTitle>
                    {!isStatsExpanded && (
                      <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                        <span className="text-muted-foreground">
                          <span className="hidden sm:inline">Total:</span> <span className="font-semibold text-foreground">{statistics.total}</span>
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">
                          <span className="hidden sm:inline">Active:</span> <span className="font-semibold text-blue-600">{statistics.inProgress}</span>
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">
                          <span className="hidden sm:inline">DNF:</span> <span className="font-semibold text-red-600">{statistics.dnf}</span>
                        </span>
                      </div>
                    )}
                  </div>
                  {isStatsExpanded ? <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" /> : <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />}
                </div>
              </CardHeader>
              {isStatsExpanded && (
                <CardContent className="pt-0">
                  <StatisticsPanel statistics={statistics} />
                </CardContent>
              )}
            </Card>
          )}
          
          {/* Time Display and Refresh */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TimeDisplay
              londonTime={londonTime}
              lastUpdateTime={lastUpdateTime}
              timeSinceUpdate={timeSinceUpdate}
            />
            <RefreshButton
              isRefreshing={isRefreshing}
              loading={loading}
              onRefresh={handleRefresh}
            />
          </div>
          
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search riders by name or number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Timeline */}
          <div className="space-y-6">
            <TimelineView
              riders={filteredRiders}
              searchTerm={searchTerm}
              onSearch={setSearchTerm}
              selectedRiderId={selectedRider?.rider_no || null}
              onSelectRider={handleSelectRider}
            />
          </div>
          
          {/* Latest Updates */}
          <LatestUpdatesCard updates={latestUpdates} onSelectRider={handleSelectRider} />
          
          {/* Rider Detail Dialog */}
          <RiderDetailDialog
            rider={selectedRider}
            onClose={() => setSelectedRider(null)}
            allRiders={riders}
          />
      </div>
    </div>
  );
};