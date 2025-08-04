import React from 'react';
import { Users, Activity, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { StatCard } from './StatCard';

interface StatisticsPanelProps {
  statistics: {
    total: number;
    inProgress: number;
    finished: number;
    dnf: number;
    notStarted: number;
  };
}

export const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ statistics }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
      <StatCard
        title="Total Riders"
        value={statistics.total}
        description="Indian participants"
        icon={Users}
        iconColor="text-primary"
        valueColor="text-primary"
      />
      
      <StatCard
        title="In Progress"
        value={statistics.inProgress}
        description="Currently riding"
        icon={Activity}
        iconColor="text-blue-500"
        valueColor="text-blue-600"
      />
      
      <StatCard
        title="Finished"
        value={statistics.finished}
        description="Completed the ride"
        icon={CheckCircle}
        iconColor="text-green-500"
        valueColor="text-green-600"
      />
      
      <StatCard
        title="DNF"
        value={statistics.dnf}
        description="Did not finish"
        icon={XCircle}
        iconColor="text-red-500"
        valueColor="text-red-600"
      />
      
      <StatCard
        title="Not Started"
        value={statistics.notStarted}
        description="Yet to start"
        icon={AlertCircle}
        iconColor="text-gray-500"
        valueColor="text-gray-600"
      />
    </div>
  );
};