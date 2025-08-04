import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  valueColor: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  iconColor,
  valueColor
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent className="pt-1">
        <div className={`text-lg sm:text-2xl font-bold ${valueColor}`}>{value}</div>
        <p className="text-[10px] sm:text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};