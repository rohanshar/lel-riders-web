import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import type { Rider } from '../../types';
import { formatRiderName } from '../../utils/formatters';
import { getStatusBadge } from '../../utils/statusHelpers';
import { RiderStats } from './RiderStats';
import { CheckpointHistory } from './CheckpointHistory';

interface RiderDetailDialogProps {
  rider: Rider | null;
  onClose: () => void;
  allRiders: Rider[];
}

export const RiderDetailDialog: React.FC<RiderDetailDialogProps> = ({
  rider,
  onClose,
  allRiders
}) => {
  if (!rider) return null;
  
  return (
    <Dialog open={!!rider} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {formatRiderName(rider.name, rider.rider_no)}
          </DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-4 mt-2">
              <span>Rider No: {rider.rider_no}</span>
              {getStatusBadge(rider.status, rider)}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          <RiderStats rider={rider} allRiders={allRiders} />
          <CheckpointHistory rider={rider} />
        </div>
      </DialogContent>
    </Dialog>
  );
};