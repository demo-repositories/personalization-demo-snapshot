import { Badge } from '@workspace/ui/components/badge';

import type { PagebuilderType } from '@/types';
import {
  useCTAPersonalization,
  type ComponentPersonalization,
  type CTAContent,
} from '@/lib/component-personalization';
import { useSegmentPreview } from '@/hooks/use-segment-preview';

import { RichText } from '../richtext';
import { SanityButtons } from '../sanity-buttons';

export type CTABlockProps = PagebuilderType<'cta'> & {
  personalization?: ComponentPersonalization<CTAContent>;
};

export function CTABlock({ richText, title, eyebrow, buttons, personalization }: CTABlockProps) {
  const { isPreviewMode, previewSegmentId } = useSegmentPreview();

  // Create fallback content from component props
  const fallbackContent = {
    eyebrow,
    title,
    richText,
    buttons: buttons || undefined,
  };

  const { content, isPersonalized, matchedSegment } = useCTAPersonalization(
    personalization || null,
    fallbackContent,
    previewSegmentId,
  );

  // Use personalized content if available, otherwise use fallback
  const finalContent = content || fallbackContent;

  return (
    <section id="features" className="my-6 md:my-16">
      <div className="container mx-auto px-4 md:px-8">
        {/* Preview mode indicator */}
        {isPreviewMode && (
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200 p-3 text-sm mb-4 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-purple-600 font-medium">🎯 CTA Preview Mode:</span>
              {previewSegmentId ? (
                <span className="text-purple-800">
                  Showing content for "{matchedSegment?.name || 'Unknown Segment'}"
                </span>
              ) : (
                <span className="text-purple-800">
                  Showing default content (no segment targeting)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && isPersonalized && (
          <div className="bg-blue-100 p-2 text-xs mb-4 rounded">
            📊 CTA Personalized for: {matchedSegment?.name}
          </div>
        )}

        <div className="bg-muted py-16 rounded-3xl px-4">
          <div className="text-center max-w-3xl mx-auto space-y-8">
            {finalContent.eyebrow && (
              <Badge variant="secondary" className="bg-zinc-200 dark:text-black">
                {finalContent.eyebrow}
              </Badge>
            )}
            <h2 className="text-3xl font-semibold md:text-5xl text-balance">
              {finalContent.title}
            </h2>
            <div className="text-lg text-muted-foreground">
              <RichText richText={finalContent.richText} className="text-balance" />
            </div>
            <div className="flex justify-center">
              <SanityButtons
                buttons={finalContent.buttons || buttons}
                buttonClassName="w-full sm:w-auto"
                className="w-full sm:w-fit grid gap-2 sm:grid-flow-col lg:justify-start mb-8"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
