import React, { useEffect, useRef } from "react";

export function GlobalVideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Ensure video is muted to allow autoplay
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.defaultMuted = true;
      
      // Force video to play
      const playVideo = () => {
        if (videoRef.current) {
          videoRef.current.play().catch(err => {
            console.error("Error playing video:", err);
          });
        }
      };

      playVideo();
      
      // Try playing again after a delay just in case
      setTimeout(playVideo, 1000);
      
      // Also try to play on user interaction
      const handleInteraction = () => {
        playVideo();
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('touchstart', handleInteraction);
      };
      
      window.addEventListener('click', handleInteraction);
      window.addEventListener('touchstart', handleInteraction);
      
      return () => {
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('touchstart', handleInteraction);
      };
    }
  }, []);

  return (
    <div id="global-video-background">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      >
        <source src="/assets/videos/videoplayback.webm" type="video/webm" />
        <source src="/assets/videos/videoplayback.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}