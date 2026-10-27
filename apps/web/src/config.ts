export const getBaseUrl = () => {
  let url = '';
  if (process.env.VERCEL_ENV === 'production') {
    url = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  } else if (process.env.VERCEL_ENV === 'preview') {
    url = `https://${process.env.VERCEL_URL}`;
  } else {
    url = 'http://localhost:3000';
  }
  // Remove trailing slash if present
  return url.endsWith('/') ? url.slice(0, -1) : url;
};
