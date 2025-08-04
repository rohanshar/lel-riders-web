import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const WeatherAlertPopup: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if alert was already dismissed in this session
    const dismissed = sessionStorage.getItem('weatherAlertDismissed');
    if (!dismissed) {
      setIsVisible(true);
    }
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
                    UPDATE: SEVERE WEATHER WARNING
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
                <p>
                  We're updating the messaging about the possibility of holding riders at controls during severe weather.
                </p>
                
                <p className="font-medium text-gray-900">
                  No decision has yet been taken as at 07:00 about pausing.
                </p>
                
                <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4">
                  <p className="font-semibold text-red-900 mb-1">
                    ⚠️ IMPORTANT: Disqualification Warning
                  </p>
                  <p className="text-red-800">
                    If we do call a pause, riders leaving controls against the instructions of controllers and their teams will be <strong>disqualified from the ride</strong> and unable to take further part in the event.
                  </p>
                </div>
                
                <p>
                  This change is because we don't want to imply that a rider can take a risk at the cost of simply a time penalty. Feedback from riders and volunteers overnight has prompted us to make the message simpler.
                </p>
                
                <p className="font-medium">
                  At the moment no pause is in place but if you could start alerting riders to the message that a pause will be enforced that would be very helpful.
                </p>
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