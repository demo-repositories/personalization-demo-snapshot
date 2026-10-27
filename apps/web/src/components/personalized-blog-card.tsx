'use client';

import { useSegmentation } from '@/hooks/use-segmentation';
import type { SegmentationData } from '@/lib/segmentation';

interface PersonalizedBlogCardProps {
  title: string;
  description: string;
  imageUrl?: string;
  slug: string;
  personalization?: SegmentationData;
  className?: string;
}

export function PersonalizedBlogCard({
  title,
  description,
  imageUrl,
  slug,
  personalization,
  className,
}: PersonalizedBlogCardProps) {
  const { personalizedContent, isPersonalized, isLoading } = useSegmentation(
    personalization || null,
  );

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
        <div className="p-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 bg-gray-200 rounded animate-pulse mt-2" />
        </div>
        <div className="p-4 pt-0">
          <div className="h-20 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // Use personalized content if available, otherwise use default content
  const displayTitle = personalizedContent?.title || title;
  const displayDescription = personalizedContent?.description || description;
  const displayImage = personalizedContent?.image || imageUrl;
  const displayCtaText = personalizedContent?.ctaText || 'Read More';

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {displayImage && (
        <div className="aspect-video w-full overflow-hidden">
          <img
            src={displayImage}
            alt={displayTitle}
            className="h-full w-full object-cover transition-transform hover:scale-105"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold line-clamp-2">{displayTitle}</h3>
          {isPersonalized && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              Personalized
            </span>
          )}
        </div>
        <p className="text-gray-600 text-sm line-clamp-3 mb-4">{displayDescription}</p>
        <a
          href={`/blog/${slug}`}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          {displayCtaText}
        </a>
      </div>
    </div>
  );
}

// Example usage in a blog listing component
export function PersonalizedBlogList({ posts }: { posts: any[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PersonalizedBlogCard
          key={post.slug}
          title={post.title}
          description={post.description}
          imageUrl={post.image}
          slug={post.slug}
          personalization={post.personalization}
          className="hover:shadow-lg transition-shadow"
        />
      ))}
    </div>
  );
}
