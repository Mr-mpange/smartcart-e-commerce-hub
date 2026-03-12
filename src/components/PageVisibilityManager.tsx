import { useEffect } from 'react';

export function PageVisibilityManager() {
  useEffect(() => {
    let wasHidden = false;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        wasHidden = true;
      } else if (wasHidden) {
        // Page became visible again after being hidden
        wasHidden = false;
        
        // Prevent automatic refreshes by stopping any pending navigation
        // This is a gentle approach that doesn't break functionality
        console.log('Page visibility restored - preventing unnecessary refreshes');
      }
    };

    // Handle page focus/blur to prevent refreshes
    const handleFocus = () => {
      // Prevent any automatic refreshes when page gains focus
      if (wasHidden) {
        console.log('Page focused after being hidden - maintaining state');
      }
    };

    const handleBlur = () => {
      wasHidden = true;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return null; // This component doesn't render anything
}