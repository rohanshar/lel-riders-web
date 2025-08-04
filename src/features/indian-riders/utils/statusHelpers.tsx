import React from 'react';
import { Activity, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Rider } from '../types';
import { shouldBeMarkedDNF } from './riderCalculations';

export const getStatusBadge = (status: string, rider?: Rider) => {
  // Check if rider should be marked as DNF due to 12+ hours without update
  if (rider && shouldBeMarkedDNF(rider)) {
    return <Badge className="bg-red-500">DNF</Badge>;
  }
  
  switch (status) {
    case 'in_progress':
      return <Badge className="bg-blue-500">In Progress</Badge>;
    case 'finished':
      return <Badge className="bg-green-500">Finished</Badge>;
    case 'dnf':
      return <Badge className="bg-red-500">DNF</Badge>;
    case 'not_started':
      return <Badge className="bg-gray-500">Not Started</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export const getStatusIcon = (status: string, rider?: Rider, averageSpeed?: number) => {
  // Check if rider should be marked as DNF
  if (rider && shouldBeMarkedDNF(rider)) {
    return <XCircle className="h-4 w-4 text-red-500" />;
  }
  
  // For in-progress riders, check speed
  if (status === 'in_progress' && averageSpeed !== undefined) {
    if (averageSpeed < 15) {
      return <Activity className="h-4 w-4 text-yellow-500" />; // Warning - slow speed
    }
  }
  
  switch (status) {
    case 'in_progress':
      return <Activity className="h-4 w-4 text-blue-500" />;
    case 'finished':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'dnf':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'not_started':
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
    default:
      return null;
  }
};