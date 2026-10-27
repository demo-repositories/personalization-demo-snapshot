'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface SegmentPreviewContextType {
  previewSegmentId: string | null;
  setPreviewSegmentId: (segmentId: string | null) => void;
  isPreviewMode: boolean;
}

const SegmentPreviewContext = createContext<SegmentPreviewContextType | undefined>(undefined);

export function useSegmentPreview() {
  const context = useContext(SegmentPreviewContext);
  if (context === undefined) {
    throw new Error('useSegmentPreview must be used within a SegmentPreviewProvider');
  }
  return context;
}

export { SegmentPreviewContext };
