import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag: (
      type: string,
      eventName: string,
      parameters?: {
        page_path?: string;
        event_category?: string;
        event_label?: string;
        value?: number;
        [key: string]: any;
      }
    ) => void;
  }
}

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Check if gtag is available
    if (typeof window.gtag !== 'undefined') {
      window.gtag('config', 'G-16LQX6MFZM', {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);
};

export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Specific tracking functions for common events
export const trackSearch = (searchTerm: string) => {
  trackEvent('search', 'engagement', searchTerm);
};

export const trackRiderView = (riderNo: string) => {
  trackEvent('view_rider', 'engagement', riderNo);
};

export const trackWaveView = (wave: string) => {
  trackEvent('view_wave', 'engagement', wave);
};

export const trackMapInteraction = (action: string) => {
  trackEvent(action, 'map_interaction');
};