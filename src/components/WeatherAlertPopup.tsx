import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const WeatherAlertPopup: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPauseActive, setIsPauseActive] = useState(true);

  useEffect(() => {
    // Check if alert was already dismissed in this session
    const dismissed = sessionStorage.getItem('weatherAlertDismissed');
    if (!dismissed) {
      setIsVisible(true);
    }
    
    // Check if pause is still active
    const checkPauseStatus = () => {
      const now = new Date();
      const ukTimeString = now.toLocaleString('en-US', { 
        timeZone: 'Europe/London',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
      });
      const [hours, minutes] = ukTimeString.split(':').map(Number);
      const currentMinutes = hours * 60 + minutes;
      const pauseEndMinutes = 15 * 60 + 30; // 3:30 PM = 15:30
      
      setIsPauseActive(currentMinutes < pauseEndMinutes);
    };
    
    checkPauseStatus();
    const interval = setInterval(checkPauseStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('weatherAlertDismissed', 'true');
  };

  if (!isVisible) return null;

  // Convert IST time to London time
  const istTime = "12:17 PM";
  const londonTime = "07:47 AM"; // IST is 4.5 hours ahead of UK time in August

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={handleDismiss}
      />
      
      {/* Popup */}
      <div className="fixed inset-x-4 top-20 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:max-w-2xl z-50">
        <Card className="relative bg-white shadow-2xl animate-in slide-in-from-top duration-300">
          {/* Header */}
          <div className="bg-red-50 border-b border-red-200 p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-red-900">
                    {isPauseActive ? 'EMERGENCY: ALL CONTROLS PAUSED' : 'UPDATE: RIDE HAS RESUMED'}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 text-xs sm:text-sm text-red-700">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>
                      {londonTime} UK Time ({istTime} IST)
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 rounded-full hover:bg-red-100 transition-colors"
                aria-label="Dismiss alert"
              >
                <X className="h-5 w-5 text-red-600" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-4">
            <div className="space-y-3 text-sm sm:text-base">
              <p className="font-semibold text-gray-900">
                From: London Edinburgh London Volunteers - Liam FitzPatrick
              </p>
              
              <div className="space-y-3 text-gray-700">
                {isPauseActive ? (
                  <>
                    <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4">
                      <p className="font-bold text-red-900 text-lg mb-2">
                        🛑 IMMEDIATE ACTION REQUIRED
                      </p>
                      <p className="text-red-800 font-semibold">
                        All controls have been <strong>PAUSED until 3:30 PM UK time</strong> due to severe weather conditions.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="font-medium text-gray-900">
                        What this means:
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>No riders are allowed to leave any control point until 3:30 PM UK time</li>
                        <li>The pause is mandatory at all locations</li>
                        <li>Time will be added to all riders' overall time limits</li>
                      </ul>
                    </div>
                    
                    <div className="bg-orange-50 border-l-4 border-orange-500 p-3 sm:p-4">
                      <p className="font-semibold text-orange-900 mb-1">
                        ⚠️ DISQUALIFICATION WARNING
                      </p>
                      <p className="text-orange-800">
                        Any rider leaving a control during the pause will be <strong>immediately disqualified</strong> and unable to continue in the event.
                      </p>
                    </div>
                    
                    <p className="font-medium">
                      Controllers and volunteers at all checkpoints have been instructed to enforce this pause. Please follow their instructions for your safety.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="bg-green-50 border-l-4 border-green-500 p-3 sm:p-4">
                      <p className="font-bold text-green-900 text-lg mb-2">
                        ✅ RIDE HAS RESUMED
                      </p>
                      <p className="text-green-800 font-semibold">
                        The weather pause ended at <strong>3:30 PM UK time</strong>. All riders may now continue.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="font-medium text-gray-900">
                        Important information:
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Riders can now leave controls and continue their journey</li>
                        <li>Time limits have been adjusted to account for the pause</li>
                        <li>Please ride safely as conditions may still be challenging</li>
                      </ul>
                    </div>
                    
                    <p className="font-medium">
                      Stay alert and ride according to the conditions. Your safety is paramount.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={handleDismiss}
                className="flex-1 sm:flex-initial px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
              >
                I Understand
              </button>
              <button
                onClick={handleDismiss}
                className="flex-1 sm:flex-initial px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};