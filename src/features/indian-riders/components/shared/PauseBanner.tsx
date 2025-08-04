import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

export const PauseBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const checkPauseStatus = () => {
      // Get current UK time
      const now = new Date();
      const ukTimeString = now.toLocaleString('en-US', { 
        timeZone: 'Europe/London',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      
      // Parse UK time
      const [datePart, timePart] = ukTimeString.split(', ');
      const [month, day, year] = datePart.split('/');
      const [hours, minutes, seconds] = timePart.split(':');
      const ukTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds));
      
      // Pause ends at 3:30 PM UK time today
      const pauseEndTime = new Date(ukTime);
      pauseEndTime.setHours(15, 30, 0, 0); // 3:30 PM
      
      // Check if we're still in the pause period
      if (ukTime < pauseEndTime) {
        setIsVisible(true);
        
        // Calculate time remaining
        const diff = pauseEndTime.getTime() - ukTime.getTime();
        const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
        const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secondsLeft = Math.floor((diff % (1000 * 60)) / 1000);
        
        if (hoursLeft > 0) {
          setTimeRemaining(`${hoursLeft}h ${minutesLeft}m ${secondsLeft}s`);
        } else if (minutesLeft > 0) {
          setTimeRemaining(`${minutesLeft}m ${secondsLeft}s`);
        } else {
          setTimeRemaining(`${secondsLeft}s`);
        }
      } else {
        setIsVisible(false);
      }
    };
    
    checkPauseStatus();
    const interval = setInterval(checkPauseStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-orange-900">All Controls Paused</h4>
              <span className="text-sm text-orange-700">• Until 3:30 PM UK Time</span>
            </div>
            {timeRemaining && (
              <div className="flex items-center gap-1 text-sm">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-orange-900">Resumes in {timeRemaining}</span>
              </div>
            )}
          </div>
          <p className="text-sm text-orange-800 mt-1">
            Riders must remain at controls due to severe weather. The ride will automatically resume at 3:30 PM.
          </p>
        </div>
      </div>
    </div>
  );
};