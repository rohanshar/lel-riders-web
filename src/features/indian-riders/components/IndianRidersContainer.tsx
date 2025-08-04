import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Search, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import IndianRidersProgressAlt from '@/components/IndianRidersProgressAlt';

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
  const [activeTab, setActiveTab] = useState("timeline");
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
  
  // Calculate time since last update
  const timeSinceUpdate = useMemo(() => {
    if (!lastUpdateTime) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - lastUpdateTime.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
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
      const rider = filteredRiders.find(r => r.rider_no === riderId);
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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="progress">Progress View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="timeline" className="space-y-6 mt-6">
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
          {activeTab === "timeline" && (
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
          <LatestUpdatesCard updates={latestUpdates} />
          
          {/* Rider Detail Dialog */}
          <RiderDetailDialog
            rider={selectedRider}
            onClose={() => setSelectedRider(null)}
            allRiders={filteredRiders}
          />
        </TabsContent>
        
        <TabsContent value="progress" className="mt-6">
          <IndianRidersProgressAlt />
        </TabsContent>
      </Tabs>
    </div>
  );
};