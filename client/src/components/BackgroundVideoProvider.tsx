import React, { useEffect, useRef } from "react";
// Import videos directly
import webmVideo from "@assets/videoplayback.webm";
import mp4Video from "@assets/videoplayback.mp4";

interface BackgroundVideoProviderProps {
  children: React.ReactNode;
  opacity?: number;
}

export function BackgroundVideoProvider({
  children,
  opacity = 0.3
}: BackgroundVideoProviderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Ensure video is muted to allow autoplay
    if (videoRef.current) {
      videoRef.current.muted = true;
      // Force video to play
      videoRef.current.play().catch(err => {
        console.error("Error playing video:", err);
      });
    }
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black">
      {/* Fixed fullscreen video background */}
      <div className="fixed inset-0 w-full h-full overflow-hidden z-0">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 object-cover w-full h-full"
          style={{ opacity }}
        >
          <source src={webmVideo} type="video/webm" />
          <source src={mp4Video} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
      
      {/* Content container */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}