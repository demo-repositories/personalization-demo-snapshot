import type { SanityImageSource } from '@sanity/asset-utils';
import createImageUrlBuilder from '@sanity/image-url';
import { createClient } from 'next-sanity';

import { apiVersion, dataset, projectId, studioUrl } from './api';

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === 'production',
  perspective: 'published',
  stega: {
    studioUrl,
    enabled:
      process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' || process.env.NODE_ENV === 'development',
  },
  token: process.env.SANITY_API_READ_TOKEN,
});

const imageBuilder = createImageUrlBuilder({
  projectId: projectId,
  dataset: dataset,
});

export const urlFor = (source: SanityImageSource) =>
  imageBuilder.image(source).auto('format').fit('max').format('webp');
