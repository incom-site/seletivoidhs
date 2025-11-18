export interface ProcessedFile {
  url: string;
  type: 'pdf' | 'image' | 'jotform' | 'unknown';
  displayUrl: string;
  isViewable: boolean;
}

export function parseFileUrls(urlString?: string): string[] {
  if (!urlString) return [];

  const trimmed = urlString.trim();

  const urlPattern = /(https?:\/\/[^\s,;]+)/g;
  const matches = trimmed.match(urlPattern);

  if (matches && matches.length > 0) {
    return matches.map(url => url.trim());
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return [trimmed];
  }

  return [];
}

export function processJotformUrl(url: string): ProcessedFile {
  const cleanUrl = url.trim();

  const isJotformUpload = cleanUrl.includes('jotform.com/uploads');
  const isJotformSubmission = cleanUrl.match(/jotform\.com\/\d+/);

  if (isJotformUpload) {
    const fileType = getFileTypeFromUrl(cleanUrl);
    return {
      url: cleanUrl,
      type: fileType,
      displayUrl: cleanUrl,
      isViewable: fileType === 'pdf' || fileType === 'image'
    };
  }

  if (isJotformSubmission) {
    return {
      url: cleanUrl,
      type: 'jotform',
      displayUrl: cleanUrl,
      isViewable: false
    };
  }

  const fileType = getFileTypeFromUrl(cleanUrl);
  return {
    url: cleanUrl,
    type: fileType,
    displayUrl: cleanUrl,
    isViewable: true
  };
}

function getFileTypeFromUrl(url: string): 'pdf' | 'image' | 'jotform' | 'unknown' {
  const lower = url.toLowerCase();

  if (lower.includes('.pdf') || lower.includes('pdf')) return 'pdf';
  if (lower.match(/\.(jpg|jpeg|png|gif|webp|bmp)/)) return 'image';
  if (lower.includes('jotform.com')) return 'jotform';

  return 'unknown';
}

export function processMultipleUrls(urlString?: string): ProcessedFile[] {
  const urls = parseFileUrls(urlString);
  return urls.map(url => processJotformUrl(url));
}
