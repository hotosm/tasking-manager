export function getTwitterLink(message, url, hashtags) {
  const baseUrl = 'https://twitter.com/intent/tweet';
  return `${baseUrl}?text=${encode(message)}&url=${encode(url)}&hashtags=${hashtags.join(',')}`;
}

export function getLinkedInLink(url) {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encode(url)}`;
}

export function getFacebookLink(message, url) {
  const baseUrl = 'https://web.facebook.com/sharer/sharer.php';
  return `${baseUrl}?display=popup&u=${encode(url)}&quote=${encode(message)}`;
}

const encode = (value) => encodeURIComponent(value);
