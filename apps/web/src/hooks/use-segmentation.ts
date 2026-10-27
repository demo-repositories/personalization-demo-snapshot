'use client';

import { useEffect, useState } from 'react';

import {
  createUserContextFromBrowser,
  getPersonalizedContent,
  type SegmentationData,
  type UserContext,
} from '@/lib/segmentation';

/**
 * React hook for handling content personalization
 */
export function useSegmentation(segmentationData: SegmentationData | null) {
  const [userContext, setUserContext] = useState<UserContext>({});
  const [personalizedContent, setPersonalizedContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Create user context from browser environment
    const context = createUserContextFromBrowser();
    setUserContext(context);

    // Get personalized content
    if (segmentationData) {
      const content = getPersonalizedContent(segmentationData, context);
      setPersonalizedContent(content);
    } else {
      setPersonalizedContent(null);
    }

    setIsLoading(false);
  }, [segmentationData]);

  return {
    userContext,
    personalizedContent,
    isLoading,
    isPersonalized: Boolean(segmentationData?.enabled && personalizedContent),
  };
}

/**
 * Hook for previewing specific segments (useful for testing/debugging)
 */
export function useSegmentationPreview(
  segmentationData: SegmentationData | null,
  previewSegment?: string,
) {
  const [userContext, setUserContext] = useState<UserContext>({});
  const [personalizedContent, setPersonalizedContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const context = createUserContextFromBrowser();
    setUserContext(context);

    if (segmentationData) {
      const content = getPersonalizedContent(segmentationData, context, previewSegment);
      setPersonalizedContent(content);
    } else {
      setPersonalizedContent(null);
    }

    setIsLoading(false);
  }, [segmentationData, previewSegment]);

  return {
    userContext,
    personalizedContent,
    isLoading,
    isPersonalized: Boolean(segmentationData?.enabled && personalizedContent),
    previewSegment,
  };
}
