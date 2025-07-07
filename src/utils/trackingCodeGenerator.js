/**
 * Simple tracking code generator for GRM Issues
 * Format: {PROJECT_CODE}-{YYMMDD}-{RRRR}
 * Example: NID-250707-4729
 */

/**
 * Generate a tracking code with project, date, and random number
 * 
 * Simple tracking code generator for GRM Issues
 * Format: {PROJECT_CODE}-{YYMMDD}-{RRRR}
 * Example: NID-250707-4729
 * 
 * @param {string} projectCode - Project code
 * @param {Date|string|number} issueDate - Issue date (optional, defaults to today)
 * @returns {string} Generated tracking code
 */
export function generateTrackingCode(projectCode, issueDate = null) {
  // Clean project code
  const cleanCode = String(projectCode || 'PROJ')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .substring(0, 10) || 'PROJ';

  // Format date as YYMMDD
  const date = issueDate ? new Date(issueDate) : new Date();
  const year = date.getFullYear().toString().substring(2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  // Generate random 4-digit number
  const randomNum = Math.floor(Math.random() * 9000) + 1000;

  return `${cleanCode}-${dateStr}-${randomNum}`;
}
