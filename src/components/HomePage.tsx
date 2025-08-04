import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Users, Flag, Grid3x3, MapPin, Trophy, Calendar, ArrowRight } from 'lucide-react';

const HomePage: React.FC = () => {
  const sections = [
    {
      title: 'Browse by Waves',
      description: 'Explore riders organized by their starting waves',
      icon: Grid3x3,
      link: '/waves',
      color: 'bg-blue-500',
      stats: '50+ waves'
    },
    {
      title: 'All Riders',
      description: 'Complete searchable list of all LEL 2025 participants',
      icon: Users,
      link: '/all-riders',
      color: 'bg-green-500',
      stats: '2,000+ riders'
    },
    {
      title: 'Indian Riders',
      description: 'Dedicated section for participants from India',
      icon: Flag,
      link: '/indian-riders',
      color: 'bg-orange-500',
      stats: 'Special listing'
    }
  ];

  const eventInfo = [
    { icon: Calendar, label: 'Date', value: 'August 3-8, 2025' },
    { icon: MapPin, label: 'Route', value: 'London to Edinburgh and back' },
    { icon: Trophy, label: 'Distance', value: '1,540 kilometers' },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-8">
        <div className="mb-6">
          <img 
            src="https://www.enduroco.in/static/media/logo_orange.af42cec0c79a012b7028.png" 
            alt="Enduroco" 
            className="h-16 w-auto mx-auto mb-4"
          />
          <p className="text-sm text-orange-600 font-semibold">ENDUROCO.IN PRESENTS</p>
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          LEL 2025 Rider Directory
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Explore the complete list of brave cyclists taking on the London-Edinburgh-London challenge
        </p>
      </div>

      {/* Event Info Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {eventInfo.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="font-semibold">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sections.map(({ title, description, icon: Icon, link, color, stats }) => (
          <Link key={link} to={link} className="group">
            <Card className="h-full hover:shadow-xl transition-all hover:scale-105 hover:border-primary cursor-pointer">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${color} bg-opacity-10 flex items-center justify-center mb-4`}>
                  <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
                </div>
                <CardTitle className="text-xl flex items-center justify-between">
                  {title}
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardTitle>
                <CardDescription className="text-base">
                  {description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-semibold text-primary">{stats}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-12 p-8 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
        <h2 className="text-2xl font-bold text-center mb-6">Event Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-primary">2,008</p>
            <p className="text-sm text-muted-foreground">Total Riders</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary">50+</p>
            <p className="text-sm text-muted-foreground">Starting Waves</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary">125</p>
            <p className="text-sm text-muted-foreground">Hour Limit</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary">1,540</p>
            <p className="text-sm text-muted-foreground">Kilometers</p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center pt-8">
        <p className="text-lg text-muted-foreground mb-4">
          Ready to explore the riders taking on this epic challenge?
        </p>
        <Link to="/waves">
          <button className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
            Browse All Waves
          </button>
        </Link>
      </div>

      {/* Ultra-Rides Promotion Banner */}
      <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left flex-1">
            <h3 className="text-2xl font-bold mb-3">Connect with Epic Cycling Events</h3>
            <p className="text-lg mb-2">
              Join a community of passionate riders. Earn homologations, digital certificates, 
              and build your legacy of achievement on two wheels.
            </p>
            <p className="text-sm opacity-90">
              Discover ultra-distance challenges, local clubs, and cycling events across India
            </p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <img 
              src="/ultra-rides-logo.png" 
              alt="UltraRides" 
              className="h-16 w-auto"
            />
            <a 
              href="https://www.ultra-rides.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all hover:scale-105 shadow-lg"
            >
              Explore UltraRides →
            </a>
          </div>
        </div>
      </div>

      {/* Enduroco Branding */}
      <div className="mt-12 text-center border-t pt-8">
        <p className="text-sm text-muted-foreground mb-4">Brought to you by</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
          <a href="https://enduroco.in" target="_blank" rel="noopener noreferrer" className="group">
            <img 
              src="https://www.enduroco.in/static/media/logo_orange.af42cec0c79a012b7028.png" 
              alt="Enduroco" 
              className="h-10 w-auto opacity-80 group-hover:opacity-100 transition-opacity"
            />
            <p className="text-xs text-muted-foreground mt-1">Your endurance cycling companion</p>
          </a>
          <div className="hidden sm:block h-12 w-px bg-gray-300"></div>
          <a href="https://www.ultra-rides.com/" target="_blank" rel="noopener noreferrer" className="group">
            <div className="text-center">
              <img 
                src="/ultra-rides-logo.png" 
                alt="UltraRides" 
                className="h-10 w-auto mx-auto opacity-80 group-hover:opacity-100 transition-opacity"
              />
              <p className="text-xs text-muted-foreground mt-1">Where Every Ride Counts</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default HomePage;