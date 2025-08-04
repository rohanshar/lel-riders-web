import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import HomePage from './components/HomePage';
import WavesSummary from './components/WavesSummary';
import WaveDetail from './components/WaveDetail';
import RidersList from './components/RidersList';
import IndianRidersTimeline from './components/IndianRidersTimeline';
import IndianRidersProgressPage from './components/IndianRidersProgressPage';
import RouteMap from './components/RouteMap';
import { Menu, X, Users, Flag, Home, Grid3x3, Map } from 'lucide-react';
import { usePageTracking } from './hooks/useAnalytics';
import { GlobalDataProvider } from './contexts';
import ErrorBoundary from './components/ErrorBoundary';
import AsyncBoundary from './components/AsyncBoundary';
import { buildInfo } from './buildInfo';
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
              <Route path="/indian-riders" element={<AsyncBoundary><IndianRidersTimeline /></AsyncBoundary>} />
              <Route path="/indian-riders/progress" element={<AsyncBoundary><IndianRidersProgressPage /></AsyncBoundary>} />
            </Routes>
          </div>
        </main>

        <footer className="bg-gray-900 text-white mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Feedback Section */}
            <div className="bg-gray-800 rounded-lg p-6 mb-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-center md:text-left">
                  <h3 className="text-lg font-semibold mb-2">Help us improve this tracker</h3>
                  <p className="text-gray-300 text-sm">
                    Found a bug? Have suggestions? Know a rider's social profile?
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Share rider social media links with their rider number so fans can cheer them on!
                  </p>
                </div>
                <a 
                  href="https://wa.me/919899054441?text=Hi%2C%20I%20have%20feedback%20about%20the%20LEL%202025%20Tracker"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-md font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  Send WhatsApp
                </a>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <div className="flex flex-col sm:flex-row items-center gap-4">
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
                  <div className="hidden sm:block h-8 w-px bg-gray-700"></div>
                  <a 
                    href="https://www.ultra-rides.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 group"
                  >
                    <img 
                      src="/ultra-rides-logo.png" 
                      alt="UltraRides" 
                      className="h-8 w-auto opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                        UltraRides
                      </p>
                      <p className="text-xs text-gray-400">
                        Where Every Ride Counts
                      </p>
                    </div>
                  </a>
                </div>
              </div>
              <div className="text-center md:text-right">
                <p className="text-sm text-gray-400">
                  © {new Date().getFullYear()} Enduroco.in. All rights reserved.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Build: {buildInfo.commitId.substring(0, 8)} • {new Date(buildInfo.buildTime).toLocaleString('en-GB', { 
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
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
        <GlobalDataProvider>
          <AppContent />
        </GlobalDataProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;