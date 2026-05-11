/**
 * Generates a stable internal quote ID in the format GGQ-YYYY-XXXXXX
 * @returns {string}
 */
export const generateInternalQuoteId = () => {
  const year = new Date().getFullYear();
  const randomPart = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `GGQ-${year}-${randomPart}`;
};

/**
 * Validates if a string is a valid Internal Quote ID
 * @param {string} id 
 * @returns {boolean}
 */
export const isValidQuoteId = (id) => {
  return /^GGQ-\d{4}-\d{6}$/.test(id);
};
