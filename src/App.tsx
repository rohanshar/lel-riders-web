import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import HomePage from './components/HomePage';
import WavesSummary from './components/WavesSummary';
import WaveDetail from './components/WaveDetail';
import RidersList from './components/RidersList';
import IndianRidersProgress from './components/IndianRidersProgress';
import IndianRidersTableView from './components/IndianRidersTableView';
import IndianRidersTimeline from './components/IndianRidersTimeline';
import RouteMap from './components/RouteMap';
import { Menu, X, Users, Flag, Home, Grid3x3, Map } from 'lucide-react';
import { usePageTracking } from './hooks/useAnalytics';
import { RiderDataProvider } from './contexts';
import ErrorBoundary from './components/ErrorBoundary';
import AsyncBoundary from './components/AsyncBoundary';

function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/waves', label: 'Waves', icon: Grid3x3 },
    { path: '/route', label: 'Route Map', icon: Map },
    { path: '/all-riders', label: 'All Riders', icon: Users },
    { path: '/indian-riders', label: 'Indian Riders', icon: Flag },
  ];

  const isActive = (path: string) => {
    if (path === '/indian-riders') {
      return location.pathname.startsWith('/indian-riders');
    }
    return location.pathname === path;
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="https://www.enduroco.in/static/media/logo_orange.af42cec0c79a012b7028.png" 
              alt="Enduroco" 
              className="h-10 w-auto"
            />
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900">Enduroco</span>
              <span className="text-xs text-gray-600 -mt-1">LEL 2025 Tracker</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(path)
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
            <a
              href="https://enduroco.in"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Main Site
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden pb-4">
            <div className="flex flex-col gap-2">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium transition-colors ${
                    isActive(path)
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              ))}
              <a
                href="https://enduroco.in"
                className="flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Main Site
              </a>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

function AppContent() {
  usePageTracking(); // Track page views
  
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<AsyncBoundary><HomePage /></AsyncBoundary>} />
              <Route path="/waves" element={<AsyncBoundary><WavesSummary /></AsyncBoundary>} />
              <Route path="/wave/:wave" element={<AsyncBoundary><WaveDetail /></AsyncBoundary>} />
              <Route path="/route" element={<AsyncBoundary><RouteMap /></AsyncBoundary>} />
              <Route path="/all-riders" element={<AsyncBoundary><RidersList /></AsyncBoundary>} />
              <Route path="/indian-riders" element={<AsyncBoundary><IndianRidersProgress /></AsyncBoundary>} />
              <Route path="/indian-riders/table" element={<AsyncBoundary><IndianRidersTableView /></AsyncBoundary>} />
              <Route path="/indian-riders/timeline" element={<AsyncBoundary><IndianRidersTimeline /></AsyncBoundary>} />
            </Routes>
          </div>
        </main>

        <footer className="bg-gray-900 text-white mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <div className="flex items-center gap-3">
                  <img 
                    src="https://www.enduroco.in/static/media/logo_orange.af42cec0c79a012b7028.png" 
                    alt="Enduroco" 
                    className="h-8 w-auto"
                  />
                  <div>
                    <p className="text-lg font-semibold">
                      Enduroco<span className="text-orange-500">.in</span>
                    </p>
                    <p className="text-gray-400 text-sm">
                      Your endurance cycling companion
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-center md:text-right">
                <p className="text-sm text-gray-400">
                  © {new Date().getFullYear()} Enduroco.in. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <RiderDataProvider>
          <AppContent />
        </RiderDataProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;