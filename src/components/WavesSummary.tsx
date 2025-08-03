import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGlobalData } from '../contexts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Users, Search, TrendingUp, Activity, ChevronLeft } from 'lucide-react';

const WavesSummary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { 
    waves,
    loading, 
    errors,
    globalStatistics
  } = useGlobalData();

  // Filter waves by search term
  const filteredWaves = searchTerm
    ? waves.filter(wave => 
        wave.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : waves;

  // Calculate statistics from global data
  const totalRiders = globalStatistics.totalRiders;
  const averageRidersPerWave = waves.length > 0 ? totalRiders / waves.length : 0;
  const largestWave = waves.reduce((max, wave) => 
    wave.riders.length > (max?.riders?.length || 0) ? wave : max, 
    waves[0]
  );

  if (loading.riders) return (
    <div className="flex justify-center items-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  if (errors.riders) return (
    <div className="flex justify-center items-center min-h-[400px]">
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error loading riders</CardTitle>
          <CardDescription>{errors.riders.message}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Riders</CardTitle>
            <Users className="h-4 w-4 text-primary opacity-50" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRiders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Registered participants
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Waves</CardTitle>
            <Activity className="h-4 w-4 text-primary opacity-50" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{waves.length}</div>
            <p className="text-xs text-muted-foreground">
              Starting groups
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average per Wave</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary opacity-50" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(averageRidersPerWave)}</div>
            <p className="text-xs text-muted-foreground">
              Riders per wave
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Largest Wave</CardTitle>
            <Users className="h-4 w-4 text-primary opacity-50" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Wave {largestWave?.code || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              {largestWave?.riders?.length || 0} riders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Wave Summary</h1>
          <p className="text-muted-foreground">Click on any wave to see its riders</p>
        </div>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search waves..."
            className="pl-8 w-full sm:w-[250px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Waves Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredWaves.map((wave) => (
          <Link key={wave.code} to={`/wave/${wave.code}`}>
            <Card className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer h-full hover:border-primary">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-2 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">{wave.code}</span>
                </div>
                <CardTitle className="text-lg">Wave {wave.code}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {wave.riders.length} riders
                </Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredWaves.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No waves found matching "{searchTerm}"</p>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-center gap-4 pt-4">
        <Link to="/">
          <Button variant="outline" size="lg" className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
        <Link to="/all-riders">
          <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90">
            <Users className="h-4 w-4" />
            View All Riders
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default WavesSummary;