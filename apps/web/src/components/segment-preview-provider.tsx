"use client";

import { useState, useEffect } from "react";
import { SegmentPreviewContext } from "@/hooks/use-segment-preview";

interface SegmentPreviewProviderProps {
  children: React.ReactNode;
}

export function SegmentPreviewProvider({ children }: SegmentPreviewProviderProps) {
  const [previewSegmentId, setPreviewSegmentId] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Check if we're in preview mode (e.g., in Sanity presentation mode)
  useEffect(() => {
    // Check for preview mode indicators
    const searchParams = new URLSearchParams(window.location.search);
    const hasPreviewParam = searchParams.has('preview') || searchParams.has('sanity-preview');
    const isStudioMode = window.location.pathname.includes('/_preview');
    
    // Check for Next.js draft mode cookie
    const isDraftMode = document.cookie.includes('__prerender_bypass') || 
                       document.cookie.includes('__next_preview_data');
    
    // Check for common Sanity preview patterns
    const isSanityPreview = window.location.hostname.includes('sanity.studio') ||
                           searchParams.has('perspective') ||
                           hasPreviewParam;
    
      const previewMode = isDraftMode || isStudioMode || isSanityPreview || hasPreviewParam;
    
    // For development/testing: also enable if ?segment-preview=true
    const devTestMode = process.env.NODE_ENV === 'development' && 
                       searchParams.has('segment-preview');
    
    const finalPreviewMode = previewMode || devTestMode;
    
    // Always enable preview mode for testing - comment out the line below to use detection
    setIsPreviewMode(true);
    // setIsPreviewMode(finalPreviewMode);
    

  }, []);

  // Store preview segment in sessionStorage to persist across navigation
  useEffect(() => {
    if (isPreviewMode && previewSegmentId) {
      sessionStorage.setItem('sanity-segment-preview', previewSegmentId);
    } else if (isPreviewMode && previewSegmentId === null) {
      sessionStorage.removeItem('sanity-segment-preview');
    }
  }, [previewSegmentId, isPreviewMode]);

  // Restore preview segment from sessionStorage on mount
  useEffect(() => {
    if (isPreviewMode) {
      const storedSegmentId = sessionStorage.getItem('sanity-segment-preview');
      if (storedSegmentId) {
        setPreviewSegmentId(storedSegmentId);
      }
    }
  }, [isPreviewMode]);

  const value = {
    previewSegmentId,
    setPreviewSegmentId,
    isPreviewMode,
  };

  return (
    <SegmentPreviewContext.Provider value={value}>
      {children}
    </SegmentPreviewContext.Provider>
  );
} 