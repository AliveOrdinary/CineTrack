"use client";

import { useEffect, useRef } from "react";

interface LiveAnnouncerProps {
  message: string;
  priority?: "polite" | "assertive";
  clearOnUnmount?: boolean;
}

export function LiveAnnouncer({ 
  message, 
  priority = "polite", 
  clearOnUnmount = true 
}: LiveAnnouncerProps) {
  const announcerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (announcerRef.current && message) {
      // Clear the announcer first to ensure the message is read
      announcerRef.current.textContent = "";
      
      // Use a small delay to ensure screen readers pick up the change
      const timeoutId = setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = message;
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [message]);

  useEffect(() => {
    return () => {
      if (clearOnUnmount && announcerRef.current) {
        announcerRef.current.textContent = "";
      }
    };
  }, [clearOnUnmount]);

  return (
    <div
      ref={announcerRef}
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
      role="status"
    />
  );
}

// Hook for programmatic announcements
export function useAnnouncer() {
  const announce = (message: string, priority: "polite" | "assertive" = "polite") => {
    // Create a temporary announcer element
    const announcer = document.createElement("div");
    announcer.setAttribute("aria-live", priority);
    announcer.setAttribute("aria-atomic", "true");
    announcer.className = "sr-only";
    announcer.setAttribute("role", "status");
    
    document.body.appendChild(announcer);
    
    // Announce the message
    setTimeout(() => {
      announcer.textContent = message;
    }, 100);
    
    // Clean up after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  };

  return { announce };
} 