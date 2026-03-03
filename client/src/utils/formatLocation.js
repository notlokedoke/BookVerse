/**
 * Extract city name from full location string
 * Examples:
 * "Kathmandu, Metropolitan City, Bagmati Province, Nepal" -> "Kathmandu"
 * "New York, NY, USA" -> "New York"
 * "London" -> "London"
 */
export const formatCityName = (location) => {
  if (!location) return '';
  
  // Split by comma and take the first part (city name)
  const parts = location.split(',');
  return parts[0].trim();
};

/**
 * Format city with country for more context (optional)
 * "Kathmandu, Metropolitan City, Bagmati Province, Nepal" -> "Kathmandu, Nepal"
 */
export const formatCityWithCountry = (location) => {
  if (!location) return '';
  
  const parts = location.split(',').map(p => p.trim());
  
  if (parts.length === 1) {
    return parts[0]; // Just city name
  }
  
  // Return first part (city) and last part (country)
  return `${parts[0]}, ${parts[parts.length - 1]}`;
};
