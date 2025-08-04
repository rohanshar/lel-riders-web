import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RefreshButtonProps {
  isRefreshing: boolean;
  loading: boolean;
  onRefresh: () => void;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  isRefreshing,
  loading,
  onRefresh
}) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onRefresh}
      disabled={isRefreshing || loading}
      className="flex items-center gap-2"
    >
      <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isRefreshing || loading ? 'animate-spin' : ''}`} />
      <span className="hidden sm:inline">{isRefreshing || loading ? 'Refreshing...' : 'Refresh'}</span>
      <span className="sm:hidden">{isRefreshing || loading ? '...' : ''}</span>
    </Button>
  );
};