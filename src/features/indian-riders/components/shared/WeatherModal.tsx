import React from 'react';
import { X, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ControlWeatherData } from '../../services/weatherService';
import type { Control } from '../../types/weather';
import { ExtendedWeatherDisplay } from './CompactWeatherDisplay';

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  weather: ControlWeatherData | null;
  control: Control;
}

export const WeatherModal: React.FC<WeatherModalProps> = ({
  isOpen,
  onClose,
  weather,
  control
}) => {
  if (!weather) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MapPin className="h-5 w-5" />
            {control.name} Weather
            <span className="text-sm font-normal text-muted-foreground">
              ({control.km} km)
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <ExtendedWeatherDisplay weather={weather} control={control} />
        </div>
      </DialogContent>
    </Dialog>
  );
};