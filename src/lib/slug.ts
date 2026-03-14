/**
 * Generate a random slug for payment links
 * Format: 8 characters of lowercase letters and numbers
 * Example: "abc12345"
 */
export const generateSlug = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 8 }, () => 
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
};

/**
 * Validate slug format
 */
export const isValidSlug = (slug: string): boolean => {
  return /^[a-z0-9]{8}$/.test(slug);
};
