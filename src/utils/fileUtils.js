/**
 * File utility functions for file type detection and handling
 */

/**
 * Detect file type from file name extension
 * @param {string} fileName - The file name with extension
 * @returns {string} - 'image', 'audio', or 'unknown'
 */
export const getFileType = (fileName) => {
  if (!fileName || typeof fileName !== 'string') {
    return 'unknown';
  }

  const ext = fileName.toLowerCase().split('.').pop();
  
  // Image file extensions
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'ico'];
  if (imageExtensions.includes(ext)) {
    return 'image';
  }
  
  // Audio file extensions
  const audioExtensions = ['mp3', 'm4a', '3gp', 'wav', 'aac', 'ogg', 'flac', 'wma'];
  if (audioExtensions.includes(ext)) {
    return 'audio';
  }
  
  return 'unknown';
};

/**
 * Check if a file is an image
 * @param {string} fileName - The file name with extension
 * @returns {boolean}
 */
export const isImageFile = (fileName) => {
  return getFileType(fileName) === 'image';
};

/**
 * Check if a file is an audio file
 * @param {string} fileName - The file name with extension
 * @returns {boolean}
 */
export const isAudioFile = (fileName) => {
  return getFileType(fileName) === 'audio';
};

/**
 * Get file extension from file name
 * @param {string} fileName - The file name with extension
 * @returns {string} - File extension without the dot
 */
export const getFileExtension = (fileName) => {
  if (!fileName || typeof fileName !== 'string') {
    return '';
  }
  
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

/**
 * Generate a display name for a file
 * @param {string} fileName - The original file name
 * @param {number} maxLength - Maximum length for display (default: 30)
 * @returns {string} - Truncated file name if needed
 */
export const getDisplayFileName = (fileName, maxLength = 30) => {
  if (!fileName || typeof fileName !== 'string') {
    return 'Unknown file';
  }
  
  if (fileName.length <= maxLength) {
    return fileName;
  }
  
  const ext = getFileExtension(fileName);
  const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
  const truncatedName = nameWithoutExt.substring(0, maxLength - ext.length - 4) + '...';
  
  return ext ? `${truncatedName}.${ext}` : truncatedName;
};