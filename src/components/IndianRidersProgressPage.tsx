import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import IndianRidersProgressVertical from './IndianRidersProgressVertical';

const IndianRidersProgressPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Indian Riders Progress</h1>
        <p className="mt-2 text-gray-600">Visual representation of all Indian riders' positions on the route</p>
      </div>
      
      <div className="flex items-center gap-4">
        <Link to="/indian-riders">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Timeline
          </Button>
        </Link>
      </div>
      
      <IndianRidersProgressVertical />
    </div>
  );
};

export default IndianRidersProgressPage;