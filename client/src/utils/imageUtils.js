const API_URL = import.meta.env.VITE_API_URL || '';

const GOOGLE_DOMAINS = ['books.google.com', 'books.googleusercontent.com'];

export function getBookImageUrl(url) {
  if (!url) return '/placeholder-book.svg';

  const needsProxy = GOOGLE_DOMAINS.some(domain => url.includes(domain));
  if (needsProxy) {
    return `${API_URL}/api/books/proxy-image?url=${encodeURIComponent(url)}`;
  }

  return url;
}
