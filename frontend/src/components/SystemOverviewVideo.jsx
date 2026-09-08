import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

/**
 * SystemOverviewVideo
 * 
 * Premium System Overview Video section for NIRIKSHAK AI landing page.
 * - Wide warm off-white rounded card with thin dark border
 * - 2-column desktop layout, single-column responsive stack on mobile/tablet
 * - Background-mode Vimeo player: clean cinematic look with zero player controls, menus, or progress bars
 * - Hover scaling (1.04) with smooth refined shadow and teal/navy glow
 * - Respects prefers-reduced-motion
 * - Shimmering loading skeleton & graceful fallback card
 */
const SystemOverviewVideo = () => {
  const { t } = useLanguage();
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const iframeRef = useRef(null);

  // Fallback timeout in case iframe fails silently or is blocked by strict CSP/adblocker
  useEffect(() => {
    if (isLoaded || hasError) return;

    const timeout = setTimeout(() => {
      // If after 12 seconds it hasn't loaded and user is offline, show fallback
      if (!isLoaded && typeof navigator !== 'undefined' && !navigator.onLine) {
        setHasError(true);
      }
    }, 12000);

    return () => clearTimeout(timeout);
  }, [isLoaded, hasError, retryKey]);

  const handleIframeLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleIframeError = () => {
    setHasError(true);
    setIsLoaded(false);
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoaded(false);
    setRetryKey(prev => prev + 1);
  };

  return (
    <div className="nirikshak-overview-card" role="region" aria-label="System Overview Video and Decision Support Layer">
      {/* Left Column: Descriptive Quote & Signature Heading */}
      <div className="nirikshak-overview-content">
        <blockquote className="nirikshak-overview-quote">
          “Nirikshak AI serves as an explainable decision-support system for MoSPI and district authorities. It brings multi-signal risk factors together to prioritize projects requiring physical verification.”
        </blockquote>

        {/* Elegant Handwritten / Script / Italic-Serif Heading */}
        <div className="nirikshak-overview-signature" aria-label="Nirikshak AI Decision-Support Layer">
          Nirikshak AI Decision-Support Layer
        </div>
      </div>

      {/* Right Column: Cinematic Background-Mode Vimeo Player */}
      <div className="nirikshak-video-column">
        <div className="nirikshak-video">
          <div className="nirikshak-video__frame">
            {/* Loading Skeleton */}
            {!isLoaded && !hasError && (
              <div 
                className="nirikshak-video-skeleton"
                aria-hidden="true"
              >
                <div className="nirikshak-skeleton-shimmer" />
                <div className="nirikshak-skeleton-content">
                  <div className="nirikshak-skeleton-pulse-ring" />
                  <span className="nirikshak-skeleton-text">Loading System Overview...</span>
                </div>
              </div>
            )}

            {/* Error Fallback Card */}
            {hasError ? (
              <div 
                className="nirikshak-video-fallback"
                role="alert"
              >
                <AlertCircle size={28} className="nirikshak-fallback-icon" />
                <p className="nirikshak-fallback-title">
                  System overview video unavailable right now
                </p>
                <p className="nirikshak-fallback-desc">
                  Please check your connection or ad-blocker settings.
                </p>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="nirikshak-fallback-retry"
                  aria-label="Retry loading video"
                >
                  <RotateCcw size={14} style={{ marginRight: '6px' }} />
                  Retry
                </button>
              </div>
            ) : (
              <iframe
                key={retryKey}
                ref={iframeRef}
                src="https://player.vimeo.com/video/1224557584?background=1&autoplay=1&muted=1&loop=1&autopause=0&title=0&byline=0&portrait=0&badge=0"
                title="NIRIKSHAK AI System Overview"
                allow="autoplay; fullscreen; picture-in-picture"
                frameBorder="0"
                style={{
                  opacity: isLoaded ? 1 : 0,
                  transition: 'opacity 0.4s ease-in-out'
                }}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemOverviewVideo;
