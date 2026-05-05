export const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const diffTime = Math.abs(new Date() - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  if (diffDays <= 1) return 'Posted today';
  if (diffDays < 30) return `Posted ${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return 'Posted 1 month ago';
  return `Posted ${diffMonths} months ago`;
};

export const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';

export const getPropertyImages = (property) => {
  if (!property) return [];
  
  let urls = [];
  
  // Add main image if valid
  if (property.main_image_url && typeof property.main_image_url === 'string' && property.main_image_url.startsWith('http')) {
    urls.push(property.main_image_url);
  }
  
  // Safely parse image_urls
  if (property.image_urls) {
    let parsedUrls = [];
    if (Array.isArray(property.image_urls)) {
      parsedUrls = property.image_urls;
    } else if (typeof property.image_urls === 'string') {
      try {
        parsedUrls = JSON.parse(property.image_urls);
        if (!Array.isArray(parsedUrls)) parsedUrls = [parsedUrls];
      } catch (e) {
        // If it's a comma separated string or single URL
        if (property.image_urls.startsWith('http')) {
          parsedUrls = [property.image_urls];
        }
      }
    }
    
    // Filter valid URLs
    parsedUrls = parsedUrls.filter(url => typeof url === 'string' && url.startsWith('http'));
    urls = [...urls, ...parsedUrls];
  }
  
  // Remove duplicates
  return [...new Set(urls)];
};

export const getPropertyImage = (property) => {
  const images = getPropertyImages(property);
  return images.length > 0 ? images[0] : FALLBACK_IMAGE;
};
